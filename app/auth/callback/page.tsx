"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { setSessionCookieAction } from "../actions";
import { Loader2 } from "lucide-react";

// Inisiasi Client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Supabase akan mengambil token yang tersembunyi di balik URL #
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          // 2. Simpan token ke dalam Cookie Server
          await setSessionCookieAction(
            data.session.access_token,
            data.session.expires_in
          );
          
          // 3. KUNCI PERBAIKAN: Gunakan window.location.href 
          // Ini memaksa browser merefresh state Next.js dari awal
          window.location.href = "/";
        } else {
          window.location.href = "/auth/masuk?error=Sesi_Kosong";
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Terjadi kesalahan sistem");
      }
    };

    handleCallback();
  }, []);

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
      <p className="text-sm font-medium opacity-70">Mohon tunggu sebentar, Anda akan segera dialihkan.</p>
    </div>
  );
}