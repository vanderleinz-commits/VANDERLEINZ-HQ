# Blue and Space Headquarters

**Project 001 · Dani Birthday Trial — version 0.8.0**

A little office. A world of possibility.

![Dokumentasi visual Phase 01 awal](docs/previews/office-phase01.jpg)

Gambar ini merekam fondasi Phase 01 awal. Layout 0.7.0 memiliki ruangan dan karakter tambahan yang dijelaskan di bawah.

Blue and Space adalah kantor miniatur 3D dengan identitas **Premium Cozy Stylized 3D**: biru yang tenang, permukaan cream, kayu hangat, tanaman, serta karakter manusia bergaya yang ekspresif. React, TypeScript, React Three Fiber, dan Three.js menjalankan dunia dan animasi di browser. Karakter, dialog, dan kegiatan memakai aturan scripted lokal tanpa AI API.

Phase 01 membentuk sistem grafis, karakter, dan animasi yang bisa dipakai ulang melalui simulasi lokal. Pemilik menjelajahi kantor sebagai avatar, memakai furnitur, ikut absensi/rapat, makan, minum, menggunakan WC, dan menerima client. Perilaku karakter serta client berjalan dengan aturan scripted; tidak ada AI API.

## Proyek pertama: ulang tahun Dani

Buka kantor lalu pilih **Mulai Senin · 06:00**. Tim menjalani tiga hari cerita khusus: konsep, produksi, dan penyerahan. Deadline Rabu, hari 3, pukul 16:00. Pada kecepatan 1x perjalanan ini sekitar 58 menit nyata; 3x sekitar 19 menit 20 detik selama tab aktif.

Client A datang melalui Amanda. Saat hasil siap, pilih **Duduk sebagai Founder**; avatar berjalan ke ruang meeting client. Setelah duduk bersama client dan Atlas, video MP4 14 detik dapat ditonton dan diunduh. Periksa hasil, lalu pilih diterima atau tulis catatan revisi.

Menutup atau memuat ulang proyek yang belum diputuskan mengulang ke Senin hari 1 pukul 06:00. Keputusan akhir, nama, dan penampilan tersimpan lokal di browser. Setelah diterima kantor kembali ke rutinitas; setelah meminta revisi, bawa catatannya ke chat untuk menyiapkan versi berikutnya. Keputusan berlaku per browser/perangkat. Lihat [PROJECTS.md](PROJECTS.md) untuk paket cerita dan aset.

## Menjalankan di komputer

Gunakan Node.js 24 atau Node.js 22.18+ dan pnpm. Buka terminal di folder proyek:

```sh
pnpm install
pnpm dev
```

