import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Membuat connection pool ke database
const poolConnection = mysql.createPool(process.env.DATABASE_URL as string);

// Ekspor instance db agar bisa dipakai di seluruh proyek
export const db = drizzle(poolConnection, { schema, mode: "default" });