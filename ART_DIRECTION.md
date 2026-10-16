# Blue and Space Headquarters — Official Visual Foundation

**Premium Cozy Stylized 3D · Shared visual and character foundation**

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
| Midnight Blue | `#203C52` | Identitas, teks, detail blazer |
| Soft Corporate Blue | `#315770` | Kontrol aktif, pakaian, trim |
| Sky Blue | `#B5CED7` | Sorotan dan motif langit |
| Cloud White | `#E9EFEE` | Latar/permukaan terang |
| Warm Sand | `#D8C29B` | Pantry dan aksen hangat |
| Soft Lavender | `#A9A1B7` | Kreativitas/HRD/pakaian |
| Muted Teal | `#779B97` | Teknik dan status aktif |
| Warm Cream | `#F3EDE1` | Dinding, kain ringan, keramik |
| Warm Wood | `#A17D57` | Furnitur utama |
| Light / Dark Wood | `#C0A37B` / `#705338` | Variasi kayu dan sambungan |

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
| Felin | Bun lembut dengan clasp, blazer lavender | Soft lavender, cream, dusty blue | Hangat, suportif, teliti |
| Yati | Sanggul rapi, apron dengan kantong | Soft blue, warm sand apron | Perhatian, ceria, melayani |
| Deno | Rambut keriting bermassa lembut, polo kerja | Muted teal, midnight trousers | Tekun, santai, membantu |

Founder diwakili avatar pemilik dengan profil penampilan tersendiri. Tiga profil tamu mengikuti keluarga proporsi yang sama. Indeks staf 0–9 tetap stabil; tamu memakai indeks 10–12 dan avatar indeks 13. Jabatan, tempat kerja, dan cerita karakter tetap; nama serta penampilan dapat disesuaikan.

`worldData.ts` mengambil appearance staf dari profil ini. Geometri dibagi antar karakter; satu rig sendi hierarkis prosedural menggerakkan seluruh cast. Belum ada mesh skeletal clips. Ekspresi neutral/happy/focused menggunakan mata, alis, mulut, serta kedipan. Bahasa gerak dan acuan kursi ada di [ANIMATION_PLAN.md](ANIMATION_PLAN.md).

## Penyesuaian karakter di Studio

Studio menyediakan nama, tujuh model rambut, empat bentuk pakaian, tiga bentuk wajah, dua bentuk mata, kacamata, serta warna kulit/rambut/mata/atasan/celana/aksen. Perubahan tampak pada rig yang sama di Studio dan kantor. Tombol **Pulihkan karakter ini** mengembalikan satu profil ke desain resmi; tidak mengubah staf lain.

Nama dibatasi 24 karakter dan ditampilkan sebagai teks React. Penyimpanan terpisah memakai kunci `blue-and-space-character-appearance-v1`, dengan versi serta daftar field yang divalidasi. Data rusak memakai penampilan resmi; field jabatan, ruangan, dan proporsi tidak diterima. Jika penyimpanan perangkat tidak tersedia, tampilan masih berubah untuk sesi berjalan dan Studio memberi pesan yang sesuai. Akun/cloud sync untuk penampilan belum tersedia.

Pakaian dibedakan melalui lapel/bentuk kancing, kerah polo, lengan, dan apron. Warna bebas tetap memakai bahan hangat matte yang sama. Bentuk kepala hanya berubah sedikit; penyunting tidak merusak proporsi miniature human. Material yang dapat diedit dibuat satu kali per identitas dan diwarnai ulang, sehingga drag pemilih warna tidak menumpuk material GPU baru.

## Warm Workspace - 0.9.0

Kayu bertekstur halus, lantai papan berselang, cream stone pada WC/hall, bingkai jendela biru gelap, skyline lembut, tanaman berdaun, dan karya seni lengkung membentuk satu keluarga material. Tekstur dibuat deterministik pada canvas lokal, dibagi melalui cache GPU, dan tidak mengakses layanan AI atau gambar eksternal. Dinding, tangga, dan furnitur statis digabung berdasarkan material; lantai pilihan, pintu, layar, serta karakter tetap dinamis. Lampu gantung mengikuti jadwal daya kantor.

Creator Founder memakai rig dan proporsi yang sama: Pria/Wanita memilih template awal yang dapat diedit. Delapan preset lokal hanya menyimpan penampilan dan nama; jabatan, ruangan, serta cerita Founder tetap. WC mempunyai signage dan pemilihan rute sesuai gender profil.

## Arsitektur dan interior

Volume sederhana, sudut membulat, kayu/cream/biru, serta detail pada area yang dilihat memberi kesan miniatur yang dirancang tangan. Ruangan diperluas dengan skala denah 1,3, sementara furnitur/karakter mempertahankan skala manusia miniatur. Lobby resepsionis dan Open Workspace masing-masing memakai layout dua kali ruangan biasa; counter kayu/signage/tanaman menjaga Amanda jauh dari pintu utama. Sofa lounge berada di ujung resepsionis, terpisah dari jalur layanan.

Meeting Room memiliki enam kursi tim dan satu kursi Founder; Client Meeting Room memakai delapan kursi untuk tamu dan tim terkait. Meja Founder, Manager, HRD, dan IT berada di bagian belakang ruangan dengan pengguna menghadap pintu. Founder Office memakai dua sofa berbentuk L dan meja di tengah. Founder adalah avatar pemilik. Pantry memakai sand/cream; server muted teal; HRD Felin memakai lavender; library kayu/daun; WC keramik cream/trim blue. Gudang dan Ruang OB memuat rak/box persediaan, perlengkapan bersih-bersih, serta sudut istirahat Yati dan Deno.

Kopi/cangkir tidak menjadi hiasan tetap di setiap workstation. Sistem layanan Yati menampilkan minuman setelah pengantaran kepada staf atau tamu; menyiapkan kopi memakai gerak menekan mesin, dan mengambil air minum memakai gelas tersendiri. Deno membawa sapu di samping tubuh ketika berpindah area lalu menurunkannya saat membersihkan. Ini menjaga visual benda tetap berhubungan dengan kegiatan kantor.

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

Director menguji massa warna, siluet, komposisi dua lantai, zoom/orbit, serta fokus ruangan. Avatar menguji wajah, skala furnitur, ruang navigasi, dan gerak dari dekat. Keduanya memakai aset yang sama. Studio menyediakan satu karakter/lineup sepuluh staf, penyunting nama/penampilan, pose, ekspresi, furnitur kerja, dan Miniature/Third person/Face detail.

Aset berikutnya harus mempertahankan proporsi, arah +Z, acuan kursi, profil warna, serta bahasa bahan. Uji depan/sisi/belakang pada dua jarak; jangan hanya mengandalkan warna untuk identitas. Periksa transisi, benturan tubuh/prop, serta biaya renderer. Nama resmi digunakan di UI, signage, aset, komentar baru, dan dokumentasi. Hasil serta batas pemeriksaan dicatat di [QA.md](QA.md).

Kontak prosedural memakai solusi lengan dua ruas dan perhitungan tinggi sol saat duduk/bergerak. Belum ada penguncian langkah berdasarkan jarak dunia, IK untuk setiap anak tangga, skeleton berbobot, atau animasi pemindahan prop dengan constraint fisika. Fondasi proporsi, profil, bahan, serta pose dapat dipertahankan ketika teknologi aset berkembang.
