"use server";

import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

// --- FUNGSI 1: LOGIN (masukAction) ---
export async function masukAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email dan Password wajib diisi." };
  }

  const existingUsers = await db.select().from(users).where(eq(users.email, email));
  if (existingUsers.length === 0) return { error: "Email tidak ditemukan atau password salah." };
  
  const user = existingUsers[0];
  if (!user.passwordHash) return { error: "Email tidak valid." };
  
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return { error: "Email tidak ditemukan atau password salah." };

  // Gunakan Web API crypto bawaan agar aman untuk Edge Runtime
  const sessionId = crypto.randomUUID(); 
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); 

  await db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt });

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

// --- FUNGSI 2: LOGOUT (keluarAction) ---
export async function keluarAction() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    cookieStore.delete("auth_session");
  }

  return redirect("/auth/masuk");
}

// --- FUNGSI 3: DAFTAR MEMBER (daftarMemberAction) ---
export async function daftarMemberAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "Semua data wajib diisi" };

  const existingUsers = await db.select().from(users).where(eq(users.email, email));
  if (existingUsers.length > 0) return { error: "Email sudah terdaftar!" };

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId, 
      email, 
      name, 
      passwordHash, 
      role: "member" as any, 
    });
    
    return redirect("/auth/masuk");
  } catch (error: any) {
    return { error: "Terjadi kesalahan sistem saat mendaftar" };
  }
}