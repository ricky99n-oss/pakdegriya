"use server";

import { db } from "../../db";
import { users } from "../../db/schema";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function createSuperadmin(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Semua data wajib diisi" };
  }

  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    return { error: "Super Admin sudah terdaftar! Setup ini tidak dapat digunakan lagi." };
  }

  try {
    // 1. Buat akun di Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Gagal membuat user di Supabase");

    // 2. Simpan profil di tabel users public
    await db.insert(users).values({
      id: data.user.id,
      email,
      name,
      passwordHash: "supabase_managed",
      role: "superadmin" as any, 
    });

    // 3. Login otomatis setelah setup
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !loginData.session) throw new Error("Gagal login otomatis");

    const cookieStore = await cookies();
    cookieStore.set("supabase_access_token", loginData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: loginData.session.expires_in
    });

    return { success: true };
    
  } catch (error: any) {
    console.error("Gagal Setup:", error);
    return { error: error.message || "Terjadi kesalahan sistem saat membuat akun Super Admin" };
  }
}