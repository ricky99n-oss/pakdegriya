import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

let cachedDirectDb: ReturnType<typeof drizzle> | null = null;
let cachedDirectUrl = "";

function resolveDatabaseConfig() {
  let url = process.env.DATABASE_URL || "";
  let isHyperdrive = false;

  try {
    const env = getRequestContext().env as Record<string, any>;

    if (env?.HYPERDRIVE?.connectionString) {
      url = env.HYPERDRIVE.connectionString;
      isHyperdrive = true;
    } else if (env?.DATABASE_URL) {
      url = env.DATABASE_URL;
    }
  } catch {
    // getRequestContext() memang tidak tersedia saat build / prerender lokal.
  }

  if (!url) {
    // Hanya fallback build agar import module tidak crash. Query tidak boleh
    // benar-benar dieksekusi ke URL ini pada runtime production.
    url = "postgresql://postgres:dummy@localhost:5432/dummy";
  }

  return { url, isHyperdrive };
}

function createHyperdriveDb(url: string) {
  // Sesuai rekomendasi Cloudflare untuk Postgres.js + Hyperdrive:
  // - buat client baru per request/query path; Hyperdrive yang menangani pooling
  // - jangan override SSL pada connectionString Hyperdrive
  // - max <= 5 karena batas concurrent outbound connection Workers
  // - fetch_types=false menghindari round-trip tambahan yang tidak diperlukan
  const client = postgres(url, {
    max: 5,
    fetch_types: false,
    prepare: true,
  });

  return drizzle(client, { schema });
}

function getDbInstance() {
  const { url, isHyperdrive } = resolveDatabaseConfig();

  if (isHyperdrive) {
    return createHyperdriveDb(url);
  }

  // Fallback direct DATABASE_URL untuk local/dev atau ketika binding Hyperdrive
  // tidak tersedia. Cache hanya jalur direct ini agar tidak membuka koneksi baru
  // berulang kali.
  if (!cachedDirectDb || cachedDirectUrl !== url) {
    const client = postgres(url, {
      prepare: false,
      ssl: "require",
      max: 1,
      connect_timeout: 8,
      idle_timeout: 20,
    });

    cachedDirectDb = drizzle(client, { schema });
    cachedDirectUrl = url;
  }

  return cachedDirectDb;
}

// Lazy Proxy: koneksi baru dibuat hanya ketika query benar-benar dipakai.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const instance = getDbInstance();
    return (instance as any)[prop];
  },
});
