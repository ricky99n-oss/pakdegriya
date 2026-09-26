"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabase, updateAuthUserWithAccessToken } from "@/lib/supabase";
import {
  createMemberProfile,
  ensureUserProfile,
  updateUserPhone,
  type AuthUserLike,
} from "@/lib/user-profile";
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

function logServerError(label: string, error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? (error as { cause?: any }).cause : undefined;
  console.error(label, {
    message: error instanceof Error ? error.message : String(error),
    causeMessage: cause?.message,
    code: cause?.code,
    detail: cause?.detail,
    hint: cause?.hint,
  });
}

const DATABASE_AUTH_ERROR = "Gagal menghubungkan akun. Silakan coba lagi beberapa saat.";

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

function siteUrl() {
  return String(process.env.NEXT_PUBLIC_SITE_URL || "https://pakdegriya.com").replace(/\/$/, "");
}

async function authContextFromToken(accessToken: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) throw new Error("Sesi login tidak valid. Silakan masuk kembali.");

  const profile = await ensureUserProfile(data.user as AuthUserLike);
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
  if (error || !data.session) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("email not confirmed")) return { error: "Email belum diverifikasi. Periksa inbox atau folder spam Anda." };
    return { error: "Email tidak ditemukan atau password salah." };
  }

  let destination: string;
  try {
    const { profile } = await authContextFromToken(data.session.access_token);
    destination = destinationForRole(String(profile.role), requestedNext);
    await saveSessionCookie(data.session.access_token, data.session.expires_in);
  } catch (error) {
    logServerError("Gagal menyelesaikan login email", error);
    return { error: DATABASE_AUTH_ERROR };
  }

  redirect(destination);
}

export async function googleIdTokenLoginAction(idToken: string, turnstileToken: string, requestedNext?: string | null) {
  try {
    if (!idToken) return { success: false, error: "Token Google tidak tersedia." };

    const verification = await verifyTurnstileToken(turnstileToken);
    if (!verification.success) return { success: false, error: verification.error || "Verifikasi keamanan gagal." };

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
    if (error || !data.session || !data.user) {
      console.error("signInWithIdToken gagal:", error);
      return { success: false, error: "Akun Google gagal diverifikasi. Silakan coba lagi." };
    }

    const profile = await ensureUserProfile(data.user as AuthUserLike);
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
    logServerError("Google ID token login gagal", error);
    return { success: false, error: DATABASE_AUTH_ERROR };
  }
}

export async function completeOAuthLoginAction(accessToken: string, expiresIn: number, requestedNext?: string | null) {
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
    logServerError("Gagal menyelesaikan login OAuth", error);
    return { success: false, error: DATABASE_AUTH_ERROR };
  }
}

export async function saveMemberPhoneAction(rawPhone: string, acceptedTerms = false, marketingOptIn = false) {
  try {
    const phone = normalizePhone(rawPhone);
    if (!phone) return { success: false, error: "Nomor telepon tidak valid. Gunakan nomor Indonesia aktif, misalnya 0812..." };
    if (!acceptedTerms) return { success: false, error: "Anda harus menyetujui Syarat & Ketentuan Pakde Griya." };

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;
    if (!accessToken) return { success: false, error: "Sesi login sudah berakhir. Silakan login kembali." };

    const { authUser } = await authContextFromToken(accessToken);
    const email = String(authUser.email || "").trim().toLowerCase();
    if (!email) return { success: false, error: "Email akun tidak ditemukan." };

    await updateUserPhone(email, phone);
    await updateAuthUserWithAccessToken(accessToken, {
      data: {
        ...(authUser.user_metadata || {}),
        phone,
        terms_accepted_at: new Date().toISOString(),
        marketing_opt_in: marketingOptIn,
      },
    });

    return { success: true, phone };
  } catch (error) {
    logServerError("saveMemberPhoneAction gagal", error);
    return { success: false, error: "Nomor telepon gagal disimpan. Silakan coba lagi." };
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
  const acceptedTerms = formData.get("acceptTerms") === "on";
  const marketingOptIn = formData.get("marketingOptIn") === "on";

  if (!name || !email || !password || !phone) return { error: "Nama, email, nomor telepon, dan password wajib diisi dengan benar." };
  if (password.length < 8) return { error: "Password minimal 8 karakter." };
  if (!acceptedTerms) return { error: "Anda harus menyetujui Syarat & Ketentuan untuk membuat akun." };

  const verification = await verifyTurnstileToken(turnstileToken);
  if (!verification.success) return { error: verification.error || "Verifikasi keamanan gagal." };

  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/masuk?verified=1`,
      data: {
        full_name: name,
        phone,
        terms_accepted_at: new Date().toISOString(),
        marketing_opt_in: marketingOptIn,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already exists")) return { error: "Email sudah terdaftar!" };
    return { error: `Gagal mendaftar: ${error.message}` };
  }

  if (data.user) {
    try {
      await createMemberProfile({ id: data.user.id, email, name, phone });
    } catch (profileError) {
      logServerError("Gagal membuat profil member setelah signup", profileError);
      return { error: "Akun dibuat, tetapi profil belum dapat disiapkan. Silakan coba login beberapa saat lagi." };
    }
  }

  // Jika Confirm Email aktif di Supabase, session akan null sampai user klik email.
  // UI tetap mengarahkan user ke halaman instruksi verifikasi agar alurnya konsisten.
  return { success: true, requiresEmailVerification: !data.session, email };
}

export async function setSessionCookieAction(accessToken: string, expiresIn: number) {
  await saveSessionCookie(accessToken, expiresIn);
}
