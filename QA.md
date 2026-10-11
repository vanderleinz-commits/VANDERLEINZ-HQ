# Catatan pengujian milestone 3

## Hasil

- `pnpm test`: **17/17 lulus**.
- `pnpm build`: pemeriksaan TypeScript dan build produksi lulus.
- Preview localhost: HTTP 200.
- Pada pemeriksaan browser milestone 3, tidak ada error/warning aplikasi yang tercatat.

## Simulasi dan navigasi

Sembilan pengujian dasar memeriksa rasio waktu 1x/2x/3x, pergantian hari, pause, 48 titik aktivitas (8 ruangan × 6 NPC), tabrakan Avatar terhadap dinding/furnitur, kedatangan saat makan siang, pendapatan kerja, kebutuhan selama dua hari, migrasi save, dan pemulihan posisi serta arahan.

Pengujian kedatangan dasar memakai jeda interaksi otomatis agar dapat memeriksa jadwal secara tersendiri. Perjalanan dan pertemuan sosial diperiksa dalam kelompok pengujian berikutnya.

## Interaksi dan save

Delapan pengujian tambahan memeriksa:

1. NPC berjalan aman, menunggu pasangan, bergantian berbicara, memperoleh hubungan, dan tidak mengubah state sebelumnya.
2. Ngobrol, brainstorm, dan memberi semangat selesai dari ruangan yang berjauhan dengan manfaat masing-masing.
3. Peserta sibuk, peserta yang sama, dan indeks peserta tidak valid ditolak.
4. Tiga pasangan otomatis memesan enam titik berbeda dan bertukar rekan selama empat jam game.
5. Pause membekukan kegiatan; arahan pribadi membatalkan kegiatan kedua peserta dengan aman.
6. Percakapan aktif, phase, durasi, kedekatan, dan catatan kantor pulih setelah save/reload.
7. Save milestone 2 dimigrasikan dengan mempertahankan waktu, Credits, kebutuhan, dan arahan.
8. Data interaksi rusak, duplikat, kedaluwarsa, dan nilai hubungan di luar batas ditolak atau dipulihkan.

## Pemeriksaan di browser

- Panel Team → ATLAS → Interaksi & hubungan menampilkan pilihan rekan, kegiatan, dan kelima hubungan.
- Interaksi otomatis ATLAS–NOVA meningkatkan kedekatan 25 → 33.
- Arahan brainstorm membawa keduanya dari Lounge ke Meeting Room, menampilkan giliran dialog dan gelembung 3D, lalu meningkatkan kedekatan 33 → 41 (Akrab).
- Office Stories menampilkan empat kegiatan selesai pada skenario uji.
- Kegiatan Beri semangat ATLAS–NOVA yang dijeda dipulihkan setelah refresh. Day 2, 02:04, Credits 1560, dan status pause tetap sama.
- Pilihan Kurangi animasi tetap dicentang setelah Save + refresh, lalu dikembalikan ke animasi penuh setelah pengujian.
- Rig Avatar dapat bergerak dengan input S dan menyapa ATLAS. Dialog muncul dan tombol sapaan memasuki jeda.
- Secara visual, rig baru, gestur percakapan, giliran gelembung dialog, lampu, pintu kaca, dan dekorasi terlihat di panel preview.

## Batas pengujian

Pemeriksaan dilakukan di browser internal Codex pada komputer ini, dengan panel sekitar 614×510. Animasi sendi diperiksa melalui tampilan browser dan kode penggeraknya; belum ada perbandingan otomatis tiap frame atau pengujian GPU/perangkat ponsel lain. Pose berdiri, gerak tangan, dan dekorasi masih menggunakan animasi prosedural. Tabrakan antar-karakter dan animasi duduk belum diterapkan.

Build memberi peringatan ukuran bundle sekitar 1,18 MB JavaScript (sekitar 331 KB gzip), terutama renderer 3D. Build tetap berhasil. Batas prototype dan cara menjalankan dijelaskan di README; pemetaan animasi ada di ANIMATION_PLAN.md.
