"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

// --- FUNGSI 1: LOGIN (SUPABASE AUTH) ---
export async function masukAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email dan Password wajib diisi." };

  // Verifikasi ke Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return { error: "Email tidak ditemukan atau password salah." };
  }

  // Simpan Access Token ke Cookie Browser
  const cookieStore = await cookies();
  cookieStore.set("supabase_access_token", data.session.access_token, {
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", 
    path: "/", 
    maxAge: data.session.expires_in
  });

  return redirect("/admin/dashboard");
}

// --- FUNGSI 2: LOGOUT (SUPABASE AUTH) ---
export async function keluarAction() {
  const cookieStore = await cookies();
  cookieStore.delete("supabase_access_token");
  await supabase.auth.signOut();
  
  return redirect("/auth/masuk");
}

// --- FUNGSI 3: DAFTAR MEMBER (SUPABASE AUTH) ---
export async function daftarMemberAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "Semua data wajib diisi" };

  // 1. Buat akun di sistem keamanan Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already exists")) {
      return { error: "Email sudah terdaftar!" };
    }
    return { error: `Gagal mendaftar: ${error.message}` };
  }

  // 2. Daftarkan juga profilnya ke tabel database kita agar web berjalan normal
  if (data.user) {
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length === 0) {
      await db.insert(users).values({
        id: data.user.id, // Gunakan ID asli dari Supabase
        email, 
        name, 
        passwordHash: "supabase_managed", // Password dikelola Supabase, ini hanya formalitas tabel
        role: "member" as any, 
      });
    }
  }

  return redirect("/auth/masuk");
}
// --- FUNGSI 4: LOGIN / DAFTAR DENGAN GOOGLE ---
export async function loginWithGoogleAction(origin: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  // Next.js tidak mengizinkan redirect di dalam try/catch, 
  // jadi kita kembalikan URL-nya untuk dieksekusi oleh Client
  if (data.url) {
    return { url: data.url };
  }
  
  return { error: "Gagal menginisiasi layanan Google" };
}