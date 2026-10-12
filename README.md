# VANDERLEINZ-HQ

## AI HQ — Office Tycoon Simulator

## Milestone 5: dua lantai dan rutinitas kantor

Kantor 3D miniatur dengan **dua lantai, sebelas ruangan, delapan staf**, mode Director/Avatar, waktu dipercepat, local save, dan HQ Credits virtual. Palet biru pastel, cream, dan kayu menjaga suasana cozy. Dibangun memakai React, TypeScript, React Three Fiber, dan Three.js. Geometri karakter, dialog scripted, animasi, dan simulasi berjalan lokal tanpa AI API, API key, akun, atau pembayaran nyata.

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

## Tata kantor

Pintu kaca utama mengarah ke Reception dan meja Amanda. Koridor dan tangga menghubungkan kedua lantai. Karakter berjalan mengikuti jalur serta elevasi tangga secara bertahap. Open Workspace memiliki luas dua kali ruangan standar dan empat meja komputer.

| Lantai 1 | Lantai 2 |
| --- | --- |
| Reception | Meeting Room |
| Open Workspace | Founder Office |
| HRD | Manager Office |
| Pantry | |
| Database Server | |
| Library | |
| WC 1 | |
| WC 2 | |

Meeting Room dan Pantry memiliki tujuh kursi untuk enam pekerja serta Akbar. Library menyediakan tempat membaca; Pantry memiliki perlengkapan minum/memasak. Kedua WC memiliki penanda terisi dan menyembunyikan karakter yang sedang menggunakannya.

## Tim

| Karakter | Peran | Tempat utama |
| --- | --- | --- |
| ATLAS | Office manager; mengatur operasional dan memeriksa tim | Manager Office, lantai 2 |
| NOVA | Creative director; mendesain karya | Open Workspace, lantai 1 |
| LYRA | People & culture; agenda tim dan dokumen HRD | Open Workspace, lantai 1 |
| ORION | Research analyst; menganalisis riset | Open Workspace, lantai 1 |
| SAGE | Community host; menyiapkan program komunitas | Open Workspace, lantai 1 |
| NEXUS | Systems engineer; memantau sistem dan memperbaiki komputer | Database Server, lantai 1 |
| Amanda | Receptionist; mencatat absensi dan menyambut tamu | Reception, lantai 1 |
| Akbar | Founder; memimpin dan merencanakan kantor | Founder Office, lantai 2 |

Akbar memiliki desain karakter dengan jaket navy, kacamata keemasan, dan gaya rambut tersendiri. Amanda berdiri di belakang meja resepsionis selama bertugas; staf lainnya dapat duduk bekerja, rapat, membaca, atau berinteraksi.

## Rutinitas harian

Permainan baru dimulai pada **Senin, 07:00**. Nama hari berulang dari Senin sampai Minggu; seluruh tim sementara bekerja setiap hari, termasuk akhir pekan.

| Waktu game | Rutinitas |
| --- | --- |
| 07:00 | Lampu menyala; Amanda masuk dan menyiapkan absensi |
| 07:03 | Akbar tiba melalui pintu utama |
| 07:06–07:21 | Enam pekerja lainnya datang bergantian dengan selang tiga menit |
| Sebelum ke meja | Setiap pekerja mengantre dan absen masuk satu per satu di depan Amanda |
| 08:00–12:00 | Bekerja di depan komputer, diselingi rapat, kegiatan departemen, dan rutinitas ringan |
| 12:00–13:00 | Istirahat makan/minum di Pantry dan interaksi sederhana; Amanda tetap menjaga resepsionis |
| 13:00–17:00 | Kembali bekerja dan menjalankan kegiatan kantor |
| Mulai 17:00 | Tim menuju Amanda untuk absen pulang, kemudian keluar melalui pintu utama |
| Setelah absensi selesai | Amanda menutup resepsionis dan pulang; lampu padam setelah kantor kosong |
| 07:00 hari berikutnya | Lampu dan kedatangan berulang |

Layanan absensi berlangsung sekitar dua menit game setelah pekerja tiba di meja layanan. Log Amanda menampilkan absensi masuk/pulang serta kunjungan client. Tamu datang ke resepsionis, mengisi buku tamu, menunggu sebentar, lalu keluar kembali. Layanan tamu belum berkembang menjadi wawancara HRD atau proyek bisnis.

