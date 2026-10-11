# VANDERLEINZ-HQ

## AI HQ — Office Tycoon Simulator

## Milestone 3: interaksi dan animasi 3D

Kantor miniatur pastel blue/cream/wood dengan delapan ruangan, enam NPC scripted, Director/Avatar modes, accelerated time, local save, dan virtual HQ Credits. Dibangun memakai React, TypeScript, React Three Fiber, dan Three.js. Semua aset, dialog, animasi, dan simulasi berjalan lokal tanpa AI API, API key, akun, atau pembayaran nyata.

## Menjalankan

Buka terminal di folder proyek ini lalu jalankan:

```sh
pnpm install
pnpm dev
```

Buka alamat Local yang muncul, biasanya http://localhost:5173. Biarkan terminal berjalan selama bermain. Refresh preview yang sudah terbuka untuk memuat pembaruan. Internet diperlukan untuk mengunduh dependensi pertama kali.

Aplikasi memerlukan Node.js 20.19+ dan pnpm. Pengujian TypeScript bawaan memerlukan Node.js 22.18+ atau 24.

```sh
pnpm test     # Pengujian simulasi, navigasi, save, dan interaksi
pnpm build    # Pemeriksaan TypeScript dan build produksi
pnpm preview # Melihat build produksi secara lokal
```

Save terikat pada browser dan alamat/port. Browser atau port yang berbeda memakai save terpisah.

## Cara bermain

- **Director:** drag untuk orbit, scroll untuk zoom, drag kanan untuk pan. Klik lantai atau pilih ruangan melalui Office map.
- **Layar kecil:** tombol **Map** dan **Team** membuka panel agar kantor tetap terlihat.
- **NPC:** klik karakter atau nama staf. Tab **Kondisi** menampilkan energi, fokus, sosial, dan progres kerja. Tab **Interaksi & hubungan** menampilkan kedekatan dengan lima rekan.
- **Kegiatan bersama:** pada tab Interaksi, pilih rekan dan kegiatan lalu tekan **Mulai interaksi**. Kedua karakter berjalan ke tempat berpasangan, menunggu rekan, saling menghadap, dan berbicara bergantian. Bonus diberikan setelah kegiatan selesai. **Akhiri interaksi** membatalkan kegiatan tanpa bonus.
- **Office Stories:** tombol **Lihat cerita** di HQ Moments menampilkan interaksi aktif dan catatan kantor. Pengaturan **Kurangi animasi** tersedia di panel ini dan ikut tersimpan.
- **Arahan:** tab Kondisi memiliki tombol **Arahkan bekerja** dan **Istirahat di Lounge**, berlaku 60 menit game. Arahan pribadi membatalkan kegiatan bersama karakter tersebut dan mengembalikan rekannya ke jadwal.
- **Avatar:** pilih Avatar / Enter Avatar. WASD, tombol panah, atau tombol gerak di layar untuk berjalan mengikuti arah layar. Dinding dan furnitur menghalangi gerakan.
- **Menyapa:** dekati staf lalu tekan E atau tombol Sapa. Avatar dan NPC melambai, dialog scripted muncul, dan kebutuhan sosial NPC bertambah. Jeda 10 detik nyata antar-sapaan.
- **Waktu:** pause / 1x / 2x / 3x. Pada 1x, 1 detik nyata = 1 menit game; satu hari = 24 menit nyata. Pause menghentikan NPC, kebutuhan, pendapatan, interaksi, dan dekorasi. Avatar, kamera, serta pintu yang merespons Avatar tetap bisa bergerak.
- **Save:** penyimpanan manual dan autosave setiap 15 detik. Posisi, kondisi NPC, arahan, progres kerja, waktu, Credits, kecepatan, mode, hubungan, interaksi aktif, dan pilihan animasi tersimpan. Save milestone 1/2 dimigrasikan otomatis ketika belum ada save milestone 3.

## Jadwal tim

| Waktu game | Kegiatan |
| --- | --- |
| 08:00–10:00 | Kerja di ruang masing-masing |
| 10:00–11:00 | Rapat di Meeting Room |
| 11:00–12:00 | Kerja |
| 12:00–13:00 | Makan siang di Lounge |
| 13:00–15:00 | Kerja |
| 15:00–15:30 | Istirahat di Lounge |
| 15:30–18:00 | Kerja |
| 18:00–08:00 | Santai di Lounge |

