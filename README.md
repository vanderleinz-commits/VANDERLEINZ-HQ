# Blue and Space Headquarters

**Phase 01 · Visual Foundation — version 0.6.0**

A little office. A world of possibility.

![Blue and Space Headquarters](docs/previews/office-phase01.jpg)

Blue and Space adalah kantor miniatur 3D dengan identitas **Premium Cozy Stylized 3D**: biru yang tenang, permukaan cream, kayu hangat, tanaman, serta karakter manusia bergaya yang ekspresif. React, TypeScript, React Three Fiber, dan Three.js menjalankan dunia dan animasi di browser. Karakter, dialog, dan kegiatan memakai aturan scripted lokal tanpa AI API.

Phase 01 membentuk sistem grafis, karakter, dan animasi yang bisa dipakai ulang melalui simulasi lokal. Pemilik menjelajahi kantor sebagai avatar, memakai furnitur, ikut absensi/rapat, makan, minum, menggunakan WC, dan menerima client. Perilaku karakter serta client berjalan dengan aturan scripted; tidak ada AI API.

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

## Mencoba fondasi visual

1. Buka **Studio visual** untuk melihat karakter dari dekat, mengganti pose/ekspresi, dan membandingkan delapan siluet. Preview memakai rig serta materi yang sama dengan kantor.
2. Pilih kamera **Miniature**, **Third person**, atau **Face detail**. Orbit dan zoom memperlihatkan aset dari berbagai sudut.
3. Coba **Bekerja** untuk memeriksa pose duduk di kursi dan orientasi ke komputer; bandingkan **Berjalan**, **Berdiskusi**, **Membaca**, dan **Menyapa**.
4. Pilih **Balanced** atau **High** pada kontrol grafis. Studio menampilkan FPS, draw calls, dan segitiga dari sesi renderer yang sedang dibuka.
5. Sembunyikan panel untuk menilai komposisi kantor. Kamera dan pilihan lantai tetap tersedia.

Waktu kantor berhenti selama Studio visual dibuka. Pilihan pose/ekspresi studio hanya mengubah preview.

## Menjelajahi kantor

- **Director:** drag untuk orbit, scroll untuk zoom, drag kanan untuk pan. Pilih ruangan melalui peta atau lantai.
- **Avatar:** WASD, tombol panah, atau tombol arah di layar; kamera mengikuti avatar. Tangga menghubungkan dua lantai. Dekati staf lalu gunakan E atau tombol Sapa.
- **Lantai:** Lantai 1 / Lantai 2 / Semua mengatur bagian bangunan yang terlihat. Pemilihan ruangan/staf menampilkan lantai yang sesuai.
- **Layar kecil:** Map dan Team membuka panel saat dibutuhkan.
- **Waktu:** pause / 1x / 2x / 3x. Pada 1x, satu detik nyata sama dengan satu menit game; satu hari berlangsung 24 menit nyata.
- **Kurangi animasi:** tersedia pada panel cerita kantor. Gerak ringan/dekoratif dikurangi sementara pose dan navigasi tetap terbaca.

| Lantai 1 | Lantai 2 |
| --- | --- |
| Lobby & Reception (2×), Open Workspace (2×), Pantry, Database Server, Library, WC 1, WC 2 | Meeting Room, Founder Office, Manager Office, HRD, Client Meeting Room |

ATLAS berada di Manager Office; NOVA, LYRA, ORION, dan SAGE berbagi Open Workspace; NEXUS di Database Server; Felin mengelola HRD; Amanda menyambut orang dari counter lobby. Avatar pemilik mewakili Founder, sehingga tidak ada NPC Akbar. Delapan karakter NPC memakai satu keluarga proporsi, bahan, dan rig.

Client acak mendaftar ke Amanda lalu menunggu di Client Meeting Room. Mereka bisa mencari Founder, ATLAS, atau keduanya. Owner-avatar yang bergabung akan menerima client; permintaan Founder yang terlewat hingga pukul 17.00 mengurangi HQ Points. Amanda juga dapat mengambil jeda singkat ke pantry/WC, lalu kembali ke counter.

