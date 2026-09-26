"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { daftarMemberAction } from "../actions";
import { UserPlus, CheckCircle2 } from "lucide-react";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import GoogleIdentityButton from "@/components/auth/GoogleIdentityButton";

export default function HalamanDaftar() {
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

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
    setSuccessMsg("");
    const formData = new FormData(event.currentTarget);
    formData.set("cf-turnstile-response", turnstileToken);
    const res = await daftarMemberAction(formData);

    if (res?.error) {
      setErrorMsg(res.error);
      resetTurnstile();
    } else {
      setSuccessMsg("Pendaftaran berhasil! Silakan masuk ke akun Anda.");
      event.currentTarget.reset();
      resetTurnstile();
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7E8] p-4 md:p-6 font-sans text-[#281C15]">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row-reverse border border-[#D6A34A]/20">
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] font-bold text-3xl mb-6 shadow-md">P</Link>
            <h1 className="text-3xl md:text-4xl font-black text-[#4A2F1B]">Daftar Member</h1>
            <p className="text-[#281C15]/70 mt-2 font-medium">Buka akses eksklusif ke Virtual Tour 360° dan galeri properti lengkap.</p>
          </div>

          {errorMsg && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center border border-red-200">{errorMsg}</div>}
          {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold mb-6 text-center border border-green-200 flex items-center justify-center gap-2"><CheckCircle2 size={18} /> {successMsg}</div>}

          <div className="mb-5">
            <TurnstileWidget resetKey={turnstileResetKey} onToken={setTurnstileToken} onExpire={() => setErrorMsg("Verifikasi keamanan kedaluwarsa. Silakan ulangi.")} />
          </div>

          <GoogleIdentityButton
            turnstileToken={turnstileToken}
            mode="signup"
            disabled={isLoading || (turnstileConfigured && !turnstileToken)}
            onError={setErrorMsg}
            onTokenConsumed={resetTurnstile}
          />

          <div className="flex items-center my-6"><div className="flex-1 border-t border-gray-200" /><span className="px-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">Atau dengan Email</span><div className="flex-1 border-t border-gray-200" /></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="block text-sm font-bold mb-2">Nama Lengkap</label><input type="text" name="name" required autoComplete="name" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50" placeholder="Cth: Budi Santoso" /></div>
            <div><label className="block text-sm font-bold mb-2">Nomor Telepon / WhatsApp</label><input type="tel" name="phone" required autoComplete="tel" inputMode="tel" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50" placeholder="0812 3456 7890" /></div>
            <div><label className="block text-sm font-bold mb-2">Alamat Email</label><input type="email" name="email" required autoComplete="email" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50" placeholder="budi@email.com" /></div>
            <div><label className="block text-sm font-bold mb-2">Kata Sandi</label><input type="password" name="password" required minLength={8} autoComplete="new-password" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50" placeholder="Minimal 8 karakter" /></div>
            <button type="submit" disabled={isLoading || (turnstileConfigured && !turnstileToken)} className="w-full flex justify-center items-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold py-4 rounded-xl hover:bg-[#c2913b] disabled:opacity-70"><UserPlus size={18} /> {isLoading ? "Memproses..." : "Buat Akun Member"}</button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-[#281C15]/70 border-t border-gray-100 pt-6">Sudah punya akun? <Link href="/auth/masuk" className="text-[#D6A34A] font-bold hover:underline">Masuk di sini</Link></div>
        </div>

        <div className="hidden md:block w-full md:w-1/2 relative bg-[#4A2F1B]">
          <Image src="/images/pakde-2.webp" alt="Daftar Member Pakde Griya" fill className="object-cover opacity-60 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A2F1B] via-[#4A2F1B]/40 to-transparent flex flex-col justify-end p-12"><h2 className="text-4xl font-black text-white mb-3">Bergabung Bersama <span className="text-[#D6A34A]">Kami</span></h2><p className="text-white/80">Rasakan pengalaman survei properti 360° dengan akun yang terlindungi verifikasi anti-bot.</p></div>
        </div>
      </div>
    </div>
  );
}
