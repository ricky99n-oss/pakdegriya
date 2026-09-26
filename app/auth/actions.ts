"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSupabase } from "@/lib/supabase";
import { verifyTurnstileToken } from "@/lib/turnstile";

function normalizeRequestedNext(value: FormDataEntryValue | string | null | undefined) {
  const next = String(value || "").trim();
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;

  if (!/^62\d{8,13}$/.test(digits)) return null;
  return `+${digits}`;
}

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
};

async function ensureUserProfile(authUser: AuthUser) {
  const email = String(authUser.email || "").trim().toLowerCase();
  if (!email) throw new Error("Email akun Google tidak tersedia.");

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) {
    const current = existing[0];
    const googleName = String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || "").trim();
    if (!current.name && googleName) {
      await db.update(users).set({ name: googleName }).where(eq(users.email, email));
      return { ...current, name: googleName };
    }
    return current;
  }

  const name = String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || "Member").trim() || "Member";
  await db.insert(users).values({
    id: authUser.id,
    email,
    name,
    passwordHash: "supabase_managed",
    role: "member" as any,
  }).onConflictDoNothing();

  const inserted = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!inserted.length) throw new Error("Profil member gagal dibuat.");
  return inserted[0];
}

function destinationForRole(roleValue: string, requestedNext?: string | null) {
  const role = String(roleValue || "member").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";
  const requested = normalizeRequestedNext(requestedNext);
  if (requested) {
    if (requested.startsWith("/admin") && !isAdmin) return "/";
    return requested;
  }
  return isAdmin ? "/admin/dashboard" : "/";
}

async function authContextFromToken(accessToken: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) throw new Error("Sesi login tidak valid. Silakan masuk kembali.");
  const profile = await ensureUserProfile(data.user as AuthUser);
  return { authUser: data.user, profile };
}

async function saveSessionCookie(accessToken: string, expiresIn: number) {
  const cookieStore = await cookies();
  cookieStore.set("supabase_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, Number(expiresIn) || 3600),
  });
}

export async function verifyHumanAction(token: string) {
  return verifyTurnstileToken(token);
}

// Pada browser mobile kita memakai Google redirect UX (bukan popup) agar tidak
// terjebak layar putih accounts.google.com. Turnstile diverifikasi SEBELUM user
// masuk ke Google, lalu hasil verifikasi disimpan sebentar di cookie HttpOnly.
export async function prepareGoogleRedirectAction(token: string) {
  const verification = await verifyTurnstileToken(token);
  if (!verification.success) {
    return { success: false, error: verification.error || "Verifikasi keamanan gagal." };
  }

  const cookieStore = await cookies();
  cookieStore.set("google_turnstile_ok", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Redirect Google kembali lewat cross-site POST, jadi cookie harus bisa ikut.
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/auth/google-redirect",
    maxAge: 180,
  });

  return { success: true };
}

export async function masukAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const turnstileToken = String(formData.get("cf-turnstile-response") || "");
  const requestedNext = normalizeRequestedNext(formData.get("next"));

  if (!email || !password) return { error: "Email dan Password wajib diisi." };
  const verification = await verifyTurnstileToken(turnstileToken);
  if (!verification.success) return { error: verification.error || "Verifikasi keamanan gagal." };

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return { error: "Email tidak ditemukan atau password salah." };

  let destination: string;
  try {
    const { profile } = await authContextFromToken(data.session.access_token);
    destination = destinationForRole(String(profile.role), requestedNext);
    await saveSessionCookie(data.session.access_token, data.session.expires_in);
  } catch (error) {
    console.error("Gagal menyelesaikan login email:", error);
    return { error: error instanceof Error ? error.message : "Gagal membuat sesi login." };
  }

  redirect(destination);
}

