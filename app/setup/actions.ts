"use server";

import { db } from "../../db";
import { users, sessions } from "../../db/schema";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function createSuperadmin(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Semua data wajib diisi" };
  }

  // Cek apakah tabel users masih kosong
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    return { error: "Super Admin sudah terdaftar! Setup ini tidak dapat digunakan lagi." };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (globalThis as any).crypto.randomUUID();

    // Buat User Superadmin
    await db.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
      role: "superadmin" as any, 
    });

    // BIKIN SESI MANUAL
    const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (globalThis as any).crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 Hari
    
    await db.insert(sessions).values({
      id: sessionId,
      userId: userId,
      expiresAt,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt
    });

    return { success: true };
    
  } catch (error: any) {
    console.error("Gagal Setup:", error);
    return { error: "Terjadi kesalahan sistem saat membuat akun Super Admin" };
  }
}