"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

// --- FUNGSI 1: LOGIN EMAIL (SUPABASE AUTH) ---
export async function masukAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email dan Password wajib diisi." };

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return { error: "Email tidak ditemukan atau password salah." };
  }

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
  const supabase = getSupabase();
  await supabase.auth.signOut();
  
  return redirect("/auth/masuk");
}

// --- FUNGSI 3: DAFTAR MEMBER (SUPABASE AUTH) ---
export async function daftarMemberAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "Semua data wajib diisi" };

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        // Penting: Disisipkan agar SQL Trigger bisa membaca nama user baru
        full_name: name, 
      }
    }
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already exists")) {
      return { error: "Email sudah terdaftar!" };
    }
    return { error: `Gagal mendaftar: ${error.message}` };
  }

  // Catatan: Insert ke tabel public.users sudah diurus otomatis oleh SQL Trigger

  return redirect("/auth/masuk");
}

// --- FUNGSI 4: PENYIMPAN COOKIE (DIPANGGIL OLEH CALLBACK) ---
export async function setSessionCookieAction(accessToken: string, expiresIn: number) {
  const cookieStore = await cookies();
  cookieStore.set("supabase_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn
  });
}