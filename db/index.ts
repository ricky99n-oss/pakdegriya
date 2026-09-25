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

  if (!currentUrl) {
    currentUrl = "postgresql://postgres:dummy@localhost:5432/dummy";
  }

  if (!cachedDb || cachedUrl !== currentUrl) {
    const client = postgres(currentUrl, { 
      prepare: false,
      ssl: isHyperdrive ? false : "require",
      // PENGAMAN KEDUA: Paksa batal dalam 3 detik agar build tidak pernah hang lagi
      connect_timeout: 3 
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