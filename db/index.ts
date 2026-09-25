import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

let cachedDb: ReturnType<typeof drizzle> | null = null;
let cachedUrl: string = "";

const getDbInstance = () => {
  let currentUrl = process.env.DATABASE_URL || "";
  let isHyperdrive = false; // <-- Detektor rute jaringan

  try {
    const env = getRequestContext().env as Record<string, any>;
    
    // Prioritas 1: Hyperdrive (Tanpa SSL tambahan)
    if (env?.HYPERDRIVE?.connectionString) {
      currentUrl = env.HYPERDRIVE.connectionString;
      isHyperdrive = true; // Tandai bahwa kita melewati Hyperdrive
    } 
    // Prioritas 2: Fallback ke URL langsung (Wajib SSL)
    else if (env?.DATABASE_URL) {
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
      // Logika Cerdas: 
      // Cloudflare Hyperdrive menolak SSL ganda. Supabase Direct mewajibkan SSL.
      ssl: isHyperdrive ? false : "require" 
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