'use client';

import { useEffect, useState, useRef, createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';

type ViewState = 'home' | 'host_lobby' | 'player_lobby' | 'host_game' | 'player_game' | 'leaderboard';
type QuestionData = { question: string; options: string[]; index: number; total: number; timeLimit: number };

const SocketContext = createContext<{ socket: Socket | null }>({ socket: null });
const useSocket = () => useContext(SocketContext).socket!;

export default function QuizPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [view, setView] = useState<ViewState>('home');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const isHostRef = useRef(false);
  
  const [players, setPlayers] = useState<{id: string, playerName: string}[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');

    newSocket.on('room_created', (data) => {
      setRoomCode(data.roomCode);
      isHostRef.current = true;
      setIsHost(true);
      setIsGenerating(false);
      setView('host_lobby');
    });

    newSocket.on('joined_room', (data) => {
      setRoomCode(data.roomCode);
      isHostRef.current = false;
      setIsHost(false);
      setView('player_lobby');
    });

    newSocket.on('timer_tick', (s) => setTimeLeft(s));
    newSocket.on('new_question', (q) => {
      setAnsweredCount(0);
      setCurrentQuestion(q);
      setView(isHostRef.current ? 'host_game' : 'player_game');
    });

    newSocket.on('update_leaderboard', (data) => { setLeaderboard(data); setView('leaderboard'); });
    newSocket.on('player_joined', (p) => setPlayers(prev => [...prev.filter(x => x.id !== p.id), p]));
    newSocket.on('game_started', () => setView(isHostRef.current ? 'host_game' : 'player_game'));
    newSocket.on('player_answered_notif', () => setAnsweredCount(p => p + 1));
    newSocket.on('error', (e) => { setError(e.message); setIsGenerating(false); });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, []);

  if (!socket) return null;

  return (
    <SocketContext.Provider value={{ socket }}>
      <main className="w-full max-w-5xl mx-auto flex flex-col items-center px-4 py-10">
        <h1 className="text-4xl font-black mb-10 text-blue-600 italic uppercase tracking-tighter">AI Quiz Engine</h1>
        {error && <p className="mb-4 text-red-500 font-bold bg-red-50 px-6 py-2 rounded-xl border border-red-200">{error}</p>}

        {view === 'home' && <HomeView onCreate={(s:any) => { setIsGenerating(true); socket.emit('create_room', s); }} onJoin={(c:any, n:any) => socket.emit('join_room', {roomCode:c, playerName:n})} isGenerating={isGenerating} />}
        {view === 'host_lobby' && <HostLobbyView code={roomCode} players={players} />}
        {view === 'player_lobby' && <PlayerLobbyView code={roomCode} />}
        {view === 'host_game' && <HostGameView question={currentQuestion} count={answeredCount} total={players.length} roomCode={roomCode} timeLeft={timeLeft} />}
        {view === 'player_game' && <PlayerGameView question={currentQuestion} code={roomCode} timeLeft={timeLeft} />}
        {view === 'leaderboard' && <LeaderboardView data={leaderboard} roomCode={roomCode} isHost={isHost} currentQ={currentQuestion} />}
      </main>
    </SocketContext.Provider>
  );
}

// --- MODULAR VIEWS ---

function HomeView({ onCreate, onJoin, isGenerating }: any) {
  const [topic, setTopic] = useState('');
  const [numQ, setNumQ] = useState(5);
  const [time, setTime] = useState(20);
  const [c, setC] = useState(''); const [n, setN] = useState('');

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="p-6 bg-white rounded-[2.5rem] border shadow-xl space-y-4">
        <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest px-1">AI Generator Settings</h3>
        <input placeholder="Topik Kuis..." value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-4 border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100" />
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-black text-slate-400 ml-2">SOAL</label>
            <input type="number" value={numQ} onChange={e => setNumQ(parseInt(e.target.value))} className="w-full p-3 border rounded-xl font-bold" />
          </div>
          <div className="space-y-1">
            <label className="font-black text-slate-400 ml-2">WAKTU (S)</label>
            <input type="number" value={time} onChange={e => setTime(parseInt(e.target.value))} className="w-full p-3 border rounded-xl font-bold" />
          </div>
        </div>
        <button onClick={() => onCreate({topic, numQuestions: numQ, timeLimit: time})} disabled={!topic || isGenerating} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all">
          {isGenerating ? "MENCIPTAKAN..." : "CREATE ROOM"}
        </button>
      </div>
      <div className="p-6 bg-white rounded-[2.5rem] border shadow-md space-y-4">
        <input placeholder="ROOM PIN" value={c} onChange={e=>setC(e.target.value)} className="w-full p-4 border rounded-xl text-center font-bold text-xl uppercase tracking-widest" />
        <input placeholder="NICKNAME" value={n} onChange={e=>setN(e.target.value)} className="w-full p-4 border rounded-xl font-bold" />
        <button onClick={() => onJoin(c, n)} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-black transition-all">JOIN GAME</button>
      </div>
    </div>
  );
}

