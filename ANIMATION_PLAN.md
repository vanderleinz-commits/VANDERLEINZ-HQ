# Milestone 4 — Kantor dan rutinitas karakter

## Sistem yang sudah dibangun

Visual mempertahankan dunia miniatur pastel blue/cream/wood, dengan desain pintu masuk utama, resepsionis, koridor, ruangan, dan furnitur yang lebih rinci. Tujuh karakter memakai rig prosedural Three.js/React Three Fiber: badan, kepala/wajah, rambut, bahu, siku, tangan/jari, pinggul, lutut, kaki, dan properti aktivitas. Amanda memiliki rambut panjang, anting, serta pakaian resepsionis; karakter lainnya memiliki variasi warna, gaya rambut, dan aksesori.

Arah depan rig adalah sumbu lokal **+z**. Saat duduk, pinggul turun ke sekitar **y=0,64**, paha mengarah ke depan, lutut menekuk, dan kaki mendekati lantai. Duduk/berdiri bertransisi melalui sendi. Pose bekerja di kursi menempatkan tangan di depan tubuh untuk mengetik di meja; tablet hanya dipakai untuk pose kerja berdiri.

Posisi/arah kursi di `officeLayout.ts` menjadi acuan furnitur, tujuan navigasi, dan orientasi karakter. Kursi kantor berada di meja masing-masing; Meeting Room dan Canteen memiliki enam tempat duduk bersama.

| Pose | Pemicu | Gerak dan properti |
| --- | --- | --- |
| Idle | Diam / bersiap / Amanda menjaga resepsionis | Napas ringan, kepala dan kedipan |
| Walk | Perjalanan masuk, pulang, pindah kegiatan, atau Avatar berjalan | Ayunan tangan/kaki, lutut dan rotasi arah |
| Work | Bekerja di kursi komputer | Siku menekuk, tangan mengetik, kepala melihat monitor |
| Talk | Giliran diskusi atau percakapan | Gestur tangan, anggukan, perhatian ke rekan |
| Think | Mendengarkan rapat / percakapan | Tangan dekat kepala dan kepala miring |
| Wave | Sapaan atau dukungan | Tangan terangkat dan melambai |
| Coffee | Istirahat / variasi saat makan siang | Cangkir diangkat dan diturunkan |
| Eat | Duduk di Canteen saat makan siang | Mangkuk dan sendok, gerak tangan ke mulut |

Animasi sendi/dekorasi mengikuti kecepatan sampai 2x. Posisi NPC dan waktu game tetap mengikuti kecepatan 1x/2x/3x. Gelembung dialog menghadap kamera dan menampilkan teks scripted lokal.

## Rangkaian kegiatan kantor

1. Pukul 07:00 lampu menyala. Amanda masuk melalui pintu utama ke pos resepsionis.
2. Enam pekerja datang mulai 07:06, dengan selang tujuh menit, lalu menuju departemen masing-masing.
3. Pukul 08:00 pekerja duduk menghadap komputer. Perjalanan singkat sekitar enam menit dalam departemen memberi variasi berdiri/berjalan; setelahnya mereka kembali ke kursi.
4. Pukul 12:00 pekerja menuju kursi Canteen untuk makan, minum, dan interaksi sederhana. Amanda tetap berdiri di resepsionis.
5. Pukul 13:00 kegiatan makan/interaksi berakhir dan pekerja kembali ke meja.
6. Pukul 17:00 seluruh staf berjalan keluar melalui resepsionis dan pintu utama. Lampu meredup selama 15 menit; karakter yang sudah pulang disembunyikan.
7. Hari berikutnya pukul 07:00 rutinitas berulang. Nama hari berjalan dari Senin sampai Minggu, termasuk kerja akhir pekan.

## Rapat tim dan percakapan

Satu agenda rapat dihasilkan untuk setiap hari. Jam mulai berada dalam rentang 09:00–10:10 atau 14:00–15:10; diskusi berlangsung 30, 45, atau 60 menit game. Variasi ditentukan oleh hari, sehingga penyimpanan dan pemuatan tidak mengacak ulang agenda.

Enam pekerja berjalan menuju kursi rapat. Saat semua telah duduk, penghitung diskusi dimulai. Giliran berbicara berganti setiap lima menit game: pembicara memberi gestur, yang lain mendengarkan. Setelah durasi penuh, tim berdiri dan kembali ke meja. Amanda tetap menjaga resepsionis. Jika peserta tidak lengkap setelah batas kedatangan 25 menit, rapat ditunda agar tim kembali bekerja.

