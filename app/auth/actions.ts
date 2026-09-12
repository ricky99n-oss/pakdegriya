"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { lucia, validateRequest } from "@/lib/auth"; // Sesuai setup Lucia Anda
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function daftarMemberAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Cek apakah email sudah dipakai
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  if (existingUser.length > 0) {
    redirect("/auth/daftar?error=email_terpakai");
  }

  // Enkripsi password & buat ID
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  // Masukkan ke database dengan peran default "member"
  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    role: "member",
  });

  // Langsung buat sesi (Otomatis Login)
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  // Arahkan kembali ke beranda
  redirect("/");
}

export async function masukAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const userRecord = await db.select().from(users).where(eq(users.email, email));
  if (userRecord.length === 0) {
    redirect("/auth/masuk?error=tidak_ditemukan");
  }
  
  const user = userRecord[0];
  
  // Cocokkan password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash!);
  if (!isValidPassword) {
    redirect("/auth/masuk?error=password_salah");
  }

  // Buat Sesi Login
  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  // Jika admin arahkan ke dashboard admin, jika member arahkan ke beranda
  if (user.role === "superadmin" || user.role === "admin") {
    redirect("/admin/dashboard");
  } else {
    redirect("/");
  }
}

export async function keluarAction() {
  const { session } = await validateRequest();
  if (!session) redirect("/");
  
  await lucia.invalidateSession(session.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  
  redirect("/");
}