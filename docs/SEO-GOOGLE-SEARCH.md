# SEO dan Google Search — Pakde Griya

## Yang dipasang

- Metadata judul, deskripsi, canonical, Open Graph, dan Twitter untuk beranda, setiap properti, katalog, kategori, dan halaman informasi.
- Katalog `/properti` dengan pagination 12 listing; kategori `/properti/kategori/rumah`, `/tanah`, `/ruko`, `/villa`, `/apartemen` (semua di bawah `/properti/kategori/`). Semua konten listing tetap dirender server dan bisa diakses tanpa login.
- Sitemap dinamis `https://pakdegriya.com/sitemap.xml`: halaman informasi, semua listing published, serta kategori yang mempunyai listing. Pembacaan bertahap menghindari batas baris default Supabase. Nilai lastModified berasal dari data aktual, bukan waktu setiap request.
- `https://pakdegriya.com/robots.txt` mengumumkan sitemap. Media publik tetap bisa dirayapi. Halaman akun/admin/profile memiliki noindex; tur member tidak dimasukkan ke sitemap. Draft dan arsip tidak dilayani pada URL detail publik.
- JSON-LD WebSite, RealEstateAgent, RealEstateListing, CollectionPage/ItemList, dan BreadcrumbList menggunakan data yang tampil di website; tanpa rating atau ulasan buatan.
- Kategori kosong diberi noindex. Setiap halaman pagination mempunyai canonical sendiri; URL halaman yang tidak valid menghasilkan notFound.

Tidak diperlukan perubahan tabel database untuk SEO ini. Migration Hot Item/Nego dari revisi sebelumnya tetap terpisah; katalog mendukung schema lama.

## Aktivasi di Google Search Console (pemilik domain)

1. Pastikan deployment kode terbaru berhasil di hosting.
2. Buka https://search.google.com/search-console menggunakan akun Google pengelola.
3. Add property → Domain → `pakdegriya.com`.
4. Salin record TXT `google-site-verification=...` dari Google, tambahkan ke DNS Cloudflare domain ini dengan name `@`, kemudian klik Verify. Jangan menghapus record verifikasi yang sudah ada.
5. Menu Sitemaps → Add a new sitemap → `https://pakdegriya.com/sitemap.xml` → Submit.
6. Gunakan URL Inspection untuk beranda dan beberapa listing utama; jalankan Test Live URL dan Request Indexing jika tersedia.
7. Pantau Pages/Indexing, Performance, dan Crawl Stats. Google menentukan apakah serta kapan URL diindeks; tidak ada jaminan posisi untuk kata kunci.

Alternatif URL-prefix property: pilih `https://pakdegriya.com/`, gunakan metode HTML tag, masukkan nilai content token Google (bukan seluruh tag) ke environment build `GOOGLE_SITE_VERIFICATION`, lalu rebuild/deploy dan Verify. DNS verification tidak memerlukan perubahan kode/build.

## Pemeriksaan setelah deploy

### Build Cloudflare Pages

`npm run build` memakai `next build --webpack`. Pertahankan flag ini selama memakai `@cloudflare/next-on-pages`: adapter tersebut mengekstrak chunk Webpack bersama agar kode framework tidak terduplikasi di setiap route. Build Turbopack pada commit SEO menghasilkan bundle Pages Functions 29.419.313 byte dan ditolak karena melewati batas 25 MiB, walaupun tahap kompilasi Next.js berhasil.

Perintah build di Cloudflare tetap `npx @cloudflare/next-on-pages@1`, dengan output `.vercel/output/static`. Sebelum deployment, jalankan perintah yang sama secara lokal dan periksa ukuran worker; keberhasilan `next build` saja belum memastikan bundle dapat diunggah. Setelah push, pastikan status deployment Cloudflare sukses sebelum mengirim ulang sitemap di Search Console.

Sesudah `next build --webpack` berhasil, script `cleanup-next-export.mjs` membersihkan metadata sementara `export-detail.json` yang tertinggal pada build server Next 16.3. Tanpa pembersihan ini builder dapat salah menganggap aplikasi SSR sebagai static export yang gagal. Script hanya berjalan setelah build sukses, memeriksa manifest serta BUILD_ID, dan mempertahankan metadata bila konfigurasi benar-benar memakai `output: export`.

### URL publik

- `/robots.txt`: HTTP 200, baris Sitemap mengarah ke domain HTTPS di atas. Cloudflare dapat menambahkan komentar content signals; pastikan directives aplikasi tetap tersedia.
- `/sitemap.xml`: HTTP 200 dengan XML yang dapat dibaca; tidak mengandung URL admin/auth/profil/tour/draft. Saat database tidak tersedia, endpoint gagal, bukan memberi sitemap parsial yang seolah berhasil.
- View Source satu listing: title/deskripsi berbeda, canonical URL benar, JSON-LD sesuai harga dan alamat umum; cover untuk metadata harus berstatus publik.
- Uji satu draft di URL publik: tidak tampil sebagai listing published. Uji category/pagination dan navigasi antarhalaman.
- Periksa Cloudflare WAF/Bot settings hanya bila URL Inspection Google melaporkan akses ditolak. Jangan menonaktifkan proteksi situs secara menyeluruh.

## Pengelolaan konten

Gunakan judul natural berdasarkan data: jenis properti + lokasi + keunggulan nyata, misalnya “Tanah Kavling di Bumiaji Batu”. Lengkapi deskripsi, luas, harga, foto, dan fasilitas yang benar-benar tersedia. Harga sewa harus sesuai periode bulan/tahun. Prioritaskan variasi lokal yang relevan seperti rumah dijual Batu, tanah Bumiaji, ruko Batu, dan properti Malang Raya; hindari pengulangan kata kunci atau halaman lokasi kosong.

Pop-up member sebelumnya tetap dipertahankan sesuai permintaan. Evaluasi kenyamanan pengguna mobile; Google menyarankan ajakan yang tidak menghalangi konten utama. Jangan membedakan tampilan pengguna dan Googlebot.

Referensi: https://developers.google.com/search/docs/fundamentals/seo-starter-guide ; https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap ; https://developers.google.com/search/docs/monitor-debug/search-console-start ; https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials
