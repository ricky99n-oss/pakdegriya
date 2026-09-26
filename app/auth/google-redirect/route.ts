import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSupabase } from "@/lib/supabase";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "edge";

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
};

type RedirectState = {
  next?: string;
  turnstile?: string;
};

function safeNext(value: unknown) {
  const next = String(value || "").trim();
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

function parseState(raw: FormDataEntryValue | null): RedirectState {
  try {
    const text = decodeURIComponent(String(raw || ""));
    const parsed = JSON.parse(text) as RedirectState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function logServerError(label: string, error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error
    ? (error as { cause?: any }).cause
    : undefined;

  console.error(label, {
    message: error instanceof Error ? error.message : String(error),
    causeMessage: cause?.message,
    code: cause?.code,
    detail: cause?.detail,
    hint: cause?.hint,
  });
}

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

function destinationForRole(roleValue: string, requestedNext: string | null) {
  const role = String(roleValue || "member").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";

  if (requestedNext) {
    if (requestedNext.startsWith("/admin") && !isAdmin) return "/";
    return requestedNext;
  }

  return isAdmin ? "/admin/dashboard" : "/";
}

function errorRedirect(request: NextRequest, message: string) {
  const url = new URL("/auth/masuk", request.url);
  url.searchParams.set("google_error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const credential = String(formData.get("credential") || "");
    const csrfBody = String(formData.get("g_csrf_token") || "");
    const csrfCookie = request.cookies.get("g_csrf_token")?.value || "";
    const state = parseState(formData.get("state"));

    if (!credential) return errorRedirect(request, "Google tidak mengirim token login. Silakan coba lagi.");
    if (!csrfBody || !csrfCookie || csrfBody !== csrfCookie) {
      return errorRedirect(request, "Validasi keamanan Google gagal. Silakan ulangi login.");
    }

    const verification = await verifyTurnstileToken(String(state.turnstile || ""));
    if (!verification.success) {
      return errorRedirect(request, verification.error || "Verifikasi Cloudflare gagal. Silakan ulangi login.");
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: credential,
    });

    if (error || !data.session || !data.user) {
      console.error("Mobile Google redirect signInWithIdToken gagal:", error);
      return errorRedirect(request, "Akun Google gagal diverifikasi. Silakan coba lagi.");
    }

    const profile = await ensureUserProfile(data.user as AuthUser);
    const requestedNext = safeNext(state.next);
    const destination = destinationForRole(String(profile.role), requestedNext);
    const role = String(profile.role || "member").toLowerCase();
    const isAdmin = role === "admin" || role === "superadmin";
    const requiresPhone = !isAdmin && !String(profile.phone || "").trim();

    const target = requiresPhone
      ? `/auth/lengkapi-telepon?next=${encodeURIComponent(destination)}`
      : destination;

    const response = NextResponse.redirect(new URL(target, request.url), 303);
    response.cookies.set("supabase_access_token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(60, Number(data.session.expires_in) || 3600),
    });

    return response;
  } catch (error) {
    logServerError("Google redirect login error", error);
    return errorRedirect(request, "Gagal menghubungkan akun. Silakan coba lagi beberapa saat.");
  }
}