Buka alamat **Local** yang ditampilkan terminal, biasanya [http://localhost:5173](http://localhost:5173). Biarkan terminal berjalan selama membuka kantor. Pengunduhan dependensi pertama kali memerlukan internet.

```sh
pnpm test
pnpm build
pnpm preview
```

`pnpm test` menjalankan pemeriksaan simulasi/navigasi yang tersedia. `pnpm build` memeriksa TypeScript dan membuat folder `dist`; `pnpm preview` membuka hasil build lokal.

Pemeriksaan rilis 0.7.0 pada 13 Oktober 2026: **77 tes lulus**, build berhasil, serta kantor dan Studio dimuat di preview produksi tanpa error/warning console. Snapshot renderer dan batas pengukurannya dicatat di [QA.md](QA.md).

## Mencoba fondasi visual

1. Buka **Studio visual** untuk melihat karakter dari dekat, mengganti pose/ekspresi, dan membandingkan sepuluh siluet tim. Preview memakai rig serta materi yang sama dengan kantor.
2. Pilih kamera **Miniature**, **Third person**, atau **Face detail**. Orbit dan zoom memperlihatkan aset dari berbagai sudut.
3. Coba **Bekerja** untuk memeriksa pose duduk di kursi dan orientasi ke komputer; bandingkan **Berjalan**, **Berdiskusi**, **Membaca**, dan **Menyapa**.
4. Pilih **Balanced** atau **High** pada kontrol grafis. Studio menampilkan FPS, draw calls, dan segitiga dari sesi renderer yang sedang dibuka.
5. Sembunyikan panel untuk menilai komposisi kantor. Kamera dan pilihan lantai tetap tersedia.

Waktu kantor berhenti selama Studio visual dibuka. Pilihan pose/ekspresi studio hanya mengubah preview. **Nama & penampilan** mengubah karakter di kantor: ketik nama lalu pilih **Simpan nama**, atau ubah model rambut, wajah, mata, kacamata, pakaian, dan warna. Perubahan tampilan tersimpan langsung dalam browser. **Pulihkan karakter ini** mengembalikan desain awal karakter terpilih. Peran dan ruangan mengikuti identitas tetap; nama serta penampilan bisa disesuaikan tanpa mengubah cerita.

Editor mencakup sepuluh staf, avatar Founder, serta tiga model tamu. Template tamu dipakai bersama oleh pengunjung yang mempunyai model tersebut.

## Menjelajahi kantor

- **Director:** drag untuk orbit, scroll untuk zoom, drag kanan untuk pan. Pilih ruangan melalui peta atau lantai.
- **Avatar:** WASD, tombol panah, atau tombol arah di layar; kamera mengikuti avatar. Tangga menghubungkan dua lantai. Dekati staf lalu gunakan E atau tombol Sapa.
- **Lantai:** Lantai 1 / Lantai 2 / Semua mengatur bagian bangunan yang terlihat. Pemilihan ruangan/staf menampilkan lantai yang sesuai.
- **Layar kecil:** Map dan Team membuka panel saat dibutuhkan.
- **Waktu:** pause / 1x / 2x / 3x. Pada 1x, satu detik nyata sama dengan satu menit game; satu hari berlangsung 24 menit nyata.
- **Kurangi animasi:** tersedia pada panel cerita kantor. Gerak ringan/dekoratif dikurangi sementara pose dan navigasi tetap terbaca.

| Lantai 1 | Lantai 2 |
| --- | --- |
| Lobby & Reception (2×), Open Workspace (2×), Pantry, Database Server, Library, WC 1, WC 2, Gudang dan Ruang OB | Meeting Room, Founder Office, Manager Office, HRD, Client Meeting Room |

ATLAS berada di Manager Office; NOVA, LYRA, ORION, dan SAGE berbagi Open Workspace; NEXUS di Database Server; Felin mengelola HRD; Amanda menyambut orang dari counter lobby. Yati menangani minuman dan catering; Deno merawat kebersihan kantor. Gudang menjadi tempat peralatan serta istirahat keduanya. Avatar pemilik mewakili Founder. Sepuluh NPC memakai satu keluarga proporsi, bahan, dan rig.

Client acak mendaftar ke Amanda lalu menunggu di Client Meeting Room. Mereka bisa mencari Founder, ATLAS, atau keduanya. Pertemuan dapat melibatkan rekan tim pada kursi terpisah. Owner-avatar yang bergabung akan menerima client; permintaan Founder yang terlewat hingga pukul 17.00 mengurangi HQ Points. Amanda juga dapat mengambil jeda singkat ke pantry/WC, lalu kembali ke counter.

Jadwal tersedia berulang Senin–Minggu: pukul 07:00 lampu menyala dan staf datang bertahap melalui resepsionis; kerja 08:00–12:00 dan 13:00–17:00; istirahat 12:00–13:00. Pilihan istirahat acak tersebar di meja kerja, library, lounge resepsionis, pantry, atau area OB. Setelah absen pulang, staf keluar dan kantor meredup. Pintu interior berupa pintu geser otomatis yang membuka saat seseorang memasuki ruang; pintu utama merespons dari sisi masuk.

## Kantor yang lebih lapang dan layanan harian

- **13 ruangan:** panjang dan lebar ruangan bertambah 30%, sehingga luasnya menjadi sekitar 1,69× layout sebelumnya. Resepsionis dan open workspace tetap dua kali luas ruang standar.
- **Founder Office:** dua sofa L dengan meja tengah; meja kerja berada di belakang dan menghadap pintu. Meja HRD, Manager, dan IT juga menghadap pintu dari sisi belakang ruangan.
- **Lobby:** lounge di ujung ruangan, tanaman, karya dinding, rak, dan area antrean. Absensi dilayani satu per satu; perjalanan memakai penghindaran dan jalur memutar saat ada orang yang menghalangi.
- **Yati:** menyiapkan kopi di pantry, membawa nampan, lalu mengantar minuman ke staf, pemilik yang bekerja, dan client. Cangkir di meja muncul setelah pengantaran selesai. Ia menyiapkan catering sebelum istirahat.
- **Deno:** mengambil jalur keliling kantor dan menyapu ruangan bergantian, termasuk ruang di lantai dua. Keduanya mengikuti jam masuk, istirahat, dan absen pulang staf.
- **Gerak:** tangan menyesuaikan titik keyboard/nampan, telapak kaki lebih stabil saat duduk, dan peralatan tetap terlihat selama perjalanan serta tangga.

## Save dan hosting

**Save** dan autosave menyimpan permainan dalam browser; editor menyimpan penampilan secara terpisah. Data terikat pada browser, perangkat, dan alamat situs. `localhost`, `127.0.0.1`, alamat hosting, serta port berbeda mempunyai penyimpanan berbeda. Save belum tersinkron antarperangkat. Gunakan alamat yang sama untuk melanjutkan permainan.

Alamat kantor: [Blue and Space Headquarters](https://vanderleinz-hq-office-tycoon.vanderleinz.chatgpt.site). Akses hosting tetap terbatas pada akun pemilik yang diizinkan.

Hosting menyajikan folder build `dist`; checkout hosting memetakan proyek melalui `.openai/hosting.json`. Save versi sebelumnya dibaca melalui jalur migrasi yang tersedia, termasuk penyesuaian layout yang diperbesar dan penambahan staf OB. Menutup tab menghentikan simulasi; progres offline belum tersedia. Penyimpanan yang ditolak/penuh ditampilkan sebagai kegagalan Save.

## Sumber bersama

| Bagian | Sumber |
| --- | --- |
| Nama, palet, bahan, ukuran, kualitas grafis | `src/artDirection.ts` |
| Siluet, pakaian, kulit, rambut, kepribadian dan save penampilan | `src/characterProfiles.ts` |
| Rig hierarkis, kontak tangan/kaki, aksesori, pose prosedural dan penggabungan render | `src/CharacterRig.tsx`, `src/characterContacts.ts`, `src/AnimatedCharacterBatch.ts` |
| Editor penampilan, preview aset dan pengukuran renderer | `src/VisualStudio.tsx`, `src/CharacterEditor.tsx` |
| Ruangan, staf, furnitur, titik aktivitas | `src/worldData.ts`, `src/officeLayout.ts`, `src/OfficeArchitecture.tsx`, `src/BuildingShell.tsx` |
| Cahaya dan gerak lingkungan | `src/RoomLife.tsx` |
| Kamera, kontrol, dan UI | `src/App.tsx`, `src/styles.css` |
| Jadwal, navigasi, antrean, layanan, interaksi, save | `src/simulation.ts`, `src/navigation.ts`, `src/crowd.ts`, `src/officeServices.ts`, `src/social.ts` |

Lihat [ART_DIRECTION.md](ART_DIRECTION.md), [ANIMATION_PLAN.md](ANIMATION_PLAN.md), serta [QA.md](QA.md) untuk aturan visual, kontrak gerakan, dan pemeriksaan.

Karakter memakai geometri lokal dengan sendi hierarkis prosedural, belum model GLB dengan skeletal clips. Kontak lengan memakai perhitungan dua sendi pada bidang depan; kaki duduk mengikuti tinggi acuan kursi. Penghindaran memakai jarak antarkarakter, antrean, dan navigasi; belum simulasi fisika tubuh, penguncian telapak untuk setiap langkah, atau kontak tangan penuh pada semua permukaan. Avatar memakai titik interaksi furnitur yang sama dengan dunia kantor. FPS studio menggambarkan sesi/perangkat saat itu, bukan jaminan semua perangkat.

## Pengembangan kantor · 13 Oktober 2026

Jalur masuk dan titik kursi diselaraskan dengan furnitur. Pantry menyediakan sepuluh kursi terpisah untuk sembilan pekerja dan avatar pemilik; pilihan istirahat tersebar mengurangi kepadatan. Tamu, host, dan pendamping tim mempunyai kursi terpisah di ruang client. Tamu tetap terlihat ketika menaiki tangga serta berada di lantai dua.

Kamera avatar memakai arah kontrol tetap dan perpindahan yang diredam; perubahan jarak untuk menghindari dinding tidak mengubah arah berjalan. Label peta hanya muncul dalam Director agar pandangan avatar lebih terbuka. Pintu interior mengikuti tujuan masuk/keluar, dan Amanda melayani setelah kembali ke counter. Hasil pemeriksaan dan batas validasi ada di [QA.md](QA.md).
