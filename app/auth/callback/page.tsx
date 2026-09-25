"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { setSessionCookieAction } from "../actions";
import { Loader2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      // 1. Supabase otomatis membaca '#access_token' dari URL
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        // 2. Kirim token ke Server Action untuk dijadikan Cookie
        await setSessionCookieAction(
          data.session.access_token,
          data.session.expires_in
        );
        // 3. Alihkan ke halaman admin
        router.push("/admin/dashboard");
      } else {
        router.push("/auth/masuk?error=Sesi_tidak_ditemukan");
      }
    };

    handleCallback();
  }, [router]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7E8]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl font-bold border border-red-200 shadow-md">
          Gagal Login: {errorMsg}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF7E8] text-[#4A2F1B]">
      <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#D6A34A]" />
      <h2 className="text-xl font-black tracking-tight">Mengamankan Sesi Anda...</h2>
      <p className="text-sm font-medium opacity-70">Mohon tunggu sebentar.</p>
    </div>
  );
}