export async function googleIdTokenLoginAction(
  idToken: string,
  turnstileToken: string,
  requestedNext?: string | null
) {
  try {
    if (!idToken) return { success: false, error: "Token Google tidak tersedia." };

    const verification = await verifyTurnstileToken(turnstileToken);
    if (!verification.success) {
      return { success: false, error: verification.error || "Verifikasi keamanan gagal." };
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error || !data.session || !data.user) {
      console.error("signInWithIdToken gagal:", error);
      return { success: false, error: "Akun Google gagal diverifikasi. Silakan coba lagi." };
    }

    const profile = await ensureUserProfile(data.user as AuthUser);
    const destination = destinationForRole(String(profile.role), requestedNext);
    await saveSessionCookie(data.session.access_token, data.session.expires_in);

    const role = String(profile.role || "member").toLowerCase();
    const isAdmin = role === "admin" || role === "superadmin";
    return {
      success: true,
      redirectTo: destination,
      requiresPhone: !isAdmin && !String(profile.phone || "").trim(),
      userName: profile.name || data.user.user_metadata?.full_name || "Member",
    };
  } catch (error) {
    console.error("Google ID token login gagal:", error);
    return { success: false, error: error instanceof Error ? error.message : "Login Google gagal." };
  }
}

export async function completeOAuthLoginAction(
  accessToken: string,
  expiresIn: number,
  requestedNext?: string | null
) {
  try {
    const { authUser, profile } = await authContextFromToken(accessToken);
    const destination = destinationForRole(String(profile.role), requestedNext);
    await saveSessionCookie(accessToken, expiresIn);
    const role = String(profile.role || "member").toLowerCase();
    const isAdmin = role === "admin" || role === "superadmin";

    return {
      success: true,
      redirectTo: destination,
      requiresPhone: !isAdmin && !String(profile.phone || "").trim(),
      userName: profile.name || authUser.user_metadata?.full_name || "Member",
    };
  } catch (error) {
    console.error("Gagal menyelesaikan login OAuth:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal membuat sesi login Google." };
  }
}

export async function saveMemberPhoneAction(rawPhone: string) {
  try {
    const phone = normalizePhone(rawPhone);
    if (!phone) return { success: false, error: "Nomor telepon tidak valid. Gunakan nomor Indonesia aktif, misalnya 0812..." };

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;
    if (!accessToken) return { success: false, error: "Sesi login sudah berakhir. Silakan login kembali." };

    const { authUser } = await authContextFromToken(accessToken);
    const email = String(authUser.email || "").trim().toLowerCase();
    if (!email) return { success: false, error: "Email akun tidak ditemukan." };

    await db.update(users).set({ phone }).where(eq(users.email, email));
    return { success: true, phone };
  } catch (error) {
    console.error("saveMemberPhoneAction:", error);
    return { success: false, error: error instanceof Error ? error.message : "Nomor telepon gagal disimpan." };
  }
}

export async function keluarAction() {
  const cookieStore = await cookies();
  cookieStore.delete("supabase_access_token");
  try { await getSupabase().auth.signOut(); } catch (error) { console.error("Logout Supabase gagal:", error); }
  redirect("/auth/masuk");
}

export async function daftarMemberAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const phone = normalizePhone(String(formData.get("phone") || ""));
  const turnstileToken = String(formData.get("cf-turnstile-response") || "");

  if (!name || !email || !password || !phone) return { error: "Nama, email, nomor telepon, dan password wajib diisi dengan benar." };
  if (password.length < 8) return { error: "Password minimal 8 karakter." };

  const verification = await verifyTurnstileToken(turnstileToken);
  if (!verification.success) return { error: verification.error || "Verifikasi keamanan gagal." };

  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: name, phone } },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already exists")) return { error: "Email sudah terdaftar!" };
    return { error: `Gagal mendaftar: ${error.message}` };
  }

  if (data.user) {
    await db.insert(users).values({
      id: data.user.id,
      email,
      name,
      phone,
      passwordHash: "supabase_managed",
      role: "member" as any,
    }).onConflictDoNothing();
  }

  return { success: true };
}

export async function setSessionCookieAction(accessToken: string, expiresIn: number) {
  await saveSessionCookie(accessToken, expiresIn);
}
