"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { verifyTurnstileToken } from "@/lib/turnstile";

function normalizeRequestedNext(value: FormDataEntryValue | string | null | undefined) {
  const next = String(value || "").trim();
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

async function resolvePostLoginDestination(accessToken: string, requestedNext?: string | null) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data?.user) {
    throw new Error("Sesi login tidak valid. Silakan masuk kembali.");
  }

  const email = String(data.user.email || "").trim().toLowerCase();
  let role = "member";

  if (email) {
    const { data: userRecords, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("email", email)
      .limit(1);

    if (!profileError && userRecords?.length && userRecords[0]?.role) {
      role = String(userRecords[0].role).toLowerCase();
    }
  }

  const isAdmin = role === "admin" || role === "superadmin";
  const requested = normalizeRequestedNext(requestedNext);

  // Jangan pernah mengarahkan member biasa ke area admin hanya karena parameter URL.
  if (requested) {
    if (requested.startsWith("/admin") && !isAdmin) return "/";
    return requested;
  }

  // Login biasa tanpa ?next=: admin masuk dashboard, member kembali ke website publik.
  return isAdmin ? "/admin/dashboard" : "/";
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
  if (!verification.success) {
    return { error: verification.error || "Verifikasi keamanan gagal." };
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return { error: "Email tidak ditemukan atau password salah." };
  }

  try {
    const destination = await resolvePostLoginDestination(
      data.session.access_token,
      requestedNext
    );

    await saveSessionCookie(data.session.access_token, data.session.expires_in);
    return redirect(destination);
  } catch (error) {
    console.error("Gagal menyelesaikan login email:", error);
    return { error: error instanceof Error ? error.message : "Gagal membuat sesi login." };
  }
}

export async function completeOAuthLoginAction(
  accessToken: string,
  expiresIn: number,
  requestedNext?: string | null
) {
  try {
    const destination = await resolvePostLoginDestination(accessToken, requestedNext);
    await saveSessionCookie(accessToken, expiresIn);
    return { success: true, redirectTo: destination };
  } catch (error) {
    console.error("Gagal menyelesaikan login OAuth:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat sesi login Google.",
    };
  }
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
  if (!verification.success) {
    return { error: verification.error || "Verifikasi keamanan gagal." };
  }

  const { error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) {
    if (
      error.message.includes("already registered") ||
      error.message.includes("User already exists")
    ) {
      return { error: "Email sudah terdaftar!" };
    }
    return { error: `Gagal mendaftar: ${error.message}` };
  }

  return { success: true };
}

// Dipertahankan untuk kompatibilitas jika masih ada pemanggil lama.
export async function setSessionCookieAction(accessToken: string, expiresIn: number) {
  await saveSessionCookie(accessToken, expiresIn);
}
