Buatkan saya aplikasi web Next.js untuk simulasi/demonstrasi sistem sanksi komentar kasar, jorok, dan tidak pantas — realtime dan ditinjau AI, tanpa database.

KERJAKAN SECARA BERTAHAP
Jangan kerjakan semuanya sekaligus. Selesaikan satu tahap, tunjukkan hasilnya, baru lanjut ke tahap berikutnya:

TAHAP 1 — Fondasi project
- Buat project Next.js (App Router) baru.
- Siapkan struktur folder data/ untuk file JSON, dan utility untuk membaca/menulis file JSON dengan aman (buat file default jika belum ada).
- Siapkan mekanisme id akun simulasi lewat cookie (dibuat otomatis kalau pengunjung belum punya).
Tunjukkan struktur foldernya dulu sebelum lanjut.

TAHAP 2 — Lapisan AI yang bisa ganti provider
- Buat satu module/service (mis. lib/ai-provider.ts) yang membungkus pemanggilan AI untuk menilai komentar, dengan interface yang sama apa pun providernya.
- Provider AI harus bisa dipilih lewat environment variable, misalnya AI_PROVIDER=anthropic|openai|custom, dan AI_API_KEY serta AI_BASE_URL/AI_MODEL sebagai konfigurasi umum.
- Buat implementasi untuk minimal 2 provider sebagai contoh (mis. Anthropic dan OpenAI-compatible endpoint), tapi desain kodenya agar mudah menambah provider lain hanya dengan menambah satu file/function baru — jangan hardcode ke satu vendor tertentu.
- Fungsi ini mengirim komentar dan mengharapkan balasan terstruktur (JSON): melanggar (true/false), kategori pelanggaran, dan alasan singkat.
- API key TIDAK BOLEH terlihat di kode client, hanya dipakai di sisi server (API route).
Tunjukkan hasil module ini dulu sebelum lanjut.

TAHAP 3 — Logika sanksi
- Buat logic penentuan level sanksi berdasarkan jumlah pelanggaran di riwayat akun (dibaca dari file JSON):
  - Level 1 — Peringatan: pelanggaran pertama, komentar tetap tampil.
  - Level 2 — Mute singkat: pelanggaran ke-2, komentar disembunyikan, akun dibisukan 24 jam (pakai timestamp untuk simulasi durasi).
  - Level 3 — Mute panjang: pelanggaran ke-3, akun dibisukan 7 hari.
  - Level 4 — Pembatasan akun: pelanggaran berulang setelah level 3, fitur komentar dikunci sampai direset.
Tunjukkan hasil logic ini dulu sebelum lanjut.

TAHAP 4 — API routes
- POST /api/comments — menerima komentar, memanggil lapisan AI dari Tahap 2, menentukan sanksi dari Tahap 3, menyimpan ke file JSON.
- Endpoint realtime — pilih salah satu yang paling mudah diimplementasikan dengan baik: Server-Sent Events di /api/stream, ATAU endpoint GET untuk di-polling frontend tiap beberapa detik. Sebutkan pilihan mana yang dipakai dan kenapa.
- POST /api/reset — mengosongkan riwayat pelanggaran akun saat ini di file JSON.
Tunjukkan hasil API routes ini dulu sebelum lanjut.

TAHAP 5 — Tampilan (UI)
- Halaman utama menampilkan: feed komentar, kolom input komentar, indikator status akun (aman/peringatan/dibisukan/dibatasi), panel riwayat pelanggaran, dan tombol reset.
- Komponen popup peringatan yang muncul otomatis saat AI menandai komentar sebagai bermasalah, menampilkan alasan dan sanksi yang berlaku.
- Feed dan status akun ter-update otomatis lewat mekanisme realtime dari Tahap 4, tanpa reload halaman.
- Styling rapi dan mudah dibaca (Tailwind CSS boleh dipakai).

TAHAP 6 — Finalisasi
- Buat contoh .env.local dengan AI_PROVIDER, AI_API_KEY, AI_BASE_URL, AI_MODEL sebagai placeholder (jangan API key asli).
- Tulis instruksi singkat cara menjalankan project secara lokal (npm install, isi .env.local, npm run dev) dan cara mengganti provider AI hanya dengan mengubah environment variable.

CATATAN UMUM
- Tanpa login/registrasi — akun ditentukan otomatis lewat cookie sesi.
- Tanpa database — semua data (komentar, riwayat pelanggaran) disimpan di file JSON di folder data/.
- Struktur kode rapi, mudah dikembangkan lebih lanjut, dengan komentar penjelasan secukupnya, karena ini dipakai untuk demo/presentasi.