"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { masukAction } from "../actions";
import { LogIn } from "lucide-react";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import GoogleIdentityButton from "@/components/auth/GoogleIdentityButton";

export default function HalamanMasuk() {
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [nextPath, setNextPath] = useState("");
  const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("next") || "";
    const googleError = params.get("google_error") || "";

    if (requested.startsWith("/") && !requested.startsWith("//")) setNextPath(requested);
    if (googleError) setErrorMsg(googleError);
  }, []);

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileResetKey((value) => value + 1);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (turnstileConfigured && !turnstileToken) {
      setErrorMsg("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    const formData = new FormData(event.currentTarget);
    formData.set("cf-turnstile-response", turnstileToken);
    formData.set("next", nextPath);

    const res = await masukAction(formData);
    if (res?.error) {
      setErrorMsg(res.error);
      resetTurnstile();
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7E8] p-4 md:p-6 font-sans text-[#281C15]">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-[#D6A34A]/20">
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] font-bold text-3xl mb-6 shadow-md hover:scale-105 transition-transform">P</Link>
            <h1 className="text-3xl md:text-4xl font-black text-[#4A2F1B]">Masuk ke Akun Anda</h1>
            <p className="text-[#281C15]/70 mt-2 font-medium">Selamat datang kembali di Pakde Griya.</p>
          </div>

          {errorMsg && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center border border-red-200 shadow-sm">{errorMsg}</div>}

          <div className="mb-5">
            <TurnstileWidget
              resetKey={turnstileResetKey}
              onToken={setTurnstileToken}
              onExpire={() => setErrorMsg("Verifikasi keamanan kedaluwarsa. Silakan ulangi.")}
            />
          </div>

          <GoogleIdentityButton
            turnstileToken={turnstileToken}
            requestedNext={nextPath}
            mode="login"
            disabled={isLoading || (turnstileConfigured && !turnstileToken)}
            onError={setErrorMsg}
            onTokenConsumed={resetTurnstile}
          />

          <div className="flex items-center my-6"><div className="flex-1 border-t border-gray-200" /><span className="px-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">Atau dengan Email</span><div className="flex-1 border-t border-gray-200" /></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="next" value={nextPath} />
            <div><label className="block text-sm font-bold text-[#281C15] mb-2">Alamat Email</label><input type="email" name="email" required autoComplete="email" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A] focus:ring-2 focus:ring-[#D6A34A]/20 text-[#281C15]" placeholder="budi@email.com" /></div>
            <div><label className="block text-sm font-bold text-[#281C15] mb-2">Kata Sandi</label><input type="password" name="password" required autoComplete="current-password" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A] focus:ring-2 focus:ring-[#D6A34A]/20 text-[#281C15]" placeholder="••••••••" /></div>
            <button type="submit" disabled={isLoading || (turnstileConfigured && !turnstileToken)} className="w-full flex justify-center items-center gap-2 bg-[#4A2F1B] text-white font-bold py-4 rounded-xl hover:bg-[#281C15] shadow-md disabled:opacity-70"><LogIn size={18} /> {isLoading ? "Memproses..." : "Masuk Sekarang"}</button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-[#281C15]/70 border-t border-gray-100 pt-6">Belum punya akun? <Link href="/auth/daftar" className="text-[#D6A34A] font-bold hover:underline">Daftar sekarang</Link></div>
        </div>

        <div className="hidden md:block w-full md:w-1/2 relative bg-[#4A2F1B]">
          <Image src="/images/pakde-1.webp" alt="Portal Pakde Griya" fill className="object-cover opacity-60 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A2F1B] via-[#4A2F1B]/40 to-transparent flex flex-col justify-end p-12"><h2 className="text-4xl font-black text-white mb-3">Portal <span className="text-[#D6A34A]">Pakde Griya</span></h2><p className="text-white/80">Akses aman untuk properti dan tur 360°.</p></div>
        </div>
      </div>
    </div>
  );
}
