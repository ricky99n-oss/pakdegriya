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
    const env = getRequestContext().env as Record<string, any>;
    if (env?.HYPERDRIVE?.connectionString) {
      currentUrl = env.HYPERDRIVE.connectionString;
      isHyperdrive = true;
    } else if (env?.DATABASE_URL) {
      currentUrl = env.DATABASE_URL;
    }
  } catch (error) {
    // Diabaikan saat proses kompilasi
  }

  const isBuildPhase = !currentUrl;
  if (isBuildPhase) {
    currentUrl = "postgresql://postgres:dummy@localhost:5432/dummy";
  }

  if (!cachedDb || cachedUrl !== currentUrl) {
    const client = postgres(currentUrl, { 
      prepare: false,
      ssl: isHyperdrive ? false : "require",
      // MENCEGAH HANG: Paksa gagal dalam 2 detik jika ini adalah proses build
      connect_timeout: isBuildPhase ? 2 : 10,
      idle_timeout: isBuildPhase ? 2 : 10,
      max: 1 // Batasi koneksi dummy
    });
    cachedDb = drizzle(client, { schema });
    cachedUrl = currentUrl;
  }

  return cachedDb;
};

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const instance = getDbInstance();
    return (instance as any)[prop];
  },
});