"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { verifyTurnstileToken } from "@/lib/turnstile";

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value || "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/admin/dashboard";
}

export async function verifyHumanAction(token: string) {
  return verifyTurnstileToken(token);
}

export async function masukAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const turnstileToken = String(formData.get("cf-turnstile-response") || "");
  const destination = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Email dan Password wajib diisi." };
  const verification = await verifyTurnstileToken(turnstileToken);
  if (!verification.success) return { error: verification.error || "Verifikasi keamanan gagal." };

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return { error: "Email tidak ditemukan atau password salah." };

  const cookieStore = await cookies();
  cookieStore.set("supabase_access_token", data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.session.expires_in,
  });

  return redirect(destination);
}

export async function keluarAction() {
  const cookieStore = await cookies();
  cookieStore.delete("supabase_access_token");
  try {
    await getSupabase().auth.signOut();
  } catch (error) {
    console.error("Logout Supabase gagal:", error);
  }
  return redirect("/auth/masuk");
}

export async function daftarMemberAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const turnstileToken = String(formData.get("cf-turnstile-response") || "");

  if (!name || !email || !password) return { error: "Semua data wajib diisi" };
  if (password.length < 8) return { error: "Password minimal 8 karakter." };
  const verification = await verifyTurnstileToken(turnstileToken);
  if (!verification.success) return { error: verification.error || "Verifikasi keamanan gagal." };

  const { error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already exists")) return { error: "Email sudah terdaftar!" };
    return { error: `Gagal mendaftar: ${error.message}` };
  }
  return { success: true };
}

export async function setSessionCookieAction(accessToken: string, expiresIn: number) {
  const cookieStore = await cookies();
  cookieStore.set("supabase_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });
}
