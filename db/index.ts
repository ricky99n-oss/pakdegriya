import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

let cachedDb: ReturnType<typeof drizzle> | null = null;

const getDbInstance = () => {
  // Gunakan instance yang sudah ada untuk mencegah kebocoran koneksi (connection leak)
  if (cachedDb) return cachedDb;

  // Fallback default untuk proses build (Next.js build time)
  let connectionString = process.env.DATABASE_URL || "postgresql://postgres:dummy@localhost:5432/dummy";

  try {
    // Mencoba mengambil URL dari binding Hyperdrive Cloudflare
    const env = getRequestContext().env as any;
    if (env?.HYPERDRIVE?.connectionString) {
      connectionString = env.HYPERDRIVE.connectionString;
    }
  } catch (error) {
    // Akan diabaikan saat proses build karena tidak ada request context
  }

  // Opsi prepare: false tetap dipertahankan
  const client = postgres(connectionString, { prepare: false });
  cachedDb = drizzle(client, { schema });

  return cachedDb;
};

// Mengekspor Proxy agar `db` tetap bisa dipanggil seperti biasa di seluruh file proyek Anda
// (misalnya: db.select(), db.insert(), dll tanpa perlu memanggilnya sebagai fungsi)
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const instance = getDbInstance();
    return (instance as any)[prop];
  },
});import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

let cachedDb: ReturnType<typeof drizzle> | null = null;

const getDbInstance = () => {
  // Gunakan instance yang sudah ada untuk mencegah kebocoran koneksi (connection leak)
  if (cachedDb) return cachedDb;

  // Fallback default untuk proses build (Next.js build time)
  let connectionString = process.env.DATABASE_URL || "postgresql://postgres:dummy@localhost:5432/dummy";

  try {
    // Mencoba mengambil URL dari binding Hyperdrive Cloudflare
    const env = getRequestContext().env as any;
    if (env?.HYPERDRIVE?.connectionString) {
      connectionString = env.HYPERDRIVE.connectionString;
    }
  } catch (error) {
    // Akan diabaikan saat proses build karena tidak ada request context
  }

  // Opsi prepare: false tetap dipertahankan
  const client = postgres(connectionString, { prepare: false });
  cachedDb = drizzle(client, { schema });

  return cachedDb;
};

// Mengekspor Proxy agar `db` tetap bisa dipanggil seperti biasa di seluruh file proyek Anda
// (misalnya: db.select(), db.insert(), dll tanpa perlu memanggilnya sebagai fungsi)
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const instance = getDbInstance();
    return (instance as any)[prop];
  },
});