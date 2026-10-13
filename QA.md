# Blue and Space Headquarters — Phase 01 QA

## Versi 0.8.0 · Proyek Dani · 13 Oktober 2026

- [x] 79 tes lulus, 0 gagal; pemeriksaan final 2,02 detik. Termasuk simulasi tiga hari dengan perpindahan, kursi rapat/perpustakaan/HR, absensi Client A, deadline yang menunggu Founder, baseline saldo, reset sesi, keputusan, revisi dan kegagalan penyimpanan.
- [x] Build TypeScript/Vite berhasil: 620 modul, 6,14 detik. Index 381,96 kB gzip; peringatan chunk besar masih ada.
- [x] Browser lokal: awal Senin 06:00 pause, tombol mulai, refresh mengulang proyek, Client A menunggu Rabu 16:00, Founder berjalan dari bawah melalui tangga dan duduk di ruang meeting client. Hasil terbuka sesudah pertemuan.
- [x] Video dari panel diputar sampai ended=true, currentTime=14, tanpa error; metadata 1280 × 720 dan durasi 14 detik. Video sumber juga didekode penuh: 420 frame, H.264 High/yuv420p, AAC LC stereo, faststart.
- [x] Tombol diterima terbuka setelah pemeriksaan hasil; keputusan diterima bertahan setelah reload. Dalam origin lokal terpisah tombol revisi ditolak tanpa catatan, menerima catatan dan bertahan setelah reload.
- [x] Console browser sesi pengujian tidak mencatat error/warning.
- Pengujian tiga hari browser memakai tombol QA pengembangan yang menjalankan substep simulasi lengkap. Tidak menunggu 58 menit waktu nyata; kecepatan dan kalender diperiksa oleh tes simulasi. Tombol QA dibuang dari build produksi.
- Keputusan tetap lokal per browser. Revisi dari chat memerlukan paket versi baru. Jam deadline sengaja menunggu keputusan; waktu kantor kembali berjalan sesudah diterima atau meminta revisi.

## Versi 0.7.0 · 13 Oktober 2026

Kantor sekarang memiliki **13 ruangan, 10 NPC, 9 pekerja yang dilayani Amanda, dan avatar pemilik**. Panjang dan lebar layout bertambah 30%; luas ruangan menjadi sekitar 1,69× sebelumnya. Catatan di bawah memisahkan hasil versi ini dari pengukuran Phase 01 lama. Tanda tanpa centang berarti belum diverifikasi, bukan hasil lulus.

### Verifikasi final rilis

- [x] `pnpm test`: **77 lulus, 0 gagal**, 2,38 detik pada pemeriksaan final 13 Oktober 2026.
- [x] `pnpm build`: TypeScript dan Vite berhasil, **616 modul**, 18,70 detik. Bundle index 375,28 kB gzip; Studio 4,21 kB gzip dan dimuat sebagai chunk terpisah. Peringatan ukuran chunk masih ada.
- [x] Preview produksi port **4177** memberi HTTP **200**; kantor dan Studio dimuat. Sesi final tidak mencatat error maupun warning console.

### Cakupan regresi otomatis

Suite yang tersedia memeriksa hal berikut. Status lulus versi final mengikuti hasil perintah pada bagian di atas.

| Bagian | Pemeriksaan |
| --- | --- |
| Layout dan navigasi | 13 ruangan; titik kursi, counter, layanan, gudang, dan pintu terhubung; tujuan duduk mempertahankan koordinat furnitur; perjalanan dua lantai dan tangga |
| Rutinitas kantor | Kedatangan bertahap, absensi satu per satu, jam kerja, rapat, istirahat, pulang, serta pengulangan hari |
| Yati | Menyeduh, membawa nampan, mengantar secara fisik sebelum cangkir muncul; client diprioritaskan; staf dan avatar yang bekerja dapat dilayani; catering siap sebelum istirahat |
| Deno dan layanan OB | Membersihkan seluruh 13 ruangan selama satu hari simulasi; layanan berhenti untuk istirahat dan dilanjutkan setelah pukul 13.00 |
| Istirahat tersebar | Rencana harian tidak berubah selama istirahat; kursi berbeda; pilihan meja, pantry, library, resepsionis, dan area OB; maksimal empat pekerja di pantry |
| Client dan tim | Client memakai kursi berbeda; pendamping tim mencapai kursi yang disediakan, menghadap meja, lalu kembali bekerja; Founder yang terlambat melayani mendapat penalti satu kali |
| Reception dan HRD | Amanda tidak melayani dari WC; Felin mencapai meja dan kursi konsultasi; absensi pemilik mempertahankan frame sebelumnya |
| Antrean dan kerumunan | Antrean tidak menggandakan anggota; semua pekerja absen pulang; ruang antartubuh memperhitungkan lantai dan membolehkan karakter menjauh dari penghalang |
| Pintu dan kamera | Pintu mengenali jalur masuk/keluar, tidak terbuka hanya karena orang diam atau melintas di samping; arah kontrol avatar tetap; redaman kamera konsisten pada 30/60 Hz |
| Editor | Sepuluh identitas staf, tiga template tamu, avatar terpisah; nama/penampilan tervalidasi; peran, ruangan, dan proporsi terlindungi; reset per karakter dan pembaruan referensi |
| Save | Migrasi layout lama menambah OB tanpa kehilangan progres; client aktif setelah riwayat tamu pulang; ID client di atas sepuluh; layanan dan penampilan dipulihkan dengan validasi data; nama sama tidak menukar identitas; maksimal satu cangkir per penerima |
| Kontak rig dan pemilihan model | Sol kaki duduk berada pada tinggi lantai acuan; kontak lengan mencapai target keyboard/nampan dengan siku terbatas; target di luar jangkauan menghasilkan angka valid; batas klik mengikuti sendi bergerak dan perubahan visibilitas prop tanpa hit ganda pada mesh sumber |

