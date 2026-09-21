import { db } from "@/db";
import { properties, propertyMedia } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Building2, Compass, MessageCircle, ShieldCheck, Sparkles, LogOut } from "lucide-react";
import { validateRequest } from "@/lib/auth";
import { keluarAction } from "@/app/auth/actions";
import ShareButton from "@/components/ShareButton"; // <-- IMPORT TOMBOL SHARE

export const dynamic = "force-dynamic";

export default async function BerandaPublik() {
  try {
    const { user } = await validateRequest();

    const publikProperti = await db
      .select()
      .from(properties)
      .where(eq(properties.publishStatus, "published"))
      .orderBy(desc(properties.updatedAt))
      .limit(6);

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
      <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] relative">
        
        {/* CSS Inline untuk Background Pola Berulang (Jarang-jarang) */}
        <style dangerouslySetInnerHTML={{__html: `
          .bg-pola {
            background-image: url('/images/pola.webp');
            background-size: 400px;
            background-repeat: repeat;
            background-position: center;
            opacity: 0.05;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 0;
            pointer-events: none;
          }
        `}} />

        {/* Layer Pola Background */}
        <div className="bg-pola"></div>

        {/* Navbar Publik Cerdas */}
        <header className="border-b border-[#D6A34A]/20 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] flex items-center justify-center font-bold text-2xl shadow-md">
                P
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-[#4A2F1B]">Pakde Griya</span>
                <p className="text-[10px] tracking-widest text-[#D6A34A] uppercase font-bold">Broker Properti No.1 Di Dunia</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-6 font-medium text-[#4A2F1B]">
              <Link href="/" className="hover:text-[#D6A34A] transition-colors">Beranda</Link>
              <Link href="#properti" className="hover:text-[#D6A34A] transition-colors">Cari Properti</Link>
              
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-[#D6A34A]/30">
                  <div className="text-right leading-tight">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Halo, {user.role}</span>
                    <span className="font-black text-sm capitalize">{user.name}</span>
                  </div>
                  
                  {(user.role === 'superadmin' || user.role === 'admin') && (
                    <Link href="/admin/dashboard" className="text-xs bg-[#4A2F1B] text-white px-4 py-2 rounded-xl hover:bg-[#281C15] transition-all font-bold shadow-md">
                      Panel Admin
                    </Link>
                  )}

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
        <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 bg-[#D6A34A]/10 text-[#4A2F1B] px-4 py-1.5 rounded-full text-xs font-bold border border-[#D6A34A]/30">
              <Sparkles size={14} className="text-[#D6A34A]" /> Tuku gak tuku sak karepmu
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#4A2F1B] leading-tight">
              Temukan Hunian Impian di <span className="text-[#D6A34A]">PakdeGriya.com</span>
            </h1>
            <p className="text-lg text-[#281C15]/80 leading-relaxed">
              Survei virtual 360° sebelum survei langsung. Dijamin transparan, aman, dan dibimbing langsung oleh tim profesional Pakde Griya.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a 
                href="https://wa.me/6285815999953?text=Halo%20Pakde%20Griya,%20saya%20tertarik%20konsultasi%20properti." 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-[#25D366]/30 hover:bg-[#20ba59] transition-all"
              >
                <MessageCircle size={20} /> Konsultasi via WhatsApp
              </a>
            </div>
          </div>

          <div className="bg-[#4A2F1B] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-[#D6A34A]/30">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#D6A34A]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#D6A34A] text-[#4A2F1B] flex items-center justify-center font-black text-3xl">P</div>
              <h3 className="text-2xl font-bold">Jaminan Layanan Pakde</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Semua listing properti telah melalui kurasi. Dapatkan data akurat tanpa rekayasa.
              </p>
              <div className="pt-4 flex items-center gap-4 text-xs font-semibold text-[#D6A34A]">
                <span className="flex items-center gap-1"><ShieldCheck size={16} /> Terverifikasi Tim</span>
                <span className="flex items-center gap-1"><Compass size={16} /> Fitur Tur 360°</span>
              </div>
            </div>
          </div>
        </section>

        {/* DAFTAR PROPERTI */}
        <section id="properti" className="relative z-10 py-16 px-6 max-w-7xl mx-auto scroll-blur">
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
                <Link href={`/properti/${item.slug}`} key={item.id} className="block group">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#D6A34A]/20 flex flex-col h-full">
                    <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                      {item.coverId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={`/api/media/${item.coverId}`} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Tanpa Cover</div>
                      )}
                      
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#4A2F1B] shadow-sm uppercase">
                        {item.propertyType}
                      </div>

                      {/* --- TOMBOL SHARE KITA TARUH DI SINI --- */}
                      <ShareButton title={item.title} slug={item.slug} />

                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <p className="text-xs text-[#D6A34A] font-bold uppercase tracking-wider">{item.generalLocation}</p>
                        <h3 className="text-xl font-bold text-[#281C15] mt-1 group-hover:text-[#4A2F1B] transition-colors line-clamp-1">{item.title}</h3>
                        <p className="text-2xl font-black text-[#4A2F1B] mt-2">Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>

                      <div className="w-full block text-center bg-[#FFF7E8] text-[#4A2F1B] border border-[#D6A34A]/40 font-bold py-3 rounded-xl group-hover:bg-[#4A2F1B] group-hover:text-white transition-all shadow-sm">
                        Lihat Detail
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Highlight Section: Layanan Pakde Griya */}
        <section className="relative z-10 container mx-auto px-6 mt-16 mb-24 space-y-32 max-w-7xl overflow-hidden">
          
          <div className="flex flex-col md:flex-row items-center gap-10 scroll-blur">
            <div className="w-full md:w-5/12 relative h-[350px] md:h-[450px] flex items-end justify-center group">
              <Image src="/images/pakde-1.webp" alt="Pakde Griya Survey 360 Derajat" fill className="object-contain object-bottom group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl" />
            </div>
            <div className="w-full md:w-7/12 space-y-6 md:pl-6">
              <h2 className="text-3xl md:text-5xl font-black text-[#4A2F1B] leading-tight">
                Survey Rumah Makin Mudah dengan <span className="text-[#D6A34A]">Fitur 360°</span>
              </h2>
              <p className="text-lg text-[#281C15]/80 leading-relaxed">
                Gunakan fitur 360 derajat kami untuk melihat setiap sudut ruangan secara virtual tanpa harus keluar rumah. Hemat waktu dan pastinya 100% transparan tanpa manipulasi sudut pandang.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse items-center gap-10 scroll-blur">
            <div className="w-full md:w-5/12 relative h-[350px] md:h-[450px] flex items-end justify-center group">
              <Image src="/images/pakde-2.webp" alt="Daftarkan Properti di Pakde Griya" fill className="object-contain object-bottom group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl" />
            </div>
            <div className="w-full md:w-7/12 space-y-6 md:pr-6">
              <h2 className="text-3xl md:text-5xl font-black text-[#4A2F1B] leading-tight">
                Dapatkan Kesempatan Masuk <span className="text-[#D6A34A]">Konten Pakde!</span>
              </h2>
              <p className="text-lg text-[#281C15]/80 leading-relaxed">
                Daftarkan propertimu sekarang dan raih peluang agar propertimu dipromosikan langsung melalui konten eksklusif media sosial Pakde Griya yang menjangkau ribuan calon pembeli potensial.
              </p>
              <a href="https://wa.me/6285815999953" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-2xl transition-all hover:scale-105 shadow-lg shadow-[#25D366]/30">
                <MessageCircle size={20} /> Hubungi via WA (085815999953)
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10 scroll-blur">
            <div className="w-full md:w-5/12 relative h-[350px] md:h-[450px] flex items-end justify-center group">
              <Image src="/images/pakde-3.webp" alt="Jual Properti Bersama Pakde" fill className="object-contain object-bottom group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl" />
            </div>
            <div className="w-full md:w-7/12 space-y-6 md:pl-6">
              <h2 className="text-3xl md:text-5xl font-black text-[#4A2F1B] leading-tight">
                Jual Propertimu Bersama <span className="text-[#D6A34A]">Pakde Griya</span>
              </h2>
              <p className="text-lg text-[#281C15]/80 leading-relaxed">
                Percayakan penjualan propertimu kepada tim profesional kami. Kami urus segala kerumitan teknis dan promosinya. Transaksi dijamin aman, cepat, dan transparan dari awal hingga tuntas.
              </p>
            </div>
          </div>

        </section>

        <footer className="relative z-10 border-t border-[#D6A34A]/20 bg-white/50 py-12 px-6 text-center text-sm text-[#4A2F1B]/70 mt-10">
          <p>© 2026 Pakde Griya. Seluruh hak cipta dilindungi. • Hubungi Pusat: 6285815999953</p>
        </footer>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7E8] p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow border border-red-200 max-w-lg w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Terjadi Gangguan Sistem</h1>
          <p className="text-gray-600 text-sm mb-4">Kami tidak dapat memuat data properti saat ini karena kendala koneksi database.</p>
        </div>
      </div>
    );
  }
}