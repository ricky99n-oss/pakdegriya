"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { completeOAuthLoginAction } from "../actions";
import { Loader2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function safeRequestedNext() {
  const requested = new URLSearchParams(window.location.search).get("next") || "";
  return requested.startsWith("/") && !requested.startsWith("//") ? requested : null;
}

async function waitForOAuthSession() {
  // Pada beberapa browser session OAuth baru tersedia beberapa tick setelah halaman callback dimuat.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

export default function AuthCallback() {
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        const session = await waitForOAuthSession();
        if (cancelled) return;

        if (!session) {
          window.location.replace("/auth/masuk?error=Sesi_Google_Tidak_Terbentuk");
          return;
        }

        const result = await completeOAuthLoginAction(
          session.access_token,
          session.expires_in,
          safeRequestedNext()
        );

        if (cancelled) return;

        if (!result.success || !result.redirectTo) {
          setErrorMsg(result.error || "Gagal menyelesaikan login Google.");
          return;
        }

        // replace mencegah tombol Back kembali ke callback OAuth.
        window.location.replace(result.redirectTo);
      } catch (error) {
        if (!cancelled) {
          setErrorMsg(error instanceof Error ? error.message : "Terjadi kesalahan sistem");
        }
      }
    };

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, []);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7E8] p-6">
        <div className="max-w-md bg-red-50 text-red-600 p-6 rounded-xl font-bold border border-red-200 shadow-md text-center">
          <p>Gagal Login Google</p>
          <p className="text-sm font-medium mt-2">{errorMsg}</p>
          <a href="/auth/masuk" className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#4A2F1B] text-white text-sm">
            Kembali ke Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF7E8] text-[#4A2F1B]">
      <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#D6A34A]" />
      <h2 className="text-xl font-black tracking-tight">Mengamankan Sesi Anda...</h2>
      <p className="text-sm font-medium opacity-70">Mohon tunggu sebentar, Anda akan segera dialihkan.</p>
    </div>
  );
}