ATLAS (operasi), NOVA (kreatif), LYRA (people & culture), ORION (riset), SAGE (komunitas), dan NEXUS (sistem) memiliki kondisi tersendiri. Energi di bawah 25 atau fokus di bawah 20 saat bekerja memicu istirahat otomatis. Setiap 60 menit benar-benar bekerja menghasilkan 10 HQ Credits virtual per NPC; perjalanan dan percakapan tidak dihitung sebagai kerja. Credits belum dapat dibelanjakan.

## Interaksi bersama

NPC mengobrol otomatis ketika berkumpul di Lounge atau rapat. Mereka memiliki jeda antar-kegiatan dan memilih hubungan yang belum dekat ketika beberapa rekan tersedia. Maksimal tiga pasangan aktif sekaligus, masing-masing memakai tempat berpasangan yang berbeda. Satu NPC hanya dapat mengikuti satu kegiatan bersama.

| Kegiatan | Tempat | Durasi setelah tiba | Manfaat per NPC |
| --- | --- | --- | --- |
| Ngobrol santai | Lounge | 14 menit game | Sosial +18, fokus +5, kedekatan +8 |
| Brainstorm | Meeting Room | 20 menit game | Fokus +12, sosial +12, kedekatan +8 |
| Beri semangat | Lounge | 12 menit game | Energi +8, sosial +12, fokus +5, kedekatan +10 |

Kedekatan 0–39: Mulai kenal; 40–69: Akrab; 70–100: Kompak. Kebutuhan dan kedekatan dibatasi 0–100. Interaksi tidak memberikan pembayaran tambahan; manfaatnya berupa hubungan dan kondisi karakter.

## Animasi

Karakter memakai rig geometri lokal dengan kepala, mata, tangan, dan kaki: berjalan, bekerja menggunakan tablet, berbincang, berpikir/mendengarkan, melambai, minum, dan idle. Gerak sendi bertransisi halus; gelembung dialog mengikuti giliran bicara.

Ruangan mendapat pintu otomatis, lampu hangat, layar yang aktif sesuai keberadaan staf, kipas server, uap minuman, ornamen studio/lab, jarum jam, dan pencahayaan siang–malam. Animasi visual mengikuti kecepatan hingga 2x untuk kenyamanan; navigasi dan jam tetap mengikuti pilihan 1x/2x/3x.

Rincian pose, pemicu tiap ruangan, struktur, dan tahap berikutnya: [ANIMATION_PLAN.md](ANIMATION_PLAN.md).

## Penyimpanan dan batas prototype

- Kunci save: `vanderleinz-hq-milestone-3`. Save milestone 1/2 dipertahankan sebagai sumber migrasi.
- Data save divalidasi; data rusak menggunakan nilai aman. Penolakan/penuhnya penyimpanan browser ditampilkan sebagai kegagalan Save.
- Tab tersembunyi menghentikan simulasi; belum ada progres offline. Jeda sistem dibatasi menjadi pembaruan maksimal 0,5 detik nyata.
- Karakter masih berdiri pada titik aktivitas. Animasi duduk/makan, gerak tangan yang tepat ke furnitur, dan tabrakan antar-karakter belum diterapkan. Pintu merupakan dekorasi yang otomatis membuka.
- Belum ada perekrutan, pembelian furnitur, upgrade, gaji, atau proyek bisnis.

## Struktur

- `src/worldData.ts`: definisi ruangan dan staf.
- `src/navigation.ts`: tapak dinding/furnitur, jalur, dan tabrakan Avatar.
- `src/simulation.ts`: jam, kondisi, pendapatan, arahan, dan migrasi save.
- `src/social.ts`: pasangan, dialog, hubungan, bonus, dan pemilihan rekan.
- `src/CharacterRig.tsx`: rig dan transisi pose.
- `src/RoomLife.tsx`: animasi ruangan dan pencahayaan.
- `src/SpeechBubble.tsx`: gelembung dialog 3D.
- `src/App.tsx`: dunia 3D, kamera, input, dan panel permainan.
- `tests/simulation.test.ts`, `tests/social.test.ts`: 17 pengujian perilaku.

