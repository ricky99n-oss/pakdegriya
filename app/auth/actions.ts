"use server";

import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email dan Password wajib diisi." };
  }

  // 1. Cari user berdasarkan email
  const existingUsers = await db.select().from(users).where(eq(users.email, email));
  if (existingUsers.length === 0) {
    return { error: "Email tidak ditemukan atau password salah." };
  }
  const user = existingUsers[0];

  // 2. Verifikasi Password
  if (!user.passwordHash) {
    return { error: "Email tidak valid." };
  }
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return { error: "Email tidak ditemukan atau password salah." };
  }

  // 3. BUAT SESI MANUAL (Menggantikan Lucia)
  // Gunakan randomUUID dari crypto jika menggunakan Node.js (untuk Edge, gunakan global crypto)
  const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (globalThis as any).crypto.randomUUID();
  
  // Set expired 1 hari dari sekarang
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); 

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  });

  // 4. Set Cookie di Browser
  const cookieStore = await cookies();
  cookieStore.set("auth_session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });

  return redirect("/admin/dashboard");
}

export async function keluarAction() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    cookieStore.delete("auth_session");
  }

  return redirect("/auth/masuk"); // Sesuaikan dengan route login Anda
}