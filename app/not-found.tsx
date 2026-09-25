import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] flex flex-col relative overflow-hidden">
      
      {/* Latar Belakang Pola */}
      <div 
        className="fixed inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "url('/images/pola.webp')",
          backgroundSize: "400px",
          backgroundRepeat: "repeat",
          backgroundPosition: "center"
        }}
      />

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#D6A34A]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] flex items-center justify-center font-bold text-2xl shadow-md group-hover:scale-105 transition-transform">
              P
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#4A2F1B]">Pakde Griya</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="space-y-6 max-w-md mx-auto">
          <div className="w-24 h-24 bg-white text-[#D6A34A] rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-[#D6A34A]/20 relative">
            <div className="absolute -inset-4 bg-[#D6A34A]/10 rounded-full blur-xl -z-10" />
            <SearchX size={48} strokeWidth={1.5} />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-6xl font-black text-[#4A2F1B] tracking-tight">404</h1>
            <h2 className="text-2xl font-bold text-[#D6A34A]">Halaman Tidak Ditemukan</h2>
            <p className="text-[#281C15]/80 font-medium leading-relaxed">
              Waduh! Sepertinya Anda tersesat. Halaman properti atau tautan yang Anda cari tidak tersedia atau telah dipindahkan.
            </p>
          </div>

          <div className="pt-4">
            <Link 
              href="/" 
              prefetch={false}
              className="inline-flex items-center gap-2 bg-[#4A2F1B] text-[#D6A34A] px-8 py-3.5 rounded-xl font-bold hover:bg-[#281C15] transition-all shadow-md group border border-[#D6A34A]/20"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}