Tes menilai state, koordinat, jalur, durasi, dan perhitungan kontak. Tes tidak membuktikan setiap frame animasi bebas penetrasi atau semua perangkat dapat merender dengan mulus.

### Inspeksi browser versi ini · 12 Oktober 2026

Pengamatan berikut dilakukan pada preview development Windows/Codex sebelum finalisasi rilis 13 Oktober.

- [x] Studio: Deno diganti menjadi **Deno QA**, memakai apron dan wajah bulat; perubahan tetap ada setelah reload; tombol inspeksi mengikuti nama baru. Desain awal dipulihkan setelah pemeriksaan.
- [x] Yati terlihat membawa nampan; Deno terlihat menggunakan sapu.
- [x] Founder Office: dua sofa L, meja tengah, dan meja kerja di belakang yang menghadap pintu terlihat sesuai layout.
- [x] Gudang dan Ruang OB: barang penyimpanan, alat bersih-bersih, dan sudut istirahat terlihat.
- [x] Sesi preview development tersebut mencatat **0 error console**.
- [ ] Semua opsi warna/rambut/pakaian diuji ulang secara visual satu per satu.
- [ ] Kontak tangan/kaki dinilai pada setiap pose, kursi, sudut kamera, dan anak tangga.
- [ ] Seluruh kombinasi kerumunan/client dipantau secara visual sepanjang hari.
- [ ] Layout dan editor baru diuji pada perangkat fisik serta viewport kecil lainnya.

Rig menggunakan sendi hierarkis prosedural. Lengan mempunyai solusi dua sendi pada bidang depan; kaki duduk mengikuti tinggi acuan kursi. Belum ada skeletal clips, penguncian sol pada setiap langkah/permukaan, atau IK tubuh penuh. Penghindaran memakai ruang antartubuh, jalur alternatif, antrean, dan pemisahan jalur tangga; belum simulasi fisika tubuh.

### Inspeksi produksi · 13 Oktober 2026

- [x] Sepuluh siluet staf terlihat bersama pada preview 1280×720 setelah penggabungan render karakter.
- [x] Nampan Yati dan sapu Deno terlihat mengikuti pose; Deno dapat memakai apron, kacamata, dan wajah bulat, lalu kembali ke desain awal.
- [x] Klik langsung pada tubuh NOVA di dunia 3D membuka panel kondisi NOVA pada build final.
- [x] Build final dimuat kembali dari preview produksi tanpa error/warning console pada sesi pemeriksaan tersebut.

### Performa versi 0.7.0

Studio menyediakan FPS, draw calls, dan segitiga untuk pengukuran pada viewport/perangkat yang digunakan. Bagian karakter opaque yang berbagi geometri/material digabung ke draw yang sama; transform tetap mengikuti sendi dan visibilitas prop. Permukaan transparan mempertahankan render biasa.

Snapshot berikut dicatat setelah batching pada preview produksi final. Lineup menampilkan seluruh sepuluh karakter pada viewport **1280×720**.

| Scene Studio | Draw calls | Segitiga |
| --- | ---: | ---: |
| Yati · membawa nampan | 58 | 18k |
| Deno · menggunakan sapu | 51 | 19k |
| NOVA · satu karakter | 46 | 17k |
| Lineup · 10 karakter | 342 | 160k |

Renderer preview pada sesi ini mengalami pembatasan frame sekitar **1–3 FPS meskipun browser terlihat**. Angka tersebut tidak digunakan sebagai FPS yang mewakili perangkat atau sebagai bukti peningkatan performa. Pengukuran development sebelumnya, scene Phase 01 lama, dan snapshot final ini memakai kondisi berbeda sehingga tidak dibandingkan sebagai benchmark. Snapshot draw calls/segitiga juga berubah menurut pose, kamera, serta prop yang terlihat. Performa kantor penuh dan perangkat lain masih memerlukan pengukuran terpisah.