Interaksi berpasangan memakai tiga pasang kursi yang dipesan secara terpisah. Kedua peserta harus tiba sebelum percakapan dan penghitung durasi dimulai. Mereka berbicara bergantian setiap empat menit game. Bonus diberikan setelah selesai; pembatalan tidak memberi bonus.

| Kegiatan | Ruangan | Durasi diskusi | Manfaat per peserta |
| --- | --- | --- | --- |
| Ngobrol santai | Canteen | 14 menit game | Sosial +18, fokus +5, kedekatan +8 |
| Brainstorm | Meeting Room | 20 menit game | Fokus +12, sosial +12, kedekatan +8 |
| Beri semangat | Canteen | 12 menit game | Energi +8, sosial +12, fokus +5, kedekatan +10 |

Rapat tim, akhir makan siang, dan tutup kantor mengakhiri percakapan yang belum selesai. Satu pekerja hanya dapat mengikuti satu interaksi berpasangan; Amanda tidak mengikuti kegiatan ini.

## Ruangan dan pencahayaan

| Area | Detail visual dan aktivitas |
| --- | --- |
| Pintu utama | Pintu kaca ganda, bingkai/pegangan, teras, penanda kantor, jalur masuk/pulang |
| Reception | Meja Amanda, perlengkapan resepsionis, tempat tunggu, pintu dan jam |
| Open Workspace | Dua meja bernama untuk ATLAS/LYRA, kursi kantor, keyboard, monitor aktif |
| Meeting Room | Meja dan enam kursi, diskusi duduk, papan presentasi |
| Creative Studio | Meja NOVA, perlengkapan kreatif dan ornamen bergerak |
| Research Lab | Meja ORION dan perlengkapan riset |
| Canteen | Meja dan enam kursi, perlengkapan makan/minum, uap minuman |
| Server Room | Meja NEXUS, rak server, monitor sistem dan kipas |
| Director Office | Meja SAGE, kursi, rak/dekorasi dan jam |

Cahaya lingkungan mengikuti jam game. Lampu ruangan, cahaya kantor, dan layar menyala saat buka; mulai 17:00 lampu meredup dan padam pada 17:15. Ruangan tetap mendapat cahaya lingkungan sesuai waktu, sehingga kantor dapat terlihat ketika dieksplorasi malam hari. Pintu ruangan membuka saat karakter atau Avatar mendekat.

## Pause, aksesibilitas, dan save

- Pause membekukan waktu, perjalanan NPC, kebutuhan, pose, rapat, percakapan, dan dekorasi. Kamera tetap dapat digerakkan.
- Avatar dapat berjalan ketika pause; pintu tetap merespons Avatar.
- **Kurangi animasi** mengurangi ayunan, kedipan, denyut, dan gerak dekorasi; pose aktivitas serta navigasi tetap terlihat. Preferensi sistem menjadi nilai awal.
- Save versi 4 menyimpan kehadiran staf, posisi, perjalanan kegiatan, hari/jam, rapat, kebutuhan, Credits, hubungan, interaksi, dan preferensi animasi.
- Save versi 1–3 dimigrasikan ke titik aktivitas aman pada tata kantor baru, serta menambahkan Amanda dan agenda harian.

## Struktur dan pengembangan berikutnya

`officeLayout.ts` menyatukan acuan meja/kursi dan pintu masuk. `simulation.ts` mengatur rutinitas, kehadiran, rapat, dan pemilihan kursi; `social.ts` mengatur kegiatan berpasangan. `CharacterRig.tsx` menerima pose dan status duduk, sedangkan `RoomLife.tsx` menggerakkan perangkat/dekorasi. `SpeechBubble.tsx` menyajikan dialog.

Pengembangan berikutnya dapat menambah penghindaran antar-NPC, animasi duduk Avatar, kontak tangan ke keyboard dengan inverse kinematics, variasi kegiatan sesuai tugas, serta model karakter bertulang impor. Visual saat ini merupakan geometri bergaya miniatur dan animasi prosedural; belum fotorealistis atau memakai motion capture. Kursi memakai acuan posisi tetap, dan daun pintu merupakan animasi visual.
