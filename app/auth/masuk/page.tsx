import Link from "next/link";
import { masukAction } from "../actions";
import { Building2 } from "lucide-react";

export default async function HalamanMasuk({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-[#FFF7E8] flex flex-col items-center justify-center p-6 text-[#281C15]">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg border border-[#D6A34A]/30">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#4A2F1B] rounded-2xl flex items-center justify-center text-[#D6A34A] mb-4 shadow-md">
            <Building2 size={24} />
          </div>
          <h1 className="text-2xl font-black text-[#4A2F1B]">Masuk ke Akun Anda</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">Selamat datang kembali di Pakde Griya.</p>
        </div>

        {error === "tidak_ditemukan" && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-4 text-center border border-red-200">
            Email tidak ditemukan. Silakan daftar terlebih dahulu.
          </div>
        )}
        {error === "password_salah" && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-4 text-center border border-red-200">
            Kata sandi salah. Silakan coba lagi.
          </div>
        )}

        <form action={masukAction} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#281C15] mb-1">Alamat Email</label>
            <input type="email" name="email" required className="w-full border p-3 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A]" placeholder="budi@email.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#281C15] mb-1">Kata Sandi</label>
            <input type="password" name="password" required className="w-full border p-3 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A]" placeholder="••••••••" />
          </div>
          
          <button type="submit" className="w-full bg-[#4A2F1B] text-white font-bold py-3.5 rounded-xl hover:bg-[#281C15] transition-all shadow-md mt-2">
            Masuk
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium">
          Belum punya akun? <Link href="/auth/daftar" className="text-[#D6A34A] hover:underline">Daftar sekarang</Link>
        </div>
      </div>
    </div>
  );
}