"use server";
import { db } from "../../db";
import { users } from "../../db/schema";
import { lucia } from "../../lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function createSuperadmin(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Enkripsi password sebelum disimpan (wajib)
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  // Simpan data ke database
  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    role: "superadmin",
  });

  // Buat session dan tanamkan cookie login ke browser pengguna
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  // Arahkan ke dashboard admin
  redirect("/admin/dashboard");
}