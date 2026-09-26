"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { daftarMemberAction } from "../actions";
import { UserPlus } from "lucide-react";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import GoogleIdentityButton from "@/components/auth/GoogleIdentityButton";

export default function HalamanDaftar() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
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

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("cf-turnstile-response", turnstileToken);
    const email = String(formData.get("email") || "").trim().toLowerCase();

    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await daftarMemberAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
        resetTurnstile();
        return;
      }
      router.replace(`/auth/verifikasi-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("signup failed:", error);
      setErrorMsg("Koneksi ke server gagal. Silakan coba lagi.");
      resetTurnstile();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7E8] p-4 md:p-6 font-sans text-[#281C15]">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row-reverse border border-[#D6A34A]/20">
        <div className="w-full md:w-1/2 p-7 md:p-12 flex flex-col justify-center">
          <div className="mb-7">
            <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] font-bold text-3xl mb-6 shadow-md">P</Link>
            <h1 className="text-3xl md:text-4xl font-black text-[#4A2F1B]">Daftar Member</h1>
            <p className="text-[#281C15]/70 mt-2 font-medium">Buka akses eksklusif ke Virtual Tour 360° dan galeri properti lengkap.</p>
          </div>

          {errorMsg && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center border border-red-200">{errorMsg}</div>}

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
          <p className="text-[11px] text-gray-400 mt-2 text-center">Pendaftar Google akan diminta melengkapi nomor WhatsApp dan persetujuan Syarat & Ketentuan setelah login.</p>

          <div className="flex items-center my-6"><div className="flex-1 border-t border-gray-200" /><span className="px-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">Atau dengan Email</span><div className="flex-1 border-t border-gray-200" /></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="block text-sm font-bold mb-2">Nama Lengkap</label><input type="text" name="name" required autoComplete="name" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A]" placeholder="Cth: Budi Santoso" /></div>
            <div><label className="block text-sm font-bold mb-2">Nomor Telepon / WhatsApp</label><input type="tel" name="phone" required autoComplete="tel" inputMode="tel" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A]" placeholder="0812 3456 7890" /></div>
            <div><label className="block text-sm font-bold mb-2">Alamat Email</label><input type="email" name="email" required autoComplete="email" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A]" placeholder="budi@email.com" /></div>
            <div><label className="block text-sm font-bold mb-2">Kata Sandi</label><input type="password" name="password" required minLength={8} autoComplete="new-password" className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A]" placeholder="Minimal 8 karakter" /></div>

            <div className="space-y-3 rounded-2xl bg-[#FFF7E8] border border-[#D6A34A]/20 p-4">
              <label className="flex items-start gap-3 text-sm text-[#4A2F1B] cursor-pointer">
                <input type="checkbox" name="acceptTerms" required className="mt-1 accent-[#D6A34A]" />
                <span>Saya telah membaca dan menyetujui <Link href="/syarat-ketentuan" target="_blank" className="font-black text-[#b67d1d] underline">Syarat & Ketentuan Pakde Griya</Link>, termasuk ketentuan kanal transaksi resmi.</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-[#4A2F1B]/80 cursor-pointer">
                <input type="checkbox" name="marketingOptIn" className="mt-1 accent-[#D6A34A]" />
                <span>Saya bersedia menerima promo, rekomendasi properti, dan penawaran menarik dari Pakde Griya melalui email dan/atau WhatsApp. Pilihan ini bersifat opsional.</span>
              </label>
            </div>

            <button type="submit" disabled={isLoading || (turnstileConfigured && !turnstileToken)} className="w-full flex justify-center items-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold py-4 rounded-xl hover:bg-[#c2913b] disabled:opacity-70"><UserPlus size={18} /> {isLoading ? "Memproses..." : "Buat Akun Member"}</button>
            <p className="text-[11px] text-center text-gray-400">Pendaftaran via email memerlukan verifikasi melalui tautan yang dikirim ke inbox Anda.</p>
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