## Riwayat audit stabilitas · 12 Oktober 2026

Bagian ini merekam versi sebelum perluasan 0.7.0: **12 ruangan, 8 NPC, 7 pekerja, 6 peserta rapat**.

- [x] `pnpm test`: **50 lulus, 0 gagal**, sekitar 0,50 detik pada sesi tersebut.
- [x] `pnpm build`: TypeScript dan Vite berhasil, **608 modul**; Studio dimuat sebagai chunk terpisah.
- [x] Kantor dan Studio dimuat pada preview produksi port 4173 tanpa error/warning dari origin produksi.
- [x] Jalur masuk, titik kursi, counter, dan sofa founder diperbaiki setelah baseline 29 dari 40 tes lulus.
- [x] Tamu tetap terlihat di tangga/lantai dua, memakai kursi terpisah, dan menunggu Founder.
- [x] Konsultasi Felin, layanan Amanda saat berada di counter, reservasi kursi pantry, serta save client diperbaiki.
- [x] Kamera avatar meredam perubahan posisi/jarak dan mempertahankan arah kontrol; label peta hanya muncul dalam Director.
- [x] Judul browser, header, signage, profil, dan dokumen memakai identitas resmi.
- [x] Profil/palet studio dan kantor membaca sumber karakter yang sama.
- [x] Studio menahan jam pada 11:03 saat pemeriksaan ponsel; setelah ditutup jam kembali bergerak pada 1x.
- [x] Save lokal dan migrasi diperiksa menggunakan data lama dan baru yang berdampingan.

Build lama menampilkan peringatan ukuran bundle (engine/aplikasi sekitar 364 kB gzip). Warning HMR saat penggantian file development tidak muncul pada origin preview produksi. Angka bundle tersebut belum diperbarui untuk versi 0.7.0.

### Riwayat pemeriksaan lingkungan dan UI

- [x] Dua lantai terbaca; ruang kerja besar; material matte, kayu, kain, dan aksen langit/bintang diperiksa.
- [x] Desktop **1280×720**: panel, Studio, pilihan lantai/mode dapat digunakan; Avatar menyembunyikan panel hingga dibuka.
- [x] Portrait **390×844**: preview, pemilihan staf, tutup, dan gulir Studio dapat dijangkau.
- [x] Focus terlihat; Escape menutup Studio dan mengembalikan fokus ke tombol pembuka.
- [x] Balanced/High dapat dipilih; shadow light dibuat ulang ketika preset berubah.
- [ ] Wajah/cream menjaga detail pada semua kondisi cahaya pagi, kerja, dan malam.
- [ ] Landscape pendek, audit keyboard lengkap, reduced motion pada setiap pose, dan browser yang menolak penyimpanan.

Siluet delapan staf, ekspresi dekat NOVA, berdiri, duduk/bekerja, pinggul, sol kaki, orientasi monitor, dan tangan pada keyboard diperiksa pada sesi lama. Ini tidak menggantikan pemeriksaan visual semua penampilan serta pose baru.

### Snapshot performa Phase 01 lama

| Konfigurasi | Perangkat/viewport | FPS | Draw calls | Segitiga |
| --- | --- | ---: | ---: | ---: |
| Balanced · 1 karakter | Preview desktop 1280×720 | 48 | 84 | 17k |
| Balanced · 8 karakter | Preview desktop 1280×720 | 45 | 547 | 128k |
| High · 1 karakter + workstation | Preview produksi 1280×720 | 39 | 132 | 21k |
| Balanced · 1 karakter | Preview produksi portrait 390×844 | 111 | 72 | 16k |

Nilai merupakan snapshot penghitung renderer/RAF, berubah menurut kamera, viewport, dan beban komputer. Sesi tersebut bukan benchmark dengan scene/perangkat yang sama. Furnitur statis digabung berdasarkan material ketika ruangan dipasang; pintu, layar, karakter, dan prop bergerak tetap dinamis. Balanced membatasi DPR 1,25/shadow map 1024; High DPR 1,75/shadow map 2048. Belum ada sertifikasi lintas GPU/perangkat.

Gambar berikut adalah dokumentasi Phase 01 lama, bukan bukti layout 0.7.0:

![Kantor Phase 01](docs/previews/office-phase01.jpg)
![Preview kerja Phase 01](docs/previews/character-workstation.jpg)
![Studio portrait Phase 01](docs/previews/mobile-studio.jpg)

Aturan visual: [ART_DIRECTION.md](ART_DIRECTION.md). Kontrak gerak: [ANIMATION_PLAN.md](ANIMATION_PLAN.md). Menjalankan: [README.md](README.md).
