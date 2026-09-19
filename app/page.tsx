import { db } from "@/db";
import { properties, propertyMedia } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Building2, Compass, MessageCircle, ShieldCheck, Sparkles, LogOut } from "lucide-react";
import { validateRequest } from "@/lib/auth"; // <-- BARU: Fungsi cek sesi
import { keluarAction } from "@/app/auth/actions"; // <-- BARU: Fungsi logout
export const dynamic = "force-dynamic";

export default async function BerandaPublik() {
  // <-- Cek siapa yang sedang membuka Beranda
  const { user } = await validateRequest();

  // 1. Tarik daftar properti yang sudah dipublikasikan (published)
  const publikProperti = await db
    .select()
    .from(properties)
    .where(eq(properties.publishStatus, "published"))
    .orderBy(desc(properties.updatedAt))
    .limit(6);

  // 2. Ambil cover publik untuk masing-masing properti
  const propertiDenganCover = await Promise.all(
    publikProperti.map(async (prop) => {
      const cover = await db
        .select()
        .from(propertyMedia)
        .where(and(eq(propertyMedia.propertyId, prop.id), eq(propertyMedia.fileType, "cover_public")))
        .limit(1);
      return {
        ...prop,
        coverId: cover.length > 0 ? cover[0].id : null,
      };
    })
  );

  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15]">
      {/* Navbar Publik Cerdas */}
      <header className="border-b border-[#D6A34A]/20 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] flex items-center justify-center font-bold text-2xl shadow-md">
              P
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#4A2F1B]">Pakde Griya</span>
              <p className="text-[10px] tracking-widest text-[#D6A34A] uppercase font-bold">Broker Properti Malang Raya</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 font-medium text-[#4A2F1B]">
            <Link href="/" className="hover:text-[#D6A34A] transition-colors">Beranda</Link>
            <Link href="#properti" className="hover:text-[#D6A34A] transition-colors">Cari Properti</Link>
            
            {/* === LOGIKA NAVBAR DINAMIS === */}
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-[#D6A34A]/30">
                <div className="text-right leading-tight">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Halo, {user.role}</span>
                  <span className="font-black text-sm capitalize">{user.name}</span>
                </div>
                
                {/* Tombol Khusus Admin */}
                {(user.role === 'superadmin' || user.role === 'admin') && (
                  <Link href="/admin/dashboard" className="text-xs bg-[#4A2F1B] text-white px-4 py-2 rounded-xl hover:bg-[#281C15] transition-all font-bold shadow-md">
                    Panel Admin
                  </Link>
                )}

                {/* Tombol Logout untuk semua tipe user */}
                <form action={keluarAction}>
                  <button type="submit" className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-100 transition-all font-bold" title="Keluar Akun">
                    <LogOut size={14} /> Keluar
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-[#D6A34A]/30">
                <Link href="/auth/masuk" className="text-sm font-bold hover:text-[#D6A34A] transition-colors">Masuk</Link>
                <Link href="/auth/daftar" className="text-xs bg-[#D6A34A] text-[#281C15] px-5 py-2.5 rounded-xl hover:bg-[#c2913b] transition-all font-bold shadow-sm">
                  Daftar Member
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 bg-[#D6A34A]/10 text-[#4A2F1B] px-4 py-1.5 rounded-full text-xs font-bold border border-[#D6A34A]/30">
            <Sparkles size={14} className="text-[#D6A34A]" /> Tuku gak tuku sak karepmu
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#4A2F1B] leading-tight">
            Temukan Hunian Impian di <span className="text-[#D6A34A]">Malang Raya</span>
          </h1>
          <p className="text-lg text-[#281C15]/80 leading-relaxed">
            Survei virtual 360° sebelum survei langsung. Dijamin transparan, aman, dan dibimbing langsung oleh tim profesional Pakde Griya.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a 
              href="https://wa.me/6289681011618?text=Halo%20Pakde%20Griya,%20saya%20tertarik%20konsultasi%20properti." 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#25D366] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-[#25D366]/30 hover:bg-[#20ba59] transition-all"
            >
              <MessageCircle size={20} /> Konsultasi via WhatsApp
            </a>
          </div>
        </div>

        {/* Kotak Ilustrasi Karakter Pakde */}
        <div className="bg-[#4A2F1B] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-[#D6A34A]/30">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#D6A34A]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#D6A34A] text-[#4A2F1B] flex items-center justify-center font-black text-3xl">
              P
            </div>
            <h3 className="text-2xl font-bold">Jaminan Layanan Pakde</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              Semua listing properti telah melalui kurasi ketat wilayah Kota Malang, Kabupaten Malang, dan Kota Batu. Dapatkan data akurat tanpa rekayasa.
            </p>
            <div className="pt-4 flex items-center gap-4 text-xs font-semibold text-[#D6A34A]">
              <span className="flex items-center gap-1"><ShieldCheck size={16} /> Terverifikasi Tim</span>
              <span className="flex items-center gap-1"><Compass size={16} /> Fitur Tur 360°</span>
            </div>
          </div>
        </div>
      </section>

      {/* Daftar Properti Unggulan */}
      <section id="properti" className="py-16 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-[#4A2F1B]">Listing Pilihan</h2>
            <p className="text-[#281C15]/70 mt-1">Properti siap huni dan investasi terbaik minggu ini.</p>
          </div>
        </div>

        {propertiDenganCover.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#D6A34A]/20 shadow-sm">
            <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada properti published yang tersedia saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {propertiDenganCover.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#D6A34A]/20 flex flex-col group">
                {/* Gambar Cover */}
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  {item.coverId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={`/api/media/${item.coverId}`} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Tanpa Cover
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#4A2F1B] shadow-sm uppercase">
                    {item.propertyType}
                  </div>
                </div>

                {/* Konten Kartu */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-xs text-[#D6A34A] font-bold uppercase tracking-wider">{item.generalLocation}</p>
                    <h3 className="text-xl font-bold text-[#281C15] mt-1 group-hover:text-[#4A2F1B] transition-colors line-clamp-1">{item.title}</h3>
                    <p className="text-2xl font-black text-[#4A2F1B] mt-2">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>

                  <Link 
                    href={`/properti/${item.slug}`} 
                    className="w-full block text-center bg-[#FFF7E8] text-[#4A2F1B] border border-[#D6A34A]/40 font-bold py-3 rounded-xl hover:bg-[#4A2F1B] hover:text-white transition-all shadow-sm"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer Sederhana */}
      <footer className="border-t border-[#D6A34A]/20 bg-white/50 py-12 px-6 text-center text-sm text-[#4A2F1B]/70">
        <p>© 2026 Pakde Griya. Seluruh hak cipta dilindungi. • Hubungi Pusat: 6289681011618</p>
      </footer>
    </div>
  );
}