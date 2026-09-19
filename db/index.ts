import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Gunakan fallback 'dummy' jika DATABASE_URL tidak ditemukan saat proses build di GitHub Actions
const connectionString = process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/dummy_db";

// Membuat connection pool ke database
const poolConnection = mysql.createPool(connectionString);

// Ekspor instance db agar bisa dipakai di seluruh proyek
export const db = drizzle(poolConnection, { schema, mode: "default" });