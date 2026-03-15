require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// 1. Validasi Environment
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY tidak ditemukan di .env!');
  process.exit(1);
}

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});

// 2. Inisialisasi Gemini 3 Flash (Versi 2026)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// 3. Data Storage
const activeRoomsData = {};
const roomIntervals = {};

// 4. Helper Functions
const generateRoomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

async function generateAIQuestions(topic, count) {
  const prompt = `Anda adalah pembuat soal profesional. Buatlah tepat ${count} soal pilihan ganda tentang "${topic}" dalam bahasa Indonesia.
  Ketentuan: 4 pilihan jawaban, 1 jawaban benar.
  Output WAJIB JSON array mentah tanpa markdown:
  [{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonMatch = response.text().match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) throw new Error("AI gagal menghasilkan format JSON yang benar.");
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`[AI_ERROR]: ${error.message}`);
    throw error;
  }
}

function startRoomTimer(roomCode, seconds) {
  if (roomIntervals[roomCode]) clearInterval(roomIntervals[roomCode]);

  let timeLeft = seconds;
  if (activeRoomsData[roomCode]) activeRoomsData[roomCode].currentTimeLeft = timeLeft;
  
  io.to(roomCode).emit('timer_tick', timeLeft);

  roomIntervals[roomCode] = setInterval(() => {
    timeLeft--;
    if (activeRoomsData[roomCode]) activeRoomsData[roomCode].currentTimeLeft = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(roomIntervals[roomCode]);
      io.to(roomCode).emit('timer_tick', 0);
      io.to(roomCode).emit('time_up');
    } else {
      io.to(roomCode).emit('timer_tick', timeLeft);
    }
  }, 1000);
}

// 5. Socket Logic
io.on('connection', (socket) => {
  socket.data = { playerName: '', roomCode: '', score: 0, isHost: false };

  // HOST: Create Room
  socket.on('create_room', async ({ topic, numQuestions, timeLimit }) => {
    try {
      if (!topic?.trim()) return socket.emit('error', { message: 'Topik wajib diisi!' });
      
      const count = Math.min(Math.max(numQuestions || 5, 1), 15);
      const questions = await generateAIQuestions(topic.trim(), count);
      const roomCode = generateRoomCode();
      
      activeRoomsData[roomCode] = {
        questions,
        timeLimit: timeLimit || 20,
        currentTimeLeft: timeLimit || 20,
        hostId: socket.id
      };

      socket.join(roomCode);
      socket.data = { ...socket.data, roomCode, isHost: true };
      socket.emit('room_created', { roomCode, questions });
      console.log(`✅ Room ${roomCode} created for: ${topic}`);
    } catch (err) {
      socket.emit('error', { message: `Gagal meracik soal: ${err.message}` });
    }
  });

  // PLAYER: Join Room
  socket.on('join_room', ({ roomCode, playerName }) => {
    if (!io.sockets.adapter.rooms.has(roomCode) || !activeRoomsData[roomCode]) {
      return socket.emit('error', { message: 'PIN tidak ditemukan!' });
    }
    socket.join(roomCode);
    socket.data = { playerName, roomCode, score: 0, isHost: false };
    io.to(roomCode).emit('player_joined', { id: socket.id, playerName });
    socket.emit('joined_room', { roomCode, playerName });
  });

  // GAME ENGINE
  socket.on('start_game', ({ roomCode }) => {
    const room = activeRoomsData[roomCode];
    if (!room) return;
    io.to(roomCode).emit('game_started');
    setTimeout(() => {
      io.to(roomCode).emit('new_question', { 
        ...room.questions[0], index: 0, total: room.questions.length, timeLimit: room.timeLimit 
      });
      startRoomTimer(roomCode, room.timeLimit);
    }, 2000);
  });

  socket.on('send_question', ({ roomCode, questionIndex }) => {
    const room = activeRoomsData[roomCode];
    if (room?.questions[questionIndex]) {
      io.to(roomCode).emit('new_question', { 
        ...room.questions[questionIndex], index: questionIndex, total: room.questions.length, timeLimit: room.timeLimit 
      });
      startRoomTimer(roomCode, room.timeLimit);
    }
  });

  socket.on('submit_answer', ({ roomCode, answerIndex, questionIndex }) => {
    const room = activeRoomsData[roomCode];
    if (!room) return;

    const isCorrect = answerIndex === room.questions[questionIndex].correctIndex;
    if (isCorrect) {
      const speedBonus = (room.currentTimeLeft || 0) * 5;
      socket.data.score += (100 + speedBonus);
    }

    io.to(roomCode).emit('player_answered_notif', { playerName: socket.data.playerName });
    socket.emit('answer_result', { isCorrect, currentScore: socket.data.score });
  });

  socket.on('get_leaderboard', (roomCode) => {
    const roomSockets = io.sockets.adapter.rooms.get(roomCode);
    if (!roomSockets) return;
    if (roomIntervals[roomCode]) clearInterval(roomIntervals[roomCode]);

    const leaderboard = Array.from(roomSockets).map(id => {
      const s = io.sockets.sockets.get(id);
      return { name: s.data.playerName, score: s.data.score || 0 };
    }).filter(p => p.name).sort((a, b) => b.score - a.score);

    io.to(roomCode).emit('update_leaderboard', leaderboard);
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      setTimeout(() => {
        if (!io.sockets.adapter.rooms.get(roomCode)) {
          delete activeRoomsData[roomCode];
          if (roomIntervals[roomCode]) clearInterval(roomIntervals[roomCode]);
        }
      }, 5000);
    }
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));