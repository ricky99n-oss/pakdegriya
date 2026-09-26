import { getRequestContext } from "@cloudflare/next-on-pages";

type TurnstileVerifyResult = {
  success: boolean;
  skipped?: boolean;
  error?: string;
};

function getTurnstileSecret() {
  try {
    const env = getRequestContext().env as Record<string, string | undefined>;
    return env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;
  } catch {
    return process.env.TURNSTILE_SECRET_KEY;
  }
}

export async function verifyTurnstileToken(token: string | null | undefined): Promise<TurnstileVerifyResult> {
  const secret = getTurnstileSecret();

  // Graceful fallback supaya deploy tidak mengunci halaman login sebelum key dipasang.
  // Begitu TURNSTILE_SECRET_KEY tersedia di Cloudflare, verifikasi menjadi wajib.
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY belum dikonfigurasi; verifikasi Turnstile dilewati.");
    return { success: true, skipped: true };
  }

  if (!token) {
    return { success: false, error: "Verifikasi keamanan belum selesai. Silakan coba lagi." };
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, error: "Layanan verifikasi keamanan sedang tidak tersedia." };
    }

    const result = (await response.json()) as { success?: boolean; [key: string]: unknown };
    if (!result.success) {
      return { success: false, error: "Verifikasi keamanan gagal atau kedaluwarsa. Silakan ulangi." };
    }

    return { success: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Tidak dapat memverifikasi keamanan. Silakan coba lagi." };
  }
}
