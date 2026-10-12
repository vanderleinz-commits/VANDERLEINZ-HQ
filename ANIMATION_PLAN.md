# Milestone 5 — Dua lantai dan kegiatan kantor

## Bangunan dan acuan aktivitas

Office world terdiri dari dua lantai dan sebelas ruangan. Lantai 1 memiliki Reception, Open Workspace berukuran dua kali ruang standar, HRD, Pantry, Database Server, Library, serta dua WC. Meeting Room, Founder Office, dan Manager Office berada di lantai 2. Tombol **Lantai 1 / Lantai 2 / Semua** serta pemilihan ruangan mengatur tampilan dan fokus kamera.

`officeLayout.ts` menyatukan posisi furnitur, kursi, antrean/layanan absensi, titik perbaikan/pemeriksaan, Library, Pantry, WC, dan kedua ujung tangga. Jalur memakai koordinat horizontal dan elevasi. NPC serta Avatar naik/turun melalui kemiringan tangga secara bertahap; perubahan lantai tidak dilakukan dengan lompatan posisi.

Delapan staf memakai rig prosedural lokal. ATLAS dan Akbar memiliki meja sendiri di lantai atas; NOVA, LYRA, ORION, dan SAGE berbagi Open Workspace; NEXUS menjaga Database Server; Amanda berdiri di resepsionis. Tujuh kursi Meeting Room/Pantry dipakai seluruh pekerja termasuk Akbar.

## Rig dan pose

Arah depan adalah sumbu lokal **+z**. Rig memiliki bahu/siku, pinggul/lutut, kepala/wajah, rambut, tangan/jari, dan kaki. Saat duduk, pinggul turun ke sekitar **y=0,64**, paha mengarah ke depan, lutut menekuk, serta kaki mendekati lantai. Transisi sendi dibaurkan agar perpindahan pose halus.

Akbar menggunakan varian Founder: jaket navy dengan lapel, kacamata keemasan, rambut tersisir, serta bentuk wajah berbeda. Tamu memakai pakaian formal abu-abu. Amanda mempertahankan rambut panjang dan aksesori resepsionis.

| Pose | Pemicu | Visual |
| --- | --- | --- |
| Idle | Diam, menunggu, atau Amanda siap melayani | Napas ringan dan kedipan |
| Walk | Berjalan mengikuti jalur | Ayunan sendi dengan ritme lebih pelan |
| Stairs | Jalur berada di tangga | Ritme lebih pelan dan lutut terangkat |
| Work | Bekerja pada kursi komputer | Mengetik, siku menekuk, kepala melihat monitor |
| Talk | Diskusi tim, pribadi, atau berpasangan | Gestur tangan dan anggukan |
| Think | Mendengarkan / komputer bermasalah | Tangan dekat kepala |
| Wave | Sapaan dan dukungan | Tangan terangkat |
| Coffee | Minum atau variasi makan siang | Cangkir diangkat/diturunkan |
| Eat | Duduk makan di Pantry | Mangkuk dan sendok |
| Read | Library / dokumen HRD | Buku terbuka di tangan, kepala menunduk |
| Inspect | ATLAS memeriksa pekerjaan | Tablet dan perhatian ke meja rekan |
| Repair | NEXUS memperbaiki komputer | Tablet, alat, dan gerak tangan |
| Cook | Memasak di Pantry | Panci kecil dan gerak mengaduk |
| Sign | Absensi pekerja / buku tamu | Pena dan gerak menulis di depan tubuh |
| Toilet | Kegiatan WC | Pose netral; karakter disembunyikan di ruang privat |

Kecepatan berjalan simulasi adalah 1,15 unit per menit game. Ritme pose berjalan menggunakan fase sekitar 5 radian/detik visual, tangga 4 radian/detik visual; sendi/dekorasi mengikuti kecepatan sampai 2x. Navigasi dan jam tetap mengikuti 1x/2x/3x. Ini merupakan animasi prosedural, belum sinkronisasi kaki ke setiap anak tangga atau inverse kinematics.

## Rangkaian absensi dan kegiatan harian

1. Pukul 07:00 Amanda masuk ke resepsionis dan lampu menyala.
2. Akbar tiba 07:03; enam pekerja lainnya datang mulai 07:06 dengan selang tiga menit.
3. Pekerja menunggu giliran, berjalan ke meja layanan, menulis absensi, dan Amanda mencatat masuk setelah layanan dua menit game. Mereka kemudian menuju meja.
4. Pukul 08:00 pekerjaan dimulai. Kegiatan tambahan dapat membawa karakter ke departemen lain atau lantai atas/bawah.
5. Pukul 12:00–13:00 tim beristirahat makan/minum di Pantry; rutinitas ringan juga dapat berlangsung. Amanda tetap melayani resepsionis.
6. Pukul 13:00 tim kembali bekerja.
7. Mulai 17:00 pekerja turun/berjalan menuju Amanda untuk absen pulang, lalu meninggalkan kantor. Amanda pulang setelah layanan absensi selesai.
8. Lampu meredup setelah jam kerja dan tetap menyediakan penerangan minimum selama staf belum pulang. Lampu padam ketika kantor kosong; kedatangan berulang pada 07:00 berikutnya.