Jadwal tersedia berulang Senin–Minggu: pukul 07:00 lampu menyala dan staf datang bertahap melalui resepsionis; kerja 08:00–12:00 dan 13:00–17:00; makan siang 12:00–13:00. Setelah absen pulang, staf keluar dan kantor meredup. Pintu interior berupa pintu geser otomatis yang membuka saat seseorang memasuki ruang; pintu utama merespons dari sisi masuk. Founder Office memiliki meja kerja menghadap menjauhi pintu dan area sofa-meja untuk percakapan.

## Save dan hosting

**Save** dan autosave menyimpan permainan dalam browser. Data terikat pada browser, perangkat, dan alamat situs. `localhost`, `127.0.0.1`, alamat hosting, serta port berbeda mempunyai penyimpanan berbeda. Save belum tersinkron antarperangkat. Gunakan alamat yang sama untuk melanjutkan permainan.

Hosting menyajikan folder build `dist`; checkout hosting memetakan proyek melalui `.openai/hosting.json`. Save versi sebelumnya dibaca melalui jalur migrasi yang tersedia. Menutup tab menghentikan simulasi; progres offline belum tersedia. Penyimpanan yang ditolak/penuh ditampilkan sebagai kegagalan Save.

## Sumber bersama

| Bagian | Sumber |
| --- | --- |
| Nama, palet, bahan, ukuran, kualitas grafis | `src/artDirection.ts` |
| Siluet, pakaian, kulit, rambut, kepribadian | `src/characterProfiles.ts` |
| Rig hierarkis, wajah, aksesori, pose prosedural | `src/CharacterRig.tsx` |
| Preview aset dan pengukuran renderer | `src/VisualStudio.tsx` |
| Ruangan, staf, furnitur, titik aktivitas | `src/worldData.ts`, `src/officeLayout.ts`, `src/OfficeArchitecture.tsx`, `src/BuildingShell.tsx` |
| Cahaya dan gerak lingkungan | `src/RoomLife.tsx` |
| Kamera, kontrol, dan UI | `src/App.tsx`, `src/styles.css` |
| Jadwal, navigasi, interaksi, save | `src/simulation.ts`, `src/navigation.ts`, `src/social.ts` |

Lihat [ART_DIRECTION.md](ART_DIRECTION.md), [ANIMATION_PLAN.md](ANIMATION_PLAN.md), serta [QA.md](QA.md) untuk aturan visual, kontrak gerakan, dan pemeriksaan.

Karakter memakai geometri lokal dengan sendi hierarkis prosedural, belum model GLB dengan skeletal clips. Kontak tangan/kaki belum memakai inverse kinematics. NPC belum menghindari kerumunan secara fisik. Avatar memakai titik interaksi furnitur yang sama dengan dunia kantor. FPS studio menggambarkan sesi/perangkat saat itu, bukan jaminan semua perangkat.

## Revisi stabilitas · 12 Oktober 2026

Jalur masuk dan titik kursi telah diselaraskan dengan furnitur. Sofa founder berada pada koordinat ruangannya; meja HRD, kursi konsultasi, dan posisi kerja Felin tidak lagi saling menghalangi. Pantry menyediakan delapan kursi terpisah untuk tujuh karyawan dan avatar pemilik. Tamu mempunyai kursi sendiri dan tetap terlihat ketika menaiki tangga serta berada di lantai dua.

Kamera avatar memakai arah kontrol tetap dan perpindahan yang diredam; perubahan jarak untuk menghindari dinding tidak mengubah arah berjalan. Label peta hanya muncul dalam Director agar pandangan avatar lebih terbuka. Pintu interior mengikuti tujuan masuk/keluar, dan Amanda melayani setelah kembali ke counter. Pengujian regresi mencakup 50 kasus; hasil lengkap dan batas pemeriksaan ada di [QA.md](QA.md).
