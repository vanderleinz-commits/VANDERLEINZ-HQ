# VANDERLEINZ-HQ

## AI HQ — Office Tycoon Simulator

## Milestone 4: kantor, rutinitas harian, dan karakter duduk

Kantor 3D miniatur dengan palet pastel blue/cream/wood, delapan ruangan, tujuh karakter scripted, mode Director/Avatar, waktu dipercepat, local save, dan HQ Credits virtual. Dibangun memakai React, TypeScript, React Three Fiber, dan Three.js. Geometri karakter, dialog, animasi, dan simulasi berjalan lokal tanpa AI API, API key, akun, atau pembayaran nyata.

## Menjalankan

Buka terminal di folder proyek ini:

```sh
pnpm install
pnpm dev
```

Buka [http://127.0.0.1:5173](http://127.0.0.1:5173) atau alamat Local yang muncul di terminal. Biarkan terminal berjalan selama bermain. Refresh halaman untuk memuat pembaruan. Internet diperlukan untuk mengunduh dependensi pertama kali.

Aplikasi memerlukan Node.js 20.19+ dan pnpm. Pengujian TypeScript bawaan memerlukan Node.js 22.18+ atau 24.

```sh
pnpm test
pnpm build
pnpm preview
```

Save terikat pada browser dan alamat/port. Alamat localhost dan 127.0.0.1 memakai penyimpanan berbeda; gunakan alamat yang sama untuk melanjutkan permainan.

## Desain kantor dan tim

Pintu utama kaca ganda, teras masuk, penanda kantor, dan resepsionis menjadi jalur kedatangan dan kepulangan. Dari resepsionis, koridor menghubungkan pintu setiap ruangan. Furnitur memakai detail meja, monitor, keyboard, kursi kantor, meja rapat, rak, tanaman, dan perlengkapan sesuai departemen. Lampu dan layar merespons jam buka.

| Karakter | Tugas | Tempat utama |
| --- | --- | --- |
| ATLAS | Mengatur operasional | Open Workspace |
| NOVA | Mendesain karya | Creative Studio |
| LYRA | Menyusun agenda tim | Open Workspace |
| ORION | Menganalisis riset | Research Lab |
| SAGE | Menyiapkan program komunitas | Director Office |
| NEXUS | Memantau sistem | Server Room |
| Amanda | Menyambut tamu | Reception |

Meeting Room dan Canteen memiliki masing-masing enam kursi untuk tim. Amanda berdiri di belakang meja resepsionis selama kantor buka, lalu pulang bersama tim. Tugas ditampilkan sesuai peran; sistem pekerjaan masih memakai progres kerja dan Credits.

## Jadwal harian

Permainan baru dimulai pada **Senin, 07:00**. Nama hari berulang dari Senin sampai Minggu; sementara seluruh tim bekerja setiap hari, termasuk akhir pekan.

| Waktu game | Rutinitas |
| --- | --- |
| 07:00 | Lampu menyala; Amanda masuk melalui pintu utama menuju resepsionis |
| 07:06–07:41 | ATLAS, NOVA, LYRA, ORION, SAGE, dan NEXUS datang bergantian dengan selang tujuh menit |
| 07:00–08:00 | Tim bersiap di ruang masing-masing |
| 08:00–12:00 | Bekerja di depan komputer, diselingi rapat atau perjalanan singkat dalam departemen |
| 12:00–13:00 | Enam pekerja menuju Canteen, duduk, makan/minum, dan mengobrol; Amanda tetap di resepsionis |
| 13:00–17:00 | Tim otomatis kembali bekerja, dengan rapat atau perjalanan singkat sesuai agenda |
| 17:00 | Semua karakter berjalan pulang melalui pintu utama |
| 17:00–17:15 | Lampu kantor meredup hingga mati |
| Setelah pulang–07:00 berikutnya | Kantor kosong; karakter berada di luar kantor dan tidak ditampilkan |
| 07:00 hari berikutnya | Rutinitas lampu dan kedatangan berulang |

Satu rapat tim dijadwalkan setiap hari. Jam mulai bervariasi antara **09:00–10:10** atau **14:00–15:10**, dengan durasi diskusi **30, 45, atau 60 menit game**. Variasi ditentukan oleh hari sehingga save/reload mempertahankan agenda yang sama. Enam peserta berjalan ke kursi rapat; penghitung diskusi baru dimulai setelah seluruh peserta duduk. Mereka bergantian berbicara, mengangguk, dan mendengarkan, lalu kembali ke meja masing-masing.

Saat bekerja, karakter sesekali berdiri dan berjalan di departemennya selama sekitar enam menit game, dengan jeda sekitar 90 menit atau lebih. Setiap 60 menit benar-benar bekerja menghasilkan 10 HQ Credits virtual per karakter; perjalanan, rapat, dan percakapan tidak dihitung sebagai kerja. Credits belum dapat dibelanjakan.

## Cara bermain

- **Director:** drag untuk orbit, scroll untuk zoom, drag kanan untuk pan. Pilih ruangan melalui Office map atau klik lantai.
- **Layar kecil:** tombol **Map** dan **Team** membuka panel agar kantor tetap terlihat.
- **NPC:** klik karakter atau nama staf. Tab **Kondisi** menampilkan energi, fokus, sosial, progres kerja, dan status kedatangan/kepulangan.
- **Interaksi:** untuk enam pekerja, pilih rekan serta kegiatan pada tab **Interaksi & hubungan**, lalu tekan **Mulai interaksi**. Keduanya menuju kursi berpasangan, menunggu rekan, dan berbicara bergantian. Bonus diberikan ketika selesai; pembatalan tidak memberi bonus.
- **Agenda:** panel menampilkan hari, status kantor, jam dan durasi rapat, serta tombol menuju Meeting Room.
- **Office Stories:** **Lihat cerita** di HQ Moments menampilkan interaksi aktif dan catatan kantor. Pilihan **Kurangi animasi** ikut tersimpan.
- **Arahan:** **Arahkan bekerja** dan **Istirahat di Kantin** tersedia bagi pekerja yang berada di kantor saat jam kerja dan sedang tidak rapat. Arahan berlaku hingga 60 menit game, dibatasi oleh jadwal makan siang atau tutup kantor.
- **Avatar:** pilih Avatar / Enter Avatar. WASD, tombol panah, atau tombol gerak di layar untuk berjalan mengikuti arah layar. Dinding dan furnitur menghalangi gerakan.
- **Menyapa:** dekati staf lalu tekan E atau tombol Sapa. Avatar dan NPC melambai, dialog scripted muncul, dan kebutuhan sosial bertambah. Jeda sepuluh detik nyata antar-sapaan.
- **Waktu:** pause / 1x / 2x / 3x. Pada 1x, satu detik nyata = satu menit game; satu hari = 24 menit nyata. Pause membekukan simulasi dan animasi NPC. Avatar, kamera, dan pintu yang merespons Avatar tetap dapat bergerak.
- **Save:** tombol Save dan autosave setiap 15 detik menyimpan waktu, hari, Credits, kondisi/progres kerja, posisi dan kehadiran NPC, agenda rapat, hubungan, interaksi, Avatar, kecepatan, serta pengaturan animasi.

## Interaksi dan animasi

Interaksi sosial berlangsung antara enam pekerja; Amanda menjaga resepsionis. Maksimal tiga pasangan memakai enam kursi berbeda. Jadwal makan siang, rapat tim, dan kepulangan mengakhiri interaksi yang belum selesai agar karakter mengikuti kegiatan kantor berikutnya.

| Kegiatan | Tempat | Durasi setelah tiba | Manfaat per pekerja |
| --- | --- | --- | --- |
| Ngobrol santai | Canteen | 14 menit game | Sosial +18, fokus +5, kedekatan +8 |
| Brainstorm | Meeting Room | 20 menit game | Fokus +12, sosial +12, kedekatan +8 |
| Beri semangat | Canteen | 12 menit game | Energi +8, sosial +12, fokus +5, kedekatan +10 |

Kedekatan 0–39: Mulai kenal; 40–69: Akrab; 70–100: Kompak. Kebutuhan dan kedekatan dibatasi 0–100.

Rig 3D memiliki bahu, siku, pinggul, lutut, wajah, rambut, tangan, sepatu, dan identitas visual tiap karakter. Karakter bertransisi dari berdiri ke duduk, menekuk lutut, mengetik di depan monitor, berbincang di kursi rapat, dan mengangkat makanan atau cangkir. Posisi dan arah kursi terhubung ke navigasi.

Pintu kaca otomatis, pencahayaan harian, lampu kantor, monitor, kipas server, uap minuman, ornamen studio, serta jam memberi aktivitas pada ruangan. Gerak dekorasi dan sendi mengikuti kecepatan hingga 2x untuk kenyamanan; navigasi serta jam game tetap mengikuti pilihan 1x/2x/3x. Pemetaan animasi: [ANIMATION_PLAN.md](ANIMATION_PLAN.md).

## Penyimpanan dan batas prototype

- Kunci save: `vanderleinz-hq-milestone-4`. Save milestone 1–3 dibaca dan dimigrasikan ketika belum ada save versi 4.
- Migrasi mempertahankan hari/waktu, Credits, kebutuhan, progres kerja, serta data yang valid; posisi lama disesuaikan ke titik aktivitas aman pada tata kantor baru. Amanda dan agenda harian ditambahkan.
- Data rusak dipulihkan dengan nilai aman. Penyimpanan browser yang ditolak atau penuh ditampilkan sebagai kegagalan Save.
- Tab tersembunyi menghentikan simulasi; belum ada progres offline. Jeda sistem dibatasi menjadi pembaruan maksimal 0,5 detik nyata.
- Visual merupakan 3D bergaya miniatur dengan geometri dan animasi prosedural; belum memakai karakter fotorealistis, model impor, atau motion capture.
- Kursi memakai titik duduk yang telah ditentukan. Avatar belum dapat duduk atau memakai komputer; kontak tangan dengan meja belum memakai inverse kinematics.
- NPC masih dapat berpapasan menembus NPC lain. Dinding/furnitur menghalangi navigasi; daun pintu adalah visual yang membuka otomatis.
- Belum ada perekrutan, pembelian furnitur, upgrade, gaji, atau proyek bisnis.

## Struktur

- `src/worldData.ts`: delapan ruangan, tujuh staf, dan tugas.
- `src/officeLayout.ts`: meja kerja, kursi, resepsionis, pintu masuk, serta waktu kedatangan.
- `src/navigation.ts`: dinding/furnitur, jalur, dan tabrakan Avatar.
- `src/simulation.ts`: hari, jam buka, jadwal, rapat, kehadiran, pendapatan, dan migrasi save.
- `src/social.ts`: pasangan, dialog, hubungan, pemesanan kursi, dan bonus.
- `src/CharacterRig.tsx`: rig duduk/berdiri serta transisi pose.
- `src/RoomLife.tsx`: animasi pintu, lampu, perangkat, dan dekorasi.
- `src/SpeechBubble.tsx`: gelembung dialog lokal.
- `src/App.tsx`: dunia 3D, kamera, input, dan panel permainan.
- `tests/simulation.test.ts`, `tests/social.test.ts`, `tests/officeRoutine.test.ts`: 25 pengujian perilaku.

Catatan validasi: [QA.md](QA.md).
