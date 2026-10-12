# Catatan pengujian milestone 5

## Hasil akhir

- `pnpm test`: **39/39 lulus**.
- `pnpm build`: TypeScript dan build produksi berhasil. Bundel 3D sekitar 1,25 MB sebelum gzip; Vite memberi pemberitahuan ukuran bundel.
- Browser lokal berhasil memuat kantor dua lantai tanpa error console pada pemeriksaan akhir.
- Simulasi penuh 07:00–19:30 pada interval 0,5 menit game menghasilkan nol posisi tidak valid, delapan staf pulang, 18 catatan resepsionis, dan empat perbaikan komputer selesai. Kegiatan membaca, WC, minum, memasak, inspeksi, dan diskusi pribadi juga selesai.

## Cakupan pengujian otomatis

| Kelompok | Jumlah | Yang diperiksa |
| --- | ---: | --- |
| Simulasi dasar | 9 | Rasio 24 menit nyata/hari, kecepatan, pause, pergantian hari, jadwal, income, kebutuhan, tabrakan Avatar, save dan migrasi |
| Navigasi dua lantai | 5 | Sebelas ruangan, luas workspace 2×, seluruh 45 titik aktivitas, naik/turun tangga, posisi tengah tangga, bordes Avatar, tujuh antrean/kursi |
| Rutinitas kantor | 10 | Amanda pertama datang, absen satu per satu, tujuh pekerja di meja sebelum 08:00, pantry 12:00 dan kerja 13:00, rapat 30–60 menit setelah tujuh peserta duduk, checkout/Amanda terakhir pulang, akhir pekan, migrasi, income setelah tutup, checkout melewati 17:00, jeda acak yang tersebar |
| Tugas dan tamu | 6 | Private meeting menunggu dua kursi, Nexus benar-benar tiba dan memperbaiki PC Founder, target inspeksi tetap tersedia, durasi membaca, layanan client, pemulihan repair dari tengah tangga |
| Sosial | 9 | Percakapan bertahap, manfaat dan hubungan, Akbar ikut berinteraksi, kursi unik, peserta sibuk/Amanda/jam tutup, pembatalan dan pause, save/resume serta data rusak |

## Pemeriksaan browser milestone 5

- Tata **Lantai 1 / Lantai 2 / Semua** dan peta 11 ruangan berfungsi. Ketiga ruangan atas berada pada ketinggian lantai dua; tangga dan pagar tampak pada tampilan seluruh kantor.
- Kontrol lantai dapat dipakai pada tampilan ringkas 614×517 maupun desktop 1366×900; panel peta dan delapan staf tampil pada desktop.
- Kantor malam kosong. Pada pagi hari, staf datang bertahap, status menuju resepsionis tampil, dan catatan Amanda mencatat masuk satu per satu.
- Amanda terlihat berdiri di belakang counter. Akbar terlihat duduk di komputer Founder; empat pekerja terlihat duduk di kursi depan komputer Open Workspace.
- Aktivitas memasak NOVA di Pantry serta membaca SAGE di Library terlihat. Status WC, private meeting, inspeksi dan perbaikan muncul pada daftar staf selama simulasi berjalan.
- Mode Avatar dapat dibuka dan kembali ke Director. Navigasi penuh tangga Avatar diverifikasi pada pengujian otomatis.
- Save pada Selasa hari 2, 14:26, 1.830 Credits, lantai bawah/Pantry dan pause tetap sama setelah reload; aktivitas dan kebutuhan juga dipulihkan.
- Tidak ditemukan error atau peringatan console browser pada pemeriksaan akhir. Pratinjau disimpan di folder outputs sebagai gambar milestone 5.

## Batas validasi

Pengujian memeriksa state, jalur, elevasi, pemesanan tempat, durasi kegiatan dan penyimpanan. Pemeriksaan browser adalah pemeriksaan visual sebagian rutinitas; setiap variasi rapat, repair, tamu, dan gestur belum diamati satu per satu. Belum ada perbandingan otomatis tiap frame atau uji GPU/perangkat lain.

Karakter serta animasi masih prosedural bergaya miniatur. Kursi memakai titik duduk tetap; kontak tangan/kaki belum memakai inverse kinematics. Avatar belum dapat memakai furnitur, dan NPC belum saling menghindari secara fisik. Tamu dilayani di resepsionis; wawancara HRD lengkap belum diterapkan. Semua simulasi dan dialog berjalan lokal tanpa AI API.

Cara menjalankan tersedia di [README.md](README.md); pemetaan animasi ada di [ANIMATION_PLAN.md](ANIMATION_PLAN.md).
