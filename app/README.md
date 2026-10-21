# Sistem Simulasi Sanksi Komentar AI (Demo PPKN)

Aplikasi demonstrasi penegakan norma & etika digital dengan sanksi berjenjang dan peninjauan realtime oleh AI (tanpa database).

## Fitur Utama

1. **Moderasi AI Realtime**: Memeriksa komentar kasar, jorok, dan tidak pantas menggunakan Vercel AI SDK.
2. **Sanksi Berjenjang**:
   - **Level 1 (Peringatan)**: Komentar tetap tampil + popup notifikasi AI.
   - **Level 2 (Mute 24 Jam)**: Komentar disembunyikan + akun dibisukan 24 jam.
   - **Level 3 (Mute 7 Hari)**: Komentar disembunyikan + akun dibisukan 7 hari.
   - **Level 4 (Pembatasan Akun)**: Akses menulis komentar dikunci secara permanen.
3. **Penyimpanan Berbasis JSON**: Menggunakan `data/comments.json` dan `data/accounts.json`.
4. **Anti-slop UI**: Desain modern, bersih, minimalis menggunakan Tailwind CSS & Lucide icons.

## Cara Menjalankan

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Setup Environment**:
   Salin file `.env.local.example` ke `.env.local`, lalu isi API key dari provider Anda:

   ```bash
   cp .env.local.example .env.local
   ```

   Konfigurasi moderasi AI berjalan di server melalui `AI_PROVIDER`, `AI_API_KEY`, dan `AI_MODEL`. Contoh ini memakai Gemini (`AI_PROVIDER=google`, `AI_MODEL=gemini-2.5-flash`). Ambil API key dari Google AI Studio dan isi hanya di `.env.local`. Provider `openai` (termasuk endpoint OpenAI-compatible) dan `anthropic` juga tersedia. Jangan letakkan API key di kode frontend atau commit file `.env.local`.

   Tanpa API key yang valid, sistem memakai moderasi lokal berbasis kata kunci untuk demo.

3. **Jalankan Project**:
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000`.
