import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Gunakan fallback 'dummy' jika DATABASE_URL tidak ditemukan saat proses build
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:dummy@localhost:5432/dummy";

// Membuka koneksi ke Supabase PostgreSQL
// Opsi prepare: false diwajibkan oleh Supabase saat menggunakan PgBouncer / Connection Pooler
const client = postgres(connectionString, { prepare: false });

// Ekspor instance db agar bisa dipakai di seluruh proyek
export const db = drizzle(client, { schema });