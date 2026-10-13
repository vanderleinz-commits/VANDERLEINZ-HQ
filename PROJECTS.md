# Project 001 — Petualangan ulang tahun Dani

## Paket proyek

- Client A: video ulang tahun Dani, 10–15 detik, dunia balok bergaya Minecraft.
- Hasil: MP4 14 detik, 1280 × 720, 30 fps, H.264/yuv420p + AAC stereo.
- Aset di public/projects/dani: video.mp4 dan poster.jpg.
- Geometri voxel, ilustrasi, animasi, ucapan, dan musik sintetis dibuat khusus; tanpa aset game yang disalin dan tanpa AI API.
- scripts/render-dani.py mereproduksi video memakai Python, Pillow, dan imageio-ffmpeg.

## Cerita dan aturan sesi

src/projectStory.ts menyimpan identitas versi, deadline, adegan, penugasan, dialog, emosi, dan lokasi duduk. Senin membahas brief dan storyboard; Selasa animasi, masalah render, konsultasi HR, dan perbaikan; Rabu pemeriksaan dan penyerahan. Perjalanan, tangga, absensi, kursi, jam istirahat dan pulang memakai sistem kantor yang sama.

Video sudah disiapkan sebelum pengguna membuka kantor. Aktivitas kantor adalah pementasan scripted proses proyek. Tidak ada proses rendering video atau layanan AI yang berjalan diam-diam di browser.

src/projectSession.ts memulai setiap sesi proyek yang belum diputuskan pada Senin hari 1 pukul 06:00, dalam keadaan pause. Baseline saldo mencegah pengulangan menambah saldo tanpa batas. Metadata proyek dan hasil dipisahkan dari save kantor biasa. Refresh, membuka kembali, atau kembali lewat browser history mengulang proyek yang belum diputuskan. Tab tidak aktif menghentikan waktu.

Pada Rabu 16:00 jam menunggu keputusan; gerak tetap berjalan agar Founder/client bisa mencapai tempat duduk. Saldo dan kebutuhan tidak terus berubah saat jam menunggu. Video terbuka setelah Client A dan Atlas duduk, Founder aktif di ruang meeting client, dan interaksi pertemuan telah dimulai.

Keputusan dan checkpoint kantor ditulis sebagai satu record localStorage. Kegagalan penyimpanan tidak menandai proyek selesai. Meminta revisi wajib disertai catatan. Keputusan tersimpan mengakhiri cerita versi tersebut; kantor biasa melanjutkan waktu dan save. Revisi berikutnya dipersiapkan lewat chat dengan ID versi baru, aset baru, dan cerita yang disesuaikan. Belum ada sinkronisasi keputusan antarperangkat.

## Verifikasi pengembangan

pnpm test mencakup perjalanan tiga hari, reset/replay, baseline saldo, tempat duduk rapat/perpustakaan/HR, absensi client, deadline, pembatasan penyerahan, keputusan idempoten, kegagalan storage, revisi, dan kelanjutan kantor.

Saat pnpm dev, URL /?qa=project menampilkan tombol QA lokal untuk menjalankan substep simulasi sampai deadline. Tombol ini tidak ada dalam build produksi. Gunakan browser/origin lokal pengujian agar keputusan QA tidak memengaruhi save situs yang dipublikasikan.
