# Hot Item, Nego, format harga, dan ajakan member

## Aktivasi database

Jalankan `db/migrations/20261002_property_hot_item_negotiable.sql` di Supabase SQL Editor, lalu deploy kode terbaru dari `main`.
Migration ini menambahkan dua boolean dengan default `false` dan index untuk listing publik. Tidak mengubah harga, status publikasi, atau penanda properti yang sudah ada saat migration diulang.

Jika kode terdeploy sebelum migration, beranda tetap menampilkan listing lama tanpa penanda. Penyimpanan Hot Item/Nego akan memberikan pesan aktivasi database dan tidak melaporkan keberhasilan palsu.

## Pemakaian

- Admin → Kelola Properti → Edit: pilih Hot Item / Bisa nego, lalu Simpan Perubahan. Opsi yang sama tersedia saat menambah properti.
- Hot Item yang sudah diterbitkan diurutkan pertama sebelum batas enam listing diterapkan. Jika ada beberapa, `updated_at` terbaru lebih dahulu; ID menjadi penentu urutan jika waktunya sama.
- Harga ditampilkan dengan titik ribuan saat diketik. Payload tetap berupa digit tanpa titik.
- Pengunjung beranda yang belum login melihat ajakan daftar member. Tombol tutup, Escape, dan “Lihat listing dulu” menutup pop-up untuk sesi tab tersebut. Pengguna yang sudah login tidak mendapat pop-up.

## Verifikasi

Tes mencakup simpan/create melalui API dengan pemeriksaan admin, nilai true/false, data lama yang tidak mengirim flag, fallback schema lama, urutan sebelum limit, payload harga, label kartu, dan pop-up.
Database produksi tidak diakses oleh pengujian lokal.
