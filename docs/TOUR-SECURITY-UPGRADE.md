# Pakde Griya — Tour Ordering & Security Upgrade

## 1. Wajib sebelum deploy: migration Supabase

Jalankan isi `db/migrations/20260926_scene_sort_order.sql` di Supabase SQL Editor.

Kolom `scenes.sort_order` dipakai untuk menentukan urutan panorama. Urutan `0` / nomor 1 menjadi scene pertama dan tombol next / previous mengikuti urutan tersebut.

## 2. Cloudflare Turnstile

Buat widget Turnstile untuk domain Pakde Griya, lalu tambahkan variable / secret di deployment Cloudflare:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = Site Key
- `TURNSTILE_SECRET_KEY` = Secret Key (secret; jangan commit ke GitHub)

Login email, Google OAuth, dan pendaftaran member sudah melewati verifikasi server-side Siteverify ketika secret tersedia.

Jika kedua key belum dipasang, aplikasi sengaja tetap bisa login agar deployment tidak terkunci. Setelah secret dipasang, token Turnstile menjadi wajib.

## 3. Security tambahan yang sudah diterapkan

- Admin mutations mengecek role `admin` / `superadmin` di server action, bukan hanya menyembunyikan UI.
- Media panorama / audio / media private membutuhkan sesi login pada API media.
- Upload media memvalidasi kategori, MIME type, jumlah file, dan ukuran maksimum.
- CSP mengizinkan Turnstile hanya melalui `https://challenges.cloudflare.com` serta menolak object/embed.
- HSTS, nosniff, referrer policy, permissions policy, frame protection tetap aktif.
- CRUD admin menampilkan loading serta feedback berhasil / gagal dan melakukan catch error.

## 4. Cloudflare dashboard (disarankan)

Selain kode, aktifkan proteksi gratis yang tersedia pada plan Cloudflare untuk zone `pakdegriya.com`, seperti HTTPS/SSL yang benar dan proteksi bot pada dashboard Security jika tersedia pada akun.

Jangan membuat Managed Challenge pada semua halaman normal karena dapat mengganggu calon pembeli dan crawler. Pakai challenge agresif hanya untuk trafik mencurigakan / endpoint sensitif.

## 5. Setelah merge

```powershell
git checkout main
git pull --rebase origin main
npm run build
```

Lalu deploy / tunggu Cloudflare melakukan deployment baru.