Hari berulang Senin sampai Minggu dan semuanya masih menjadi hari kerja.

## Tugas dengan perjalanan dan durasi nyata

Tugas mengikuti urutan **berjalan → tiba → aktivitas → selesai → kembali ke jadwal**. Penghitung aktivitas dimulai setelah mencapai titik tujuan; waktu perjalanan tidak menggantikan durasi aktivitas.

| Tugas | Peserta / tempat | Durasi aktivitas game |
| --- | --- | --- |
| Diskusi pribadi proyek | ATLAS + Akbar, kursi Founder Office | 15 menit setelah keduanya tiba |
| Pemeriksaan pekerjaan | ATLAS di samping meja rekan | 6 menit |
| Perbaikan komputer | NEXUS di meja pemilik komputer | 12 menit |
| Membaca | Kursi Library | 12 menit |
| Menggunakan WC | Salah satu WC yang tersedia | 6 menit |
| Minum | Titik minuman Pantry | 4 menit |
| Memasak | Perlengkapan Pantry | 10 menit |
| Dokumen HRD | Kursi HRD | 8 menit |

Komputer yang bermasalah menghentikan pekerjaan pemiliknya sampai perbaikan selesai. Pemilik dapat mencakup Akbar, sehingga NEXUS harus benar-benar menaiki tangga sebelum memperbaiki komputer Founder. ATLAS bergantian menjalankan diskusi proyek dan pemeriksaan tim; kegiatan ringan bervariasi menurut urutan kejadian acak yang ikut disimpan.

Kursi Library/WC serta beberapa titik kegiatan dipesan agar dua kegiatan yang sama tidak memakai tempat yang sama. Rapat, batas makan siang, dan penutupan kantor mengakhiri kegiatan yang belum selesai agar jadwal utama berjalan.

Tamu menuju antrean resepsionis, menulis buku tamu saat dilayani Amanda, menunggu sebentar, kemudian pulang. Layanan tamu saat ini belum berlanjut ke wawancara atau pekerjaan bisnis.

## Rapat dan interaksi

Rapat harian dimulai pada rentang 09:00–09:30 atau 13:30–14:00, dengan diskusi 30/45/60 menit game. Agenda tetap sama untuk hari yang sama. Seluruh tujuh peserta berjalan ke kursi lantai 2; penghitung diskusi baru aktif setelah semuanya duduk. Giliran bicara berganti setiap lima menit game. Jika peserta belum lengkap setelah batas kedatangan 65 menit, rapat ditunda.

Interaksi berpasangan dapat melibatkan Akbar, sementara Amanda tetap melayani resepsionis. Maksimal tiga pasangan memakai kursi berbeda. Percakapan dimulai setelah kedua peserta tiba; giliran dialog berganti setiap empat menit game.

| Interaksi | Tempat | Durasi diskusi | Manfaat per peserta |
| --- | --- | --- | --- |
| Ngobrol santai | Pantry | 14 menit game | Sosial +18, fokus +5, kedekatan +8 |
| Brainstorm | Meeting Room | 20 menit game | Fokus +12, sosial +12, kedekatan +8 |
| Beri semangat | Pantry | 12 menit game | Energi +8, sosial +12, fokus +5, kedekatan +10 |

Bonus diberikan saat selesai; pembatalan tidak memberikan bonus. Gelembung dialog menghadap kamera dan memakai teks scripted sesuai kegiatan serta peserta.

## Pause dan penyimpanan

- Pause membekukan NPC, kebutuhan, jam, rapat, kegiatan tambahan, absensi, tamu, percakapan, dan dekorasi.
- Avatar/kamera tetap dapat digunakan ketika pause; pintu merespons Avatar.
- **Kurangi animasi** mengurangi ayunan, kedipan, denyut, dan dekorasi; pose serta navigasi tetap terbaca.
- Save versi 5 menyimpan elevasi, tugas aktif, masalah komputer, absensi/tamu, agenda, hubungan/interaksi, urutan kejadian acak, dan pilihan lantai/animasi.
- Jalur dihitung ulang saat dimuat, termasuk dari tengah tangga. Save versi 1–4 dipindahkan ke titik aman pada tata baru sambil mempertahankan progres yang valid.

## Struktur dan batas visual

`BuildingShell.tsx` membentuk lantai/tangga; `OfficeArchitecture.tsx` membentuk furnitur dan pintu utama; `officeLayout.ts` menjadi acuan bersama. `navigation.ts` menyediakan elevasi dan perpindahan lantai. `simulation.ts` mengatur absensi, tamu, tugas, dan rapat; `social.ts` mengatur pasangan/kursi. `CharacterRig.tsx` menerima pose/status duduk dan `RoomLife.tsx` menggerakkan perangkat/dekorasi.

Model masih 3D miniatur bergaya dengan geometri prosedural. Avatar belum dapat duduk atau menggunakan furnitur; NPC belum saling menghindari. Kontak tangan/kaki belum memakai inverse kinematics, dan model belum fotorealistis, bertulang impor, atau motion capture. Pengembangan berikutnya dapat menambah kontak furnitur yang lebih presisi, penghindaran kerumunan, interaksi Avatar, serta wawancara HRD yang lengkap.
