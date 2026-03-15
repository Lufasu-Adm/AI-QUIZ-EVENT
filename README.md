# 🧠 AI-QUIZ-EVENT

AI-Quiz-Event adalah platform manajemen acara kuis interaktif modern yang ditenagai oleh Kecerdasan Buatan (AI). Aplikasi ini dirancang untuk memudahkan penyelenggara dalam membuat, mengelola, dan menjalankan sesi kuis secara *real-time* dengan soal-soal yang dapat di-generate otomatis menggunakan AI.

## ✨ Fitur Utama

Berikut adalah visualisasi fitur utama yang sedang dalam tahap pengembangan:

### 1. 🤖 AI Question Generator

![AI Question Generator](docs/images/feature-ai-question-generator.png)

<!-- Ganti gambar ini dengan screenshot fitur AI Question Generator -->

*Fitur ini memungkinkan pembuatan soal kuis secara otomatis berdasarkan topik atau materi tertentu menggunakan integrasi AI, sangat cocok untuk mempercepat persiapan acara.*

### 2. ⚡ Real-Time Quiz Sessions

![Real Time Quiz Session](docs/images/feature-realtime-quiz.png)

<!-- Ganti gambar ini dengan screenshot fitur sesi kuis real-time -->

*Peserta dapat mengikuti kuis secara langsung dengan sinkronisasi waktu nyata antara layar penyelenggara dan peserta.*

### 3. 📊 Live Leaderboard

![Live Leaderboard](docs/images/feature-live-leaderboard.png)

<!-- Ganti gambar ini dengan screenshot leaderboard peserta -->

*Papan peringkat interaktif yang terus diperbarui setiap kali peserta menjawab soal, menambah keseruan dan kompetisi.*

### 4. 🎨 Modern & Responsive UI

![Modern Responsive UI](docs/images/feature-ui-responsive.png)

<!-- Ganti gambar ini dengan screenshot tampilan UI aplikasi -->

*Antarmuka pengguna yang mulus dan responsif, dibangun dengan Next.js dan Tailwind CSS, memberikan pengalaman terbaik di PC maupun smartphone.*

---

## 🛠️ Tech Stack

Proyek ini dibangun menggunakan arsitektur modern dengan pemisahan *Client* dan *Server*.

### Frontend (Client)

* Next.js (App Router)
* TypeScript
* Tailwind CSS

### Backend (Server)

* Node.js
* Express.js

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

Pastikan Node.js sudah terinstal di komputer Anda.

### 1. Clone Repository

```bash
git clone https://github.com/Lufasu-Adm/AI-QUIZ-EVENT.git
cd AI-QUIZ-EVENT
```

### 2. Jalankan Backend Server

```bash
cd server
npm install

# konfigurasi environment
# buat file .env dan isi variable seperti PORT dan API_KEY

npm start
# atau
node index.js
```

Server biasanya berjalan di:

```
http://localhost:5000
```

### 3. Jalankan Frontend Client

Buka terminal baru lalu jalankan:

```bash
cd client
npm install
npm run dev
```

Frontend akan berjalan di:

```
http://localhost:3000
```

---

## 📁 Struktur Proyek

```
AI-QUIZ-EVENT
│
├── client/          # Next.js frontend
│   ├── app/
│   ├── components/
│   └── styles/
│
├── server/          # Express backend
│   ├── routes/
│   ├── controllers/
│   └── services/
│
└── README.md
```

---

## 🌐 Use Case

Platform ini cocok digunakan untuk:

* Event kampus
* Webinar interaktif
* Ice breaking seminar
* Kuis edukasi sekolah
* Kompetisi online

Dengan AI Question Generator, penyelenggara tidak perlu lagi membuat ratusan soal secara manual.

---

## 👨‍💻 Author

Dibuat dengan semangat oleh **Jordan Wijayanto**

GitHub: [https://github.com/Lufasu-Adm](https://github.com/Lufasu-Adm)
