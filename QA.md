# Catatan pengujian milestone 4

## Hasil yang sudah dikonfirmasi

- `pnpm test`: **25/25 lulus**.
- `pnpm build`: pemeriksaan TypeScript dan build produksi lulus.
- Preview HTTP mengembalikan status 200. Browser menampilkan kedatangan bertahap, Amanda di resepsionis, staf duduk mengetik, enam peserta duduk berdiskusi pada rapat 60 menit, lalu kantor kosong dan lampu mati pada malam hari. Console browser tidak mencatat error/warning.

## Simulasi dan navigasi

Sembilan pengujian dasar memeriksa:

1. Rasio waktu 1x/2x/3x dan pergantian hari.
2. Pause membekukan jam, perjalanan NPC, kebutuhan, rapat, dan pendapatan.
3. Titik aktivitas ruangan terhubung ke pintu depan melalui jalur aman.
4. Avatar tidak menembus dinding atau furnitur saat pembaruan panjang.
5. Pergantian kegiatan pada batas jam buka, kerja, makan siang, dan tutup.
6. Pendapatan hanya saat bekerja serta pemulihan kebutuhan setelah tiba di Canteen.
7. Kebutuhan tetap dalam batas selama beberapa hari kerja dan malam kosong.
8. Migrasi save lama dan pemulihan data rusak.
9. Pemulihan posisi, kebutuhan, progres kerja, arahan, Avatar, dan jalur yang valid.

## Rutinitas kantor dan save versi 4

Delapan pengujian khusus memeriksa:

1. Kantor buka pukul 07:00, Amanda datang lebih dahulu, lalu pekerja masuk bertahap melalui pintu utama.
2. Seluruh kursi kerja/rapat/makan memiliki titik duduk aman dan dapat dicapai; Amanda berdiri di pos resepsionis.
3. Pekerja sesekali berjalan dalam departemennya dan kembali ke kursi komputer.
4. Pukul 12:00–13:00 menjadi istirahat tetap di Canteen, lalu seluruh pekerja kembali ke departemen; Amanda tetap menjaga resepsionis.
5. Agenda rapat bervariasi antar-hari, tetap sama saat dibuat ulang untuk hari yang sama, menunggu enam peserta duduk, berlangsung 30–60 menit diskusi, dan mengembalikan tim bekerja.
6. Pukul 17:00 pekerjaan berhenti, staf berjalan keluar, kantor menjadi kosong/lampu mati, dan kedatangan berulang esok pagi.
7. Nama hari berulang Senin–Minggu; pekerja tetap datang pada Sabtu/Minggu.
8. Save versi 3 dimigrasikan menjadi versi 4 dengan kebutuhan, progres kerja, hari, dan Credits dipertahankan; Amanda ditambahkan pada lokasi aman.

Kantor kosong dan lampu mati juga dilihat langsung pada preview browser setelah 19:00.

## Interaksi dan kursi bersama

Delapan pengujian sosial memeriksa:

1. Dua pekerja mencapai kursi, bergantian berbicara, mendapat hubungan, dan tidak mengubah state sebelumnya.
2. Ngobrol, brainstorm, dan dukungan selesai dari departemen berbeda dengan manfaat masing-masing.
3. Pekerja sibuk/tidak hadir, Amanda, jam tutup, dan rapat tim menolak perintah pasangan.
4. Makan siang membentuk tiga pasangan pada enam kursi berbeda sementara Amanda menjaga resepsionis.
5. Pause membekukan percakapan; pembatalan mengembalikan tujuan kerja kedua peserta.
6. Akhir makan siang, awal rapat, dan penutupan kantor membatalkan kegiatan tanpa bonus penyelesaian.
7. Save versi 4 memulihkan kursi peserta, fase, hubungan, dan sisa waktu percakapan.
8. Interaksi rusak, duplikat, kedaluwarsa, atau melibatkan Amanda ditolak saat dimuat.

## Pemeriksaan visual browser

Preview desktop dan panel kecil diperiksa: desain kantor, kedatangan staf, karakter duduk di depan komputer, panel kondisi staf, agenda, pause/3x, rapat enam kursi dengan dialog, serta kantor kosong pada malam hari. Sudut kamera lebih tinggi memperlihatkan posisi duduk; feed aktivitas ringkas pada panel kecil menjaga ruang pandang. Rutinitas makan siang, animasi makan/minum dan pemulihan state diperiksa melalui pengujian simulasi/kode; visual makan siang belum diamati secara langsung pada browser.

## Batas validasi

Pengujian perilaku memeriksa simulasi, navigasi, dan save. Kontak tangan/kaki dengan furnitur dan perpindahan pose menggunakan animasi prosedural; belum ada pembandingan otomatis setiap frame, pengujian motion capture, atau uji GPU/perangkat lain.

Kursi memakai titik posisi tetap. Avatar belum dapat duduk atau berinteraksi dengan komputer; NPC belum saling menghindari. Visual mempertahankan gaya kantor miniatur pastel.

Cara menjalankan dan batas prototype tersedia di [README.md](README.md); pemetaan animasi tersedia di [ANIMATION_PLAN.md](ANIMATION_PLAN.md).
