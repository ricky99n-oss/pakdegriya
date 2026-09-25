import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

let cachedDb: ReturnType<typeof drizzle> | null = null;
let cachedUrl: string = "";

const getDbInstance = () => {
  let currentUrl = process.env.DATABASE_URL || "";

  try {
    const env = getRequestContext().env as any;
    // Prioritas 1: Hyperdrive
    if (env?.HYPERDRIVE?.connectionString) {
      currentUrl = env.HYPERDRIVE.connectionString;
    } 
    // Prioritas 2: Fallback ke variabel environment
    else if (env?.DATABASE_URL) {
      currentUrl = env.DATABASE_URL;
    }
  } catch (error) {
    // Diabaikan saat proses 'next build'
  }

  // Fallback terakhir agar build tidak crash
  if (!currentUrl) {
    currentUrl = "postgresql://postgres:dummy@localhost:5432/dummy";
  }

  // Hanya buat koneksi baru jika URL berubah atau cache kosong
  if (!cachedDb || cachedUrl !== currentUrl) {
    // prepare: false wajib untuk Hyperdrive & Supabase
    const client = postgres(currentUrl, { prepare: false });
    cachedDb = drizzle(client, { schema });
    cachedUrl = currentUrl;
  }

  return cachedDb;
};

// Ekspor Proxy agar db bisa dipanggil normal di seluruh komponen
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const instance = getDbInstance();
    return (instance as any)[prop];
  },
});