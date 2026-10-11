# Milestone 3 — Karakter dan ruangan hidup

## Sistem yang sudah dibangun

Animasi dibuat langsung dengan geometri Three.js dan React Three Fiber. Satu rig dipakai oleh enam NPC dan Avatar: badan, kepala, bahu kiri/kanan, pinggul kiri/kanan, mata, tangan, kaki, mug, dan tablet. Setiap sendi memakai pivot agar geraknya bisa dikembangkan tanpa mengganti logika simulasi.

Posisi karakter mengikuti navigasi; rotasi badan mengarah ke jalur, lawan bicara, atau Avatar yang menyapa. Gerak sendi menggunakan transisi halus. Animasi visual mengikuti kecepatan simulasi hingga 2x untuk kenyamanan; perpindahan NPC dan waktu game tetap mengikuti pilihan 1x/2x/3x.

| Pose | Pemicu | Gerak dan properti |
| --- | --- | --- |
| Idle | Avatar diam | Napas ringan, gerak kepala, kedipan |
| Walk | Ada jalur NPC / input Avatar | Ayunan tangan dan kaki berlawanan, langkah kecil, rotasi arah |
| Work | NPC bekerja | Gerak tangan seperti mencatat/mengetik, tablet di depan tubuh |
| Talk | Giliran berbicara | Gerak tangan, anggukan, badan menghadap rekan |
| Think | Mendengarkan / rapat | Tangan dekat kepala, kepala miring |
| Wave | Menyapa / memberi semangat | Tangan terangkat dan melambai |
| Coffee | Rehat, makan siang, santai | Mug di tangan dan gerak mengangkat minuman |

Gelembung dialog 3D berganti menurut giliran setiap empat menit game. Isi dialog dipilih dari kalimat scripted yang sesuai karakter dan jenis interaksi.

## Interaksi sebagai rangkaian animasi

1. Pemain memilih dua NPC dan kegiatan, atau NPC memilih rekan secara otomatis saat berkumpul.
2. Kedua karakter menuju titik berpasangan yang sudah dipesan. Satu NPC hanya mengikuti satu interaksi pada satu waktu.
3. Percakapan dimulai setelah keduanya tiba di ruangan yang sama dan cukup dekat.
4. Karakter bergantian berbicara dan mendengarkan; progress kegiatan terlihat di panel Interaksi / Office Stories.
5. Setelah selesai, kedekatan bertambah dan kebutuhan pulih sesuai kegiatan. Karakter kembali mengikuti jadwal.

| Kegiatan | Ruangan | Durasi setelah tiba | Manfaat per karakter |
| --- | --- | --- | --- |
| Ngobrol santai | Lounge | 14 menit game | Sosial +18, fokus +5, kedekatan +8 |
| Brainstorm bersama | Meeting Room | 20 menit game | Fokus +12, sosial +12, kedekatan +8 |
| Beri semangat | Lounge | 12 menit game | Energi +8, sosial +12, fokus +5, kedekatan +10 |

Nilai kebutuhan dan kedekatan dibatasi 0–100. Bonus diberikan setelah interaksi benar-benar selesai; pembatalan atau kehabisan batas waktu tidak memberi bonus. NPC mendapat jeda sebelum kegiatan otomatis berikutnya dan memilih hubungan yang masih kurang dekat ketika beberapa rekan tersedia.

## Animasi ruangan

| Ruangan | Lapisan animasi |
| --- | --- |
| Reception | Pintu kaca otomatis, lampu hangat, jarum jam |
| Open Workspace | Pintu, lampu, layar tablet/monitor yang menyala saat ada staf |
| Meeting Room | Pintu, lampu, papan presentasi dengan aksen aktif saat kolaborasi |
| Creative Studio | Pintu, lampu, ornamen warna yang melayang dan berputar perlahan |
| Research Lab | Pintu, lampu, model eksperimen yang bergerak dan layar aktif |
| Lounge | Pintu, lampu, uap minuman |
| Server Room | Pintu, lampu, kipas berputar dan layar sistem berdenyut |
| Director Office | Pintu, lampu, jarum jam dan layar |

Cahaya dunia berubah mengikuti jam game. Lampu ruangan lebih hangat saat malam. Efek tidak memakai sumber cahaya berbayang per ruangan untuk menjaga biaya rendering.

## Pause, aksesibilitas, dan penyimpanan

- Pause menghentikan gerak dan pose NPC, kipas, ornamen, uap, serta kemajuan percakapan. Kamera tetap dapat digerakkan.
- Avatar dapat berjalan saat pause; pintu tetap merespons Avatar agar eksplorasi tidak terhambat.
- Office Stories memiliki pilihan **Kurangi animasi**. Pilihan ini mengurangi ayunan, kedipan, gerak dekorasi, dan denyut; pose aktivitas serta navigasi tetap terlihat. Pengaturan sistem `prefers-reduced-motion` juga dipakai sebagai nilai awal.
- Hubungan, interaksi aktif, giliran/waktu percakapan, cooldown NPC, dan pengaturan animasi tersimpan dalam save milestone 3. Save milestone 1/2 dibaca sebagai sumber migrasi.

## Struktur kode

- `src/social.ts`: pasangan, dialog, pemesanan tempat, bonus, pembatalan, dan pemilihan rekan otomatis.
- `src/CharacterRig.tsx`: rig prosedural dan transisi pose.
- `src/SpeechBubble.tsx`: tekstur dialog lokal yang menghadap kamera.
- `src/RoomLife.tsx`: animasi pintu, perangkat, dekorasi, dan pencahayaan.
- `src/simulation.ts`: clock dan status NPC, termasuk serialisasi/migrasi.

## Tahap animasi berikutnya

Fondasi ini dapat dikembangkan dengan titik duduk yang terhubung ke kursi, gerak tangan yang tepat menuju meja/objek, animasi makan dan presentasi yang lebih khusus, serta penghindaran tabrakan antar-karakter. Saat ini karakter masih berdiri pada titik aktivitas; tabrakan terhadap dinding/furnitur berlaku untuk navigasi, sedangkan pintu adalah dekorasi yang membuka otomatis. NPC dapat berpapasan dengan NPC lain.

Rig saat ini memakai animasi prosedural dan belum memakai berkas karakter dengan tulang atau motion capture. Penggantian visual nantinya dapat mempertahankan pemetaan pose dan sistem interaksi yang sudah ada.
