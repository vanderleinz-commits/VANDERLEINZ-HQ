# Blue and Space Headquarters — Animation Foundation

Phase 01 menyatukan gerakan staf, tamu, dan avatar. Rig yang dipakai di kantor juga dipakai di Studio visual. Preview menguji wajah, siluet, duduk, serta keterbacaan pada jarak Director dan Avatar.

## Kontrak rig

- Tinggi acuan tubuh sekitar **1,62 unit**, dengan rambut menambah tinggi siluet. Proporsi acuan **3,75 kepala**, toleransi visual 3,5–4 kepala.
- Depan karakter mengikuti sumbu lokal **+Z**; kelompok induk menentukan posisi dunia dan arah hadap.
- Pinggul, paha, lutut, bahu, siku, torso, kepala, mata, alis, dan mulut memakai kelompok sendi hierarkis.
- Titik pinggul duduk menggunakan **y = 0,64** pada koordinat lokal kursi. Furnitur dan animasi berbagi titik acuan.
- Rambut, pakaian, kulit, serta aksesori memakai profil yang sama di kantor dan studio. Variasi siluet mempertahankan rangka dasar.

Rig ini memakai geometri dan gerak sendi prosedural. Skeleton terikat mesh, clip GLB, motion capture, blend shape, serta inverse kinematics belum tersedia.

## Bahasa gerak

Ayunan bahu lembut, langkah tenang, kepala mengikuti perhatian, dan telapak yang terbaca menjadi gerak utama. Amplitudo dibatasi agar gestur tetap wajar. Mata, alis, kedipan, dan mulut memberi ekspresi neutral, happy, serta focused saat dilihat dekat.

Rotasi sendi dan perpindahan menuju duduk dibaurkan. Gerak visual berulang mengikuti laju maksimal 2x agar terbaca ketika simulasi 3x; perjalanan/jam tetap mengikuti kecepatan simulasi. Pause menghentikan fase gerak berulang. **Kurangi animasi** menurunkan gerak ringan/dekoratif.

| Pose | Kegunaan | Acuan visual |
| --- | --- | --- |
| Idle | Menunggu atau siap melayani | Bahu rileks, napas kecil, kedipan |
| Walk | Perjalanan antar titik | Ayunan tangan berlawanan kaki, langkah tenang |
| Stairs | Naik/turun tangga | Lutut terangkat dan elevasi mengikuti jalur |
| Work | Komputer | Duduk, siku menekuk, mengetik, melihat monitor |
| Talk | Rapat/percakapan | Gestur tangan dan anggukan bergantian |
| Think | Mendengarkan/menunggu | Gestur reflektif dekat kepala |
| Wave | Sapaan/dukungan | Tangan terangkat dengan ayunan terbatas |
| Coffee | Minum | Cangkir mendekati wajah lalu kembali |
| Eat | Pantry | Mangkuk, sendok, perhatian ke makanan |
| Read | Library/dokumen | Buku terbuka dan kepala menunduk |
| Inspect | ATLAS memeriksa tim | Tablet dan orientasi ke meja rekan |
| Repair | NEXUS memperbaiki perangkat | Tablet/alat dan gerak menuju area kerja |
| Cook | Pantry | Panci dan gerak mengaduk |
| Sign | Absensi/buku tamu | Pena dan menulis di depan tubuh |
| Toilet | Ruangan privat | Pose netral; karakter disembunyikan sesuai kegiatan |

## Kontak furnitur dan pemicu

`officeLayout.ts` menyediakan kursi kerja/rapat/makan/membaca dan titik layanan. Kegiatan mengikuti **perjalanan → tiba → aktivitas → kembali**; penghitung aktivitas dimulai setelah tiba. Pose mengacu pada arah furnitur, bukan arah kamera.

Work di studio memasang kursi/meja untuk menguji tinggi pinggul, sudut paha/lutut, jangkauan tangan, dan orientasi layar. Cangkir, buku, serta alat mengikuti kelompok tangan. Kontak masih berupa posisi/rotasi yang dirancang; tangan belum mengunci keyboard dan kaki belum menapak setiap anak tangga.

Percakapan dan rapat memakai giliran bicara. Amanda melayani dari belakang meja. Simulasi memilih kegiatan; rig menerima pose, duduk, ekspresi, kecepatan visual, serta pengurangan animasi, lalu mengatur presentasi.

## Validasi visual

1. Bandingkan delapan siluet pada kamera Miniature/Third person: tinggi, kepala, bahu, serta pakaian.
2. Orbit dari depan, sisi, dan belakang; periksa anggota tubuh dan aksesori.
3. Putar Walk/Stairs; periksa langkah dari jauh/dekat.
4. Uji Work/Talk/Read/Eat/Coffee saat duduk: pinggul, paha, lutut, alas kaki, prop, serta posisi meja.
5. Ganti tiga ekspresi pada Face detail; periksa mata/alis dan benturan permukaan.
6. Matikan animasi, tutup studio, dan periksa waktu kantor kembali ke laju sebelumnya.

Hasil perlu dilihat kembali di kantor karena kamera, cahaya, dan furnitur memengaruhi keterbacaan. Checklist ada di [QA.md](QA.md).

Furnitur, staf, client, dan avatar memakai elevasi permukaan lantai yang sama. Tamu memperbarui posisi vertikal serta pose tangga saat berpindah lantai. Founder dan ATLAS memakai dua titik sofa berbeda; tamu, ATLAS, dan Founder memakai kursi berbeda pada ruang client. Pantry memisahkan tujuh kursi staf dan satu kursi pemilik. Felin tetap di kursi lawan bicara selama konsultasi avatar berlangsung.

Kamera avatar mempertahankan satu arah pandang dan meredam target, tinggi, serta jarak secara terpisah. Benturan kamera hanya membaca arsitektur, sehingga monitor dan furnitur kecil tidak menyebabkan perubahan sudut berulang. Kontrol jalan mempertahankan arah walaupun jarak kamera berubah.

Fondasi dapat diganti dengan mesh berbobot/skeletal clips dengan mempertahankan kontrak proporsi, profil, arah hadap, pose, serta titik kursi. Pengembangan IK dan penghindaran kerumunan masih belum tersedia.
