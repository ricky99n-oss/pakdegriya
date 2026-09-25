import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

// Simpan instance Drizzle agar tidak membuat koneksi baru setiap kali dipanggil
let cachedDb: ReturnType<typeof drizzle> | null = null;
let cachedUrl: string = "";

const getDbInstance = () => {
  // 1. Ambil dari process.env (Berlaku untuk lokal / npm run dev / npm run db:push)
  let currentUrl = process.env.DATABASE_URL || "";

  try {
    // 2. Ambil dari environment Cloudflare (Hanya tersedia saat berjalan di Edge)
    const env = getRequestContext().env as Record<string, any>;
    
    // Prioritas 1: Gunakan Hyperdrive jika diaktifkan di menu Bindings Cloudflare
    if (env?.HYPERDRIVE?.connectionString) {
      currentUrl = env.HYPERDRIVE.connectionString;
    } 
    // Prioritas 2: Fallback ke variabel teks biasa di Cloudflare Settings
    else if (env?.DATABASE_URL) {
      currentUrl = env.DATABASE_URL;
    }
  } catch (error) {
    // Abaikan error di sini. getRequestContext() memang akan gagal saat proses 'next build' 
    // karena konteks Edge belum tersedia.
  }

  // 3. Fallback dummy mutlak agar proses kompilasi (build) di Cloudflare tidak crash
  if (!currentUrl) {
    currentUrl = "postgresql://postgres:dummy@localhost:5432/dummy";
  }

  // 4. Inisialisasi hanya jika cache kosong atau URL berubah
  if (!cachedDb || cachedUrl !== currentUrl) {
    // WAJIB: prepare: false dan ssl: "require" mutlak dibutuhkan untuk koneksi Edge ke Supabase
    const client = postgres(currentUrl, { 
      prepare: false, 
      ssl: "require" 
    });
    cachedDb = drizzle(client, { schema });
    cachedUrl = currentUrl;
  }

  return cachedDb;
};

// Ekspor menggunakan Proxy:
// Dieksekusi SAAT REQUEST MASUK, bukan saat file ini pertama kali dibaca sistem.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const instance = getDbInstance();
    return (instance as any)[prop];
  },
});