Satu rapat tim dijadwalkan setiap hari. Jam mulai bervariasi antara **09:00–09:30** atau **13:30–14:00**, dengan durasi diskusi **30, 45, atau 60 menit game**. Agenda ditentukan oleh hari sehingga tetap sama saat save/reload. Tujuh peserta berjalan ke kursi Meeting Room di lantai 2; penghitung diskusi dimulai setelah semuanya duduk. Mereka bergantian berbicara dan mendengarkan, lalu kembali ke meja.

Pekerjaan memberi 10 HQ Credits virtual per 60 menit benar-benar bekerja. Perjalanan, rapat, tugas tambahan, percakapan, dan menunggu perbaikan komputer tidak dihitung sebagai kerja. Credits belum dapat dibelanjakan.

## Kegiatan kantor otomatis

- **Diskusi Founder–Manager:** ATLAS menemui Akbar di Founder Office. Diskusi proyek berlangsung 15 menit game setelah keduanya tiba di kursi.
- **Pemeriksaan tim:** ATLAS berkeliling menuju meja anggota tim dan memeriksa pekerjaan selama sekitar enam menit setelah tiba.
- **Perbaikan komputer:** masalah acak dapat muncul pada komputer tim, termasuk milik Akbar. Pemilik berhenti bekerja sementara; NEXUS berjalan ke meja yang bermasalah, termasuk naik tangga, dan memperbaikinya selama sekitar 12 menit setelah tiba.
- **Rutinitas pribadi:** karakter dapat membaca di Library, menggunakan salah satu WC, mengambil minum, atau memasak di Pantry. LYRA juga dapat mengurus dokumen HRD.
- **Jadwal utama:** mulai rapat, akhir makan siang, dan tutup kantor mengarahkan staf ke kegiatan berikutnya. Kegiatan tambahan yang belum selesai dapat dijadwalkan ulang.

## Cara bermain

- **Lantai:** tombol **Lantai 1**, **Lantai 2**, dan **Semua** mengatur tampilan. Memilih ruangan atau staf berpindah ke lantai yang sesuai.
- **Director:** drag untuk orbit, scroll untuk zoom, drag kanan untuk pan. Pilih ruangan melalui Office map atau klik lantai.
- **Layar kecil:** tombol **Map** dan **Team** membuka panel agar kantor tetap terlihat.
- **NPC:** klik karakter atau nama staf. Tab **Kondisi** menampilkan kebutuhan, progres kerja, kegiatan, serta waktu absen masuk/pulang.
- **Agenda dan operasi:** buka **Agenda hari ini** / Office Stories untuk melihat rapat, kegiatan aktif, kondisi komputer, tamu, serta catatan Amanda. Tombol **Lihat** membawa kamera ke kegiatan terkait.
- **Interaksi:** pilih rekan dan kegiatan pada tab **Interaksi & hubungan**, lalu tekan **Mulai interaksi**. Akbar dapat ikut; Amanda tetap bertugas di resepsionis.
- **Arahan:** **Arahkan bekerja** dan **Istirahat di Pantry** tersedia saat karakter berada di kantor, pada jam kerja, dan sedang tidak menjalankan rapat atau tugas khusus. Arahan berlaku hingga 60 menit game, dibatasi jadwal makan siang/tutup.
- **Avatar:** pilih Avatar / Enter Avatar. WASD, tombol panah, atau tombol gerak di layar untuk berjalan mengikuti arah layar. Gunakan tangga untuk pindah lantai; dinding dan furnitur menghalangi gerakan.
- **Menyapa:** dekati staf dan tekan E atau tombol Sapa. Dialog scripted serta gestur sapaan muncul. Jeda sepuluh detik nyata antar-sapaan.
- **Waktu:** pause / 1x / 2x / 3x. Pada 1x, satu detik nyata = satu menit game; satu hari = 24 menit nyata. Pause membekukan simulasi dan NPC; Avatar, kamera, dan pintu yang merespons Avatar tetap dapat bergerak.
- **Save:** tombol Save dan autosave setiap 15 detik menyimpan permainan lokal. Pilihan **Kurangi animasi** dan tampilan lantai juga tersimpan.

## Interaksi dan animasi

Maksimal tiga pasangan memakai kursi yang berbeda. Mereka menunggu rekan tiba, saling menghadap, dan berbicara bergantian. Bonus diberikan setelah selesai; pembatalan tidak memberi bonus.