function HostLobbyView({ code, players }: any) {
  const socket = useSocket();
  return (
    <div className="text-center animate-in zoom-in">
      <div className="text-7xl font-black text-blue-600 mb-8 bg-blue-50 py-12 rounded-[4rem] border-4 border-white shadow-inner">{code}</div>
      <div className="bg-white p-8 rounded-[2rem] border mb-8 min-w-[320px]">
        <h3 className="font-bold border-b pb-4 mb-4 flex justify-between uppercase text-xs">Pemain Connected <span>{players.length}</span></h3>
        <div className="flex flex-wrap gap-2">{players.map((p:any) => <span key={p.id} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100">{p.playerName}</span>)}</div>
      </div>
      <button onClick={() => socket.emit('start_game', { roomCode: code })} disabled={players.length === 0} className="w-full py-5 bg-green-500 text-white font-black text-2xl rounded-3xl shadow-xl hover:bg-green-600 transition-all">START QUIZ</button>
    </div>
  );
}

function PlayerLobbyView({ code }: any) {
  return <div className="text-center p-16 bg-white rounded-[3rem] shadow-2xl border animate-in slide-in-from-bottom-10"><h2 className="text-3xl font-black mb-2 text-green-500 italic">Connected!</h2><p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Room {code}</p></div>;
}

function HostGameView({ question, count, total, roomCode, timeLeft }: any) {
  const socket = useSocket();
  if (!question) return <div className="text-2xl font-black text-blue-600 animate-pulse">MEMPERSIAPKAN...</div>;
  return (
    <div className="w-full space-y-8 text-center animate-in fade-in">
      <div className={`text-7xl font-black tabular-nums ${timeLeft <= 5 ? 'text-red-500 animate-bounce' : 'text-slate-800'}`}>{timeLeft}s</div>
      <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border-b-[10px] border-blue-100">
        <h2 className="text-4xl font-black text-slate-800 leading-tight tracking-tight">{question.question}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {question.options.map((opt:string, i:number) => (
          <div key={i} className={`p-8 rounded-3xl text-white font-bold text-2xl flex items-center gap-4 ${['bg-red-500','bg-blue-500','bg-yellow-500','bg-green-500'][i]} shadow-lg`}>
              <span className="text-3xl opacity-30">{['▲', '◆', '●', '■'][i]}</span> {opt}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-6 mt-10">
        <div className="text-2xl font-black text-slate-300 uppercase">Jawaban: {count} / {total}</div>
        <button onClick={() => socket.emit('get_leaderboard', roomCode)} className="px-16 py-5 bg-slate-900 text-white font-black text-xl rounded-2xl shadow-2xl hover:scale-105 transition-all">LIHAT PAPAN SKOR</button>
      </div>
    </div>
  );
}

function PlayerGameView({ question, code, timeLeft }: any) {
  const socket = useSocket();
  const [sent, setSent] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    setSent(false); setCorrect(null);
    const handleResult = (res: {isCorrect: boolean}) => setCorrect(res.isCorrect);
    socket.on('answer_result', handleResult);
    return () => { socket.off('answer_result', handleResult); };
  }, [question, socket]);

  if (!question) return <div className="text-2xl font-black text-blue-600 animate-pulse italic">Menunggu Soal...</div>;
  if (sent) return <div className={`p-20 rounded-[4rem] text-white text-center shadow-2xl animate-in zoom-in ${correct === null ? 'bg-slate-400' : correct ? 'bg-green-500' : 'bg-red-500'}`}><h2 className="text-5xl font-black uppercase italic">{correct === null ? 'SENT!' : correct ? 'BENAR! 🎉' : 'SALAH! ❌'}</h2></div>;
  if (timeLeft === 0) return <div className="text-5xl font-black text-red-500 animate-bounce uppercase p-20 bg-white rounded-[3rem] shadow-2xl">WAKTU HABIS! ⏰</div>;

  return (
    <div className="flex flex-col w-full max-w-md items-center gap-8">
      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border-2 border-white shadow-inner">
        <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${(timeLeft / (question.timeLimit || 20)) * 100}%` }}></div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full h-[65vh]">
        {['bg-red-500','bg-blue-500','bg-yellow-500','bg-green-500'].map((color, i) => (
          <button key={i} onClick={() => { setSent(true); socket.emit('submit_answer', { roomCode: code, answerIndex: i, questionIndex: question.index }); }} 
          className={`${color} rounded-[3rem] shadow-2xl flex items-center justify-center text-9xl text-white active:scale-90 transition-all`}>
            {['▲', '◆', '●', '■'][i]}
          </button>
        ))}
      </div>
    </div>
  );
}

function LeaderboardView({ data, roomCode, isHost, currentQ }: any) {
  const socket = useSocket();
  const isFinished = currentQ && currentQ.index + 1 >= currentQ.total;
  return (
    <div className="w-full max-w-md text-center animate-in slide-in-from-bottom-10">
      <h2 className="text-5xl font-black mb-10 italic text-blue-600 uppercase tracking-tighter">{isFinished ? "🏆 FINAL SCORE" : "LEADERBOARD"}</h2>
      <div className="bg-white rounded-[3.5rem] shadow-2xl p-10 space-y-4 border-2">
        {data.length === 0 ? <p className="text-slate-400 font-bold uppercase text-xs">Belum ada skor</p> : 
          data.map((p: any, i: number) => (
            <div key={i} className={`flex justify-between p-6 rounded-3xl font-black text-2xl items-center ${i === 0 ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-slate-50'}`}>
              <span className="flex items-center gap-4"><span>{i === 0 ? '👑' : `#${i+1}`}</span> {p.name}</span>
              <span className="text-blue-600">{p.score}</span>
            </div>
          ))
        }
      </div>
      {isHost && !isFinished && (
        <button onClick={() => socket.emit('send_question', { roomCode, questionIndex: currentQ.index + 1 })} className="mt-12 w-full py-6 bg-blue-600 text-white font-black text-2xl rounded-[2rem] shadow-xl hover:bg-blue-700 transition-all active:scale-95 uppercase">Next Question</button>
      )}
      {isFinished && <p className="mt-10 font-black text-slate-400 uppercase tracking-widest animate-pulse italic">Kuis Selesai!</p>}
    </div>
  );
}