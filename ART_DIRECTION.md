# Blue and Space Headquarters — Official Visual Foundation

**Phase 01 · Premium Cozy Stylized 3D**

Nama resmi: **Blue and Space Headquarters**. Nama pendek: **Blue and Space**.

Kantor miniatur yang hangat, kreatif, cerdas, dan terbuka memakai arsitektur lembut, kayu hangat, manusia bergaya yang ekspresif, serta benda sehari-hari yang memberi cerita. Tiny Glade, Two Point Campus, dan Unpacking menjadi referensi luas untuk kehangatan, keterbacaan, serta cerita interior. Bentuk staf, furnitur, signage, dan dekorasi merupakan aset orisinal.

## Prinsip bersama

- Satu keluarga proporsi, rig, bahan, serta bahasa bentuk untuk staf/avatar.
- Rambut, pakaian, dan pose terbaca dari Director; wajah tetap menarik ketika Avatar mendekat.
- Buku, mug, lampu, serta tanaman memberi konteks; permukaan kosong menjaga komposisi tenang.
- Biru menjadi identitas utama dengan cream, kayu, sand, dan aksen tiap ruangan.
- Kantor dan studio memakai aset/profil yang sama; detail ditambah setelah biaya renderer diukur.

## Palet resmi

| Warna | Hex | Peran |
| --- | --- | --- |
| Midnight Blue | `#142D56` | Identitas, teks, detail blazer |
| Soft Corporate Blue | `#497FB5` | Kontrol aktif, pakaian, trim |
| Sky Blue | `#A9D5F2` | Sorotan dan motif langit |
| Cloud White | `#E8F3FA` | Latar/permukaan terang |
| Warm Sand | `#F2D9B5` | Pantry dan aksen hangat |
| Soft Lavender | `#B7A3D5` | Kreativitas/HRD/pakaian |
| Muted Teal | `#62AAA5` | Teknik dan status aktif |
| Warm Cream | `#FAF5EC` | Dinding, kain ringan, keramik |
| Warm Wood | `#C99D70` | Furnitur utama |
| Light / Dark Wood | `#E0BC92` / `#8C674A` | Variasi kayu dan sambungan |

`src/artDirection.ts` merupakan sumber bersama. Midnight dipakai untuk teks penting; biru gelap untuk teks sekunder. Cloud/sand/lavender/teal dipakai sebagai permukaan atau aksen. Kulit/rambut memakai variasi alami hangat pada `src/characterProfiles.ts`.

## Stylized Miniature Humans

Proporsi acuan **3,75 kepala**, toleransi 3,5–4 kepala. Tinggi tubuh sekitar **1,62 unit** sebelum variasi rambut. Kepala sedikit diperbesar, wajah lembut, bahu membulat, torso ringkas, serta lengan/kaki pendek dengan proporsi yang tetap manusiawi. Telapak/ibu jari dan sepatu memberikan bentuk tangan/kaki yang terbaca.

Mata/alis ekspresif, rambut bermassa jelas, serta pakaian dengan tepi lembut menjadi bahasa bentuk. Ukuran kepala dijaga agar duduk/mengetik tetap masuk akal. Jabatan tidak mengubah rasio tubuh.

| Staf | Siluet | Pakaian/warna | Pembawaan |
| --- | --- | --- | --- |
| ATLAS | Side part rapi, bahu jaket lembut | Corporate blue, cloud, midnight | Tenang, perhatian |
| NOVA | Bob asimetris, overshirt ringkas | Lavender, cream, sand | Kreatif, ekspresif |
| LYRA | Ponytail rendah, clasp lavender | Dusty blue blouse | Ramah, mengamati |
| ORION | Curls, kacamata bundar | Muted teal cardigan | Teliti, penasaran |
| SAGE | Rambut tersapu, rolled sleeves | Warm sand, detail teal | Hangat, santai |
| NEXUS | Quiff, kacamata ramping | Deep teal overshirt | Fokus, sabar |
| Amanda | Bun rendah, collar rapi, pin hangat | Sky blue uniform | Menyambut, ceria |
| Akbar | Swept back hair, blazer lembut | Midnight, cream, logam hangat | Reflektif, terbuka |

