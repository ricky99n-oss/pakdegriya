import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

let cachedDb: ReturnType<typeof drizzle> | null = null;

const getDbInstance = () => {
  if (cachedDb) return cachedDb;

  let connectionString = process.env.DATABASE_URL || "postgresql://postgres:dummy@localhost:5432/dummy";

  try {
    const env = getRequestContext().env as any;
    if (env?.HYPERDRIVE?.connectionString) {
      connectionString = env.HYPERDRIVE.connectionString;
    }
  } catch (error) {
    // Diabaikan saat proses build
  }

  const client = postgres(connectionString, { prepare: false });
  cachedDb = drizzle(client, { schema });

  return cachedDb;
};

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const instance = getDbInstance();
    return (instance as any)[prop];
  },
});