| Kegiatan | Tempat | Durasi setelah tiba | Manfaat per peserta |
| --- | --- | --- | --- |
| Ngobrol santai | Pantry | 14 menit game | Sosial +18, fokus +5, kedekatan +8 |
| Brainstorm | Meeting Room | 20 menit game | Fokus +12, sosial +12, kedekatan +8 |
| Beri semangat | Pantry | 12 menit game | Energi +8, sosial +12, fokus +5, kedekatan +10 |

Kedekatan 0–39: Mulai kenal; 40–69: Akrab; 70–100: Kompak. Kebutuhan dan hubungan dibatasi 0–100.

Rig 3D memiliki bahu, siku, pinggul, lutut, wajah, rambut, tangan, dan sepatu. Pose mencakup berjalan, menaiki tangga, duduk mengetik, berdiskusi, membaca buku, memeriksa perangkat, memperbaiki dengan alat, memasak, menulis absensi, makan/minum, dan sapaan. Langkah lebih pelan; elevasi tangga berubah terus mengikuti jalur. Gerak sendi/dekorasi mengikuti kecepatan hingga 2x, sedangkan navigasi dan jam tetap mengikuti pilihan 1x/2x/3x.

Pemetaan animasi dan acuan furnitur: [ANIMATION_PLAN.md](ANIMATION_PLAN.md).

## Penyimpanan dan batas prototype

- Kunci save: `vanderleinz-hq-milestone-5`. Save versi 1–4 dibaca dan dimigrasikan ketika belum ada save versi 5.
- Migrasi mempertahankan waktu/hari, Credits, kebutuhan, progres kerja, dan data hubungan yang valid; karakter ditempatkan aman pada tata baru. Akbar serta kegiatan kantor baru ditambahkan.
- Save versi 5 menyimpan posisi/elevasi, kehadiran, absensi, tamu, kondisi komputer, tugas yang berlangsung, agenda, hubungan/interaksi, urutan kejadian acak, Avatar, kecepatan, dan pilihan lantai/animasi. Jalur dihitung ulang dengan aman saat dimuat, termasuk saat berada di tangga.
- Data rusak dipulihkan dengan nilai aman. Penyimpanan browser yang ditolak/penuh ditampilkan sebagai kegagalan Save.
- Tab tersembunyi menghentikan simulasi; belum ada progres offline. Jeda sistem dibatasi menjadi pembaruan maksimal 0,5 detik nyata.
- Visual merupakan 3D miniatur bergaya dengan geometri dan animasi prosedural; belum menggunakan model fotorealistis, karakter impor, atau motion capture.
- Kursi memakai titik duduk tetap. Avatar belum dapat duduk, membaca, memasak, atau memakai komputer; kontak tangan dengan furnitur belum memakai inverse kinematics.
- NPC belum saling menghindari. Dinding/furnitur membatasi navigasi; daun pintu adalah visual yang membuka otomatis.
- Kehidupan kantor memakai dialog dan tugas scripted. Belum ada sistem wawancara lengkap, perekrutan, furnitur yang dapat dibeli, gaji, upgrade, atau proyek bisnis.

## Struktur

- `src/worldData.ts`: dua lantai, sebelas ruangan, delapan staf, dan tugas.
- `src/officeLayout.ts`: furnitur, kursi, absensi, pintu masuk, tangga, serta titik kegiatan.
- `src/navigation.ts`: jalur dengan elevasi, perpindahan lantai, dan tabrakan Avatar.
- `src/simulation.ts`: waktu/hari, kehadiran, absensi/tamu, tugas, perbaikan, rapat, dan save.
- `src/social.ts`: pasangan, kursi, dialog, hubungan, dan bonus.
- `src/CharacterRig.tsx`: rig serta transisi pose aktivitas.
- `src/BuildingShell.tsx`, `src/OfficeArchitecture.tsx`: bangunan, tangga, furnitur, pintu masuk, dan lingkungan.
- `src/RoomLife.tsx`: pencahayaan serta animasi pintu, perangkat, dan dekorasi.
- `src/App.tsx`: kamera, input, panel lantai/tim, dan kontrol permainan.
- `tests/`: 39 pengujian simulasi, sosial, rutinitas, tugas, navigasi, dan save.

Catatan validasi: [QA.md](QA.md).