`worldData.ts` mengambil appearance staf dari profil ini. Geometri dibagi antar karakter; satu rig sendi hierarkis prosedural menggerakkan seluruh cast. Belum ada mesh skeletal clips. Ekspresi neutral/happy/focused menggunakan mata, alis, mulut, serta kedipan. Bahasa gerak dan acuan kursi ada di [ANIMATION_PLAN.md](ANIMATION_PLAN.md).

## Arsitektur dan interior

Volume sederhana, sudut membulat, kayu/cream/biru, serta detail pada area yang dilihat memberi kesan miniatur yang dirancang tangan. Reception memakai counter kayu/signage/tanaman; workspace empat meja dengan jalur lega; meeting tujuh kursi dan meja sebagai fokus. Founder/Manager memakai biru lebih dalam. Pantry memakai sand/cream; server muted teal; HRD lavender; library kayu/daun; WC keramik cream/trim blue.

Bintang, lengkung langit, serta lingkaran geometris digunakan sebagai hiasan kecil pada karya dinding/signage. Setting tetap kantor yang membumi. Hindari kapal luar angkasa, neon/hologram, serta mesin futuristis dominan.

Barang kecil disusun konsisten tanpa menutup wajah, meja, atau jalur. Tepi meja/kursi menarik saat dekat; siluet ruangan jelas saat jauh. Bahan/furnitur menggunakan bentuk lembut dan variasi halus tanpa tekstur fotorealistis padat.

## Bahan dan cahaya

| Permukaan | Roughness | Metalness | Aturan |
| --- | ---: | ---: | --- |
| Plaster | 0,93 | 0 | Matte, warna ringan |
| Wood | 0,78 | 0 | Hangat, variasi warna halus |
| Fabric | 0,96 | 0 | Lembut, highlight kecil |
| Skin | 0,84 | 0 | Warna hangat, permukaan lembut |
| Ceramic | 0,60 | 0 | Highlight terbatas |
| Trim | 0,58 | 0,16 | Aksen logam kecil |

Gunakan `MeshStandardMaterial`/`SURFACES`. Hindari refleksi tajam pada dinding, wajah, dan pakaian. Warna/bentuk menjadi detail utama. Bahan serta geometri yang sama dibagi antar objek.

Cahaya hangat dari atas membentuk volume; hemisphere/ambient memberi kesan cahaya pantul lembut; biru langit menjaga keseimbangan. Bayangan kontak memberi pijakan furnitur/kaki. Tone mapping menjaga highlight serta detail cream. Phase 01 memakai penerangan langsung/ambient yang efisien; global illumination, AO layar, dan bloom berat belum diperlukan.

| Kualitas | Batas DPR | Shadow map |
| --- | ---: | ---: |
| Balanced | 1,25 | 1024 |
| High | 1,75 | 2048 |

Studio dibuat saat dibuka. Ukur FPS, draw calls, dan segitiga bersama viewport/perangkat; angka sesi belum menjadi jaminan semua GPU. Batasi segmen mesh, sumber bahan, objek dinamis, dan lampu berbayang sebelum menambah detail.

## Validasi kamera dan aset berikutnya

Director menguji massa warna, siluet, komposisi dua lantai, zoom/orbit, serta fokus ruangan. Avatar menguji wajah, skala furnitur, ruang navigasi, dan gerak dari dekat. Keduanya memakai aset yang sama. Studio menyediakan satu karakter/lineup, pose, ekspresi, furnitur kerja, dan Miniature/Third person/Face detail.

Aset berikutnya harus mempertahankan proporsi, arah +Z, acuan kursi, profil warna, serta bahasa bahan. Uji depan/sisi/belakang pada dua jarak; jangan hanya mengandalkan warna untuk identitas. Periksa transisi, benturan tubuh/prop, serta biaya renderer. Nama resmi digunakan di UI, signage, aset, komentar baru, dan dokumentasi. Hasil serta batas pemeriksaan dicatat di [QA.md](QA.md).

IK, skeletal rig, model impor, dan gameplay bisnis baru berada di luar Phase 01. Fondasi proporsi, profil, bahan, serta pose dapat dipertahankan ketika teknologi aset berkembang.
