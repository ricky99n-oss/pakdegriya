# Pakde Griya — Viewer, Media, dan Auth Upgrade

Branch: `feature/viewer-media-auth-polish`

## 1. Wajib: jalankan migration Supabase

Jalankan file berikut di Supabase SQL Editor sebelum branch ini di-merge ke production:

`db/migrations/20260926_member_phone_media_visibility.sql`

Migration menambahkan:

- `users.phone`
- `property_media.is_public`
- `property_media.preview_file_name`
- index visibility media dan phone

Cover dan Little Planet lama otomatis dibackfill sebagai publik. Media lain tetap privat sampai admin mengubahnya.

## 2. Wajib: Google Identity Services

Flow Google baru tidak lagi memulai OAuth melalui URL project `*.supabase.co`. Tombol Google dirender langsung di `pakdegriya.com`, lalu ID token diverifikasi oleh Supabase menggunakan `signInWithIdToken`.

### Google Cloud Console

Gunakan OAuth 2.0 Web Client ID yang sama dengan provider Google di Supabase.

Tambahkan Authorized JavaScript origins:

- `https://pakdegriya.com`
- `https://www.pakdegriya.com`

Di OAuth consent / Branding, gunakan nama aplikasi **Pakde Griya**, homepage `https://pakdegriya.com`, dan domain resmi `pakdegriya.com`.

Redirect URI Supabase yang lama boleh tetap dipertahankan sebagai fallback, tetapi flow utama GIS tidak mengirim user ke host Supabase.

### Cloudflare Pages environment

Tambahkan:

```text
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Google Web Client ID>
```

`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` tetap digunakan server / Supabase Auth, tetapi tidak lagi menjadi hostname account chooser Google pada flow utama.

## 3. Nomor telepon member

Member Google yang belum memiliki nomor telepon akan mendapat modal wajib:

**Lengkapi Nomor Telepon Anda**

Virtual Tour juga melakukan pengecekan server-side. Member tanpa nomor telepon akan diarahkan ke `/auth/lengkapi-telepon` sebelum masuk ke viewer.

Format nomor disimpan dalam bentuk internasional `+62...`.

## 4. Media publik / privat

Kolom `property_media.is_public` menjadi sumber kebenaran access control.

- `true`: dapat diakses tanpa login
- `false`: `/api/media/[id]` mewajibkan sesi login valid

Admin dapat mengubah status per file dari Media Library.

## 5. Preview panorama

Saat admin mengunggah panorama baru, browser membuat JPEG preview maksimal 2048px terlebih dahulu. Preview disimpan terpisah di R2 sebagai `<uuid>-preview.jpg`.

Endpoint:

```text
/api/media/<id>            -> master
/api/media/<id>?preview=1  -> preview jika tersedia, fallback ke master jika file lama belum punya preview
```

Viewer memakai preview untuk poster awal dan thumbnail galeri ruangan, lalu Pannellum memuat master di belakangnya.

Panorama lama tetap bekerja. Untuk mendapatkan preview ringan pada panorama lama, upload ulang file tersebut atau gunakan pipeline multires di tahap berikutnya.

## 6. Rekomendasi resolusi 360

Untuk equirectangular 2:1:

- Minimum layak: **4096 × 2048**
- Rekomendasi Pakde Griya sekarang: **8192 × 4096**, JPEG quality sekitar 85–90
- Master arsip dari kamera: boleh 10K / 12K seperti **11520 × 5760** atau **12000 × 6000**

Jangan kirim master 10K–12K sebagai satu texture ke semua HP. Untuk skala production, ubah master menjadi Pannellum **multiresolution tile pyramid** dan simpan tile di R2. Dengan multires, viewer mengambil tile level rendah terlebih dahulu lalu tile resolusi lebih tinggi sesuai zoom / arah pandang.

Preview 2048px yang dibuat branch ini adalah tahap pertama: user melihat poster ringan saat master 8K diunduh. Multires adalah tahap berikutnya untuk progressive loading yang benar-benar interaktif.

## 7. Test sebelum merge

```powershell
git fetch origin
git checkout feature/viewer-media-auth-polish
git pull origin feature/viewer-media-auth-polish
npm install
npm run build
```

Lalu test Preview Deployment Cloudflare:

1. Login Google sebagai member baru dan lama.
2. Pastikan account chooser tidak menampilkan hostname Supabase.
3. Pastikan member tanpa phone mendapat modal wajib.
4. Upload panorama baru dan cek thumbnail / preview.
5. Ubah media Publik ⇄ Privat dan tes dari incognito.
6. Drag & drop urutan ruangan.
7. Tes intro Little Planet → klik → panorama pertama.
8. Diamkan viewer ±4 detik dan cek auto-rotate lambat.
9. Tes toolbar desktop dan mobile, termasuk tombol keluar.
10. Tes mobile portrait dan landscape.
