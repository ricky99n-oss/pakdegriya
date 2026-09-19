import Link from "next/link";
import Image from "next/image";
import { daftarMemberAction } from "../actions";
import { UserPlus } from "lucide-react";

export const metadata = {
  title: "Daftar Member | Pakde Griya",
};

export default async function HalamanDaftar({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7E8] p-4 md:p-6 font-sans text-[#281C15]">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row-reverse border border-[#D6A34A]/20">
        
        {/* Sisi Kanan (saat mobile jadi atas): Form Register */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] font-bold text-3xl mb-6 shadow-md hover:scale-105 transition-transform">
              P
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-[#4A2F1B]">Daftar Member</h1>
            <p className="text-[#281C15]/70 mt-2 font-medium">Buka akses eksklusif ke Virtual Tour 360° dan galeri properti lengkap.</p>
          </div>

          {/* Notifikasi Error */}
          {error === "email_terpakai" && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center border border-red-200 shadow-sm">
              Email tersebut sudah terdaftar. Silakan gunakan email lain.
            </div>
          )}

          <form action={daftarMemberAction} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Nama Lengkap</label>
              <input 
                type="text" 
                name="name" 
                required 
                className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A] focus:ring-2 focus:ring-[#D6A34A]/20 transition-all text-[#281C15]" 
                placeholder="Cth: Budi Santoso" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Alamat Email</label>
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A] focus:ring-2 focus:ring-[#D6A34A]/20 transition-all text-[#281C15]" 
                placeholder="budi@email.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Kata Sandi (Password)</label>
              <input 
                type="password" 
                name="password" 
                required 
                minLength={6} 
                className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 focus:outline-none focus:border-[#D6A34A] focus:ring-2 focus:ring-[#D6A34A]/20 transition-all text-[#281C15]" 
                placeholder="Minimal 6 karakter" 
              />
            </div>
            
            <button type="submit" className="w-full flex justify-center items-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold py-4 rounded-xl hover:bg-[#c2913b] transition-all shadow-md mt-4">
              <UserPlus size={18} /> Buat Akun Member
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-[#281C15]/70 border-t border-gray-100 pt-6">
            Sudah punya akun? <Link href="/auth/masuk" className="text-[#D6A34A] font-bold hover:underline">Masuk di sini</Link>
          </div>
        </div>

        {/* Sisi Kiri: Gambar Banner */}
        <div className="hidden md:block w-full md:w-1/2 relative bg-[#4A2F1B]">
          <Image 
            src="/images/pakde-2.webp" 
            alt="Daftar Member Pakde Griya" 
            fill 
            className="object-cover opacity-60 mix-blend-luminosity hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A2F1B] via-[#4A2F1B]/40 to-transparent flex flex-col justify-end p-12">
            <h2 className="text-4xl font-black text-white mb-3">
              Bergabung Bersama <span className="text-[#D6A34A]">Kami</span>
            </h2>
            <p className="text-white/80 text-base leading-relaxed font-medium">
              Rasakan pengalaman survei properti tanpa batas dan temukan investasi terbaik di Malang Raya bersama komunitas Pakde Griya.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}