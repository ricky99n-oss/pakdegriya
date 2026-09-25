"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { masukAction } from "../actions"; // loginWithGoogleAction dihapus dari import
import { LogIn } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Inisiasi Supabase Client untuk Client-Side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HalamanMasuk() {
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // FUNGSI LOGIN GOOGLE MENGGUNAKAN SUPABASE CLIENT
  const handleGoogle = async () => {
    setIsLoading(true);
    setErrorMsg("");
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    }
    // Jika sukses, browser akan otomatis dialihkan ke halaman Google
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const res = await masukAction(formData);

    if (res?.error) {
      setErrorMsg(res.error);
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

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center border border-red-200 shadow-sm">{errorMsg}</div>
          )}

          {/* TOMBOL GOOGLE */}
          <button type="button" onClick={handleGoogle} disabled={isLoading} className="w-full flex justify-center items-center gap-3 bg-white text-gray-700 font-bold py-3.5 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Masuk dengan Google
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">Atau dengan Email</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Alamat Email</label>
              <input type="email" name="email" required className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A] focus:ring-2 focus:ring-[#D6A34A]/20 transition-all text-[#281C15]" placeholder="budi@email.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Kata Sandi</label>
              <input type="password" name="password" required className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A] focus:ring-2 focus:ring-[#D6A34A]/20 transition-all text-[#281C15]" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-[#4A2F1B] text-white font-bold py-4 rounded-xl hover:bg-[#281C15] transition-all shadow-md mt-4 disabled:opacity-70">
              <LogIn size={18} /> {isLoading ? "Memproses..." : "Masuk Sekarang"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-[#281C15]/70 border-t border-gray-100 pt-6">
            Belum punya akun? <Link href="/auth/daftar" className="text-[#D6A34A] font-bold hover:underline">Daftar sekarang</Link>
          </div>
        </div>

        <div className="hidden md:block w-full md:w-1/2 relative bg-[#4A2F1B]">
          <Image src="/images/pakde-1.webp" alt="Portal Pakde Griya" fill className="object-cover opacity-60 mix-blend-luminosity hover:scale-105 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A2F1B] via-[#4A2F1B]/40 to-transparent flex flex-col justify-end p-12">
            <h2 className="text-4xl font-black text-white mb-3">Portal <span className="text-[#D6A34A]">Pakde Griya</span></h2>
            <p className="text-white/80 text-base leading-relaxed font-medium">Akses cepat dan mudah untuk mengelola properti, mengunggah tur 360°, dan terhubung dengan jutaan pembeli potensial.</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}