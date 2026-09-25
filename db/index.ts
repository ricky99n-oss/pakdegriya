import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

let cachedDb: ReturnType<typeof drizzle> | null = null;
let cachedUrl: string = "";
let globalPool: Pool | null = null;

const getDbInstance = () => {
  let currentUrl = process.env.DATABASE_URL || "";

  try {
    const env = getRequestContext().env as any;
    // Menggunakan koneksi dari Hyperdrive
    if (env?.HYPERDRIVE?.connectionString) {
      currentUrl = env.HYPERDRIVE.connectionString;
    } 
    else if (env?.DATABASE_URL) {
      currentUrl = env.DATABASE_URL;
    }
  } catch (error) {
    // Abaikan error saat proses 'next build' berlangsung
  }

  if (!currentUrl) {
    currentUrl = "postgresql://postgres:dummy@localhost:5432/dummy";
  }

  if (!cachedDb || cachedUrl !== currentUrl) {
    // Bersihkan pool lama jika URL berubah
    if (globalPool) {
      globalPool.end().catch(() => {});
    }
    // Buat koneksi baru menggunakan pg Pool
    globalPool = new Pool({ connectionString: currentUrl });
    cachedDb = drizzle(globalPool, { schema });
    cachedUrl = currentUrl;
  }

  return cachedDb;
};

// Ekspor Proxy agar db bisa dipanggil dengan normal di seluruh aplikasi
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const instance = getDbInstance();
    return (instance as any)[prop];
  },
});