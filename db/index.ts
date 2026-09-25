import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

let cachedDb: ReturnType<typeof drizzle> | null = null;
let cachedUrl: string = "";

const getDbInstance = () => {
  let currentUrl = process.env.DATABASE_URL || "";
  let isHyperdrive = false;

  try {
    // Mengambil environment variables dari Cloudflare Pages context
    const env = getRequestContext().env as Record<string, any>;
    
    // Prioritaskan Hyperdrive jika binding-nya tersedia
    if (env?.HYPERDRIVE?.connectionString) {
      currentUrl = env.HYPERDRIVE.connectionString;
      isHyperdrive = true;
    } else if (env?.DATABASE_URL) {
      currentUrl = env.DATABASE_URL;
    }
  } catch (error) {
    // Abaikan error saat proses build/prerender Next.js karena getRequestContext() belum tersedia
  }

  // Fallback untuk mencegah crash akibat string kosong saat Next.js melakukan static generation
  if (!currentUrl) {
    currentUrl = "postgresql://postgres:dummy@localhost:5432/dummy";
  }

  // Cegah inisiasi ulang koneksi jika URL tidak berubah (berguna untuk cache di Edge/Isolates)
  if (!cachedDb || cachedUrl !== currentUrl) {
    const client = postgres(currentUrl, {
      prepare: false, // Wajib false untuk koneksi serverless/pgbouncer/Hyperdrive
      
      // Hyperdrive sudah melakukan enkripsi tunneling secara internal, jadi SSL harus false.
      // Jika fallback ke direct connection, amankan dengan SSL.
      ssl: isHyperdrive ? false : "require", 
      
      // Batasi maksimal koneksi serentak.
      // Hyperdrive memiliki connection pooling sendiri, jadi aman di-set lebih dari 1.
      // Tanpa Hyperdrive (Edge langsung ke DB), set ke 1 agar tidak menguras batas koneksi database.
      max: isHyperdrive ? 10 : 1, 
      
      // Timeout agresif untuk mencegah proses build/request hang
      connect_timeout: 3,
      idle_timeout: 3, 
    });
    
    cachedDb = drizzle(client, { schema });
    cachedUrl = currentUrl;
  }

  return cachedDb;
};

// Ekspor instance menggunakan Proxy agar evaluasi hanya terjadi ketika query benar-benar dieksekusi.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const instance = getDbInstance();
    return (instance as any)[prop];
  },
});