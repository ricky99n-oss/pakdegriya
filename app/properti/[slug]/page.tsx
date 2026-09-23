import { db } from "@/db";
import { properties, propertyMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { validateRequest } from "@/lib/auth";
import { ArrowLeft, MessageCircle, MapPin, BedDouble, Bath, Maximize2, Home as HomeIcon } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function DetailPropertiPage(props: { params: Promise<{ slug: string }> | { slug: string } }) {
  const resolvedParams = await Promise.resolve(props.params);
  const slug = resolvedParams.slug;

  const { user } = await validateRequest();

  const propertyRecord = await db.select().from(properties).where(eq(properties.slug, slug));
  if (propertyRecord.length === 0) notFound();
  const property = propertyRecord[0];

  const allMedia = await db.select().from(propertyMedia).where(eq(propertyMedia.propertyId, property.id));
  
  const coverImage = allMedia.find(m => m.fileType === "cover_public");
  // Galeri sekarang bersifat publik
  const galleryImages = allMedia.filter(m => m.fileType === "gallery_private" || m.fileType === "cover_public");
  const hasVirtualTour = allMedia.some(m => m.fileType === "panorama_private");

  const isMember = !!user;

  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] flex flex-col">
      
      <style dangerouslySetInnerHTML={{__html: `
        .bg-pola {
          background-image: url('/images/pola.webp');
          background-size: 300px;
          background-repeat: repeat;
          background-position: center;
          opacity: 0.05; 
          position: fixed; /* Ubah ke fixed agar pola tetap saat scroll */
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 0;
          pointer-events: none;
        }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="bg-pola"></div>

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#D6A34A]/20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#4A2F1B] hover:text-[#D6A34A] font-bold transition-colors">
            <ArrowLeft size={20} /> <span className="hidden md:inline">Kembali</span>
          </Link>
          <div className="font-black text-lg tracking-tight text-[#4A2F1B]">
            P<span className="text-[#D6A34A]">G</span>
          </div>
        </div>
      </header>

      {/* Gunakan flex-grow agar main mengisi sisa tinggi layar sebelum footer */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 mt-6 md:mt-8 space-y-6 md:space-y-8 relative z-10 pb-16 md:pb-24">
        
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-bold text-[#D6A34A] uppercase tracking-wider mt-1">
              <span className="bg-[#D6A34A]/10 px-2 py-1 rounded">{property.propertyType}</span>
              <span className="hidden md:inline">•</span>
              <span className="bg-[#D6A34A]/10 md:bg-transparent px-2 md:px-0 py-1 md:py-0 rounded">{property.transactionType.replace('_', ' ')}</span>
            </div>
            <ShareButton title={property.title} slug={property.slug} className="w-10 h-10 shrink-0" />
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-[#4A2F1B] leading-tight mb-2">
            {property.title}
          </h1>
          <p className="flex items-start md:items-center gap-1.5 text-gray-500 font-medium mb-4 text-sm md:text-base">
            <MapPin size={18} className="shrink-0 mt-0.5 md:mt-0" /> 
            <span className="leading-snug">{property.generalLocation}</span>
          </p>
          <div className="text-2xl md:text-3xl font-black text-[#4A2F1B]">
            Rp {property.price.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-gray-200 rounded-2xl md:rounded-3xl overflow-hidden relative shadow-lg">
          {coverImage ? (
            <Image src={`/api/media/${coverImage.id}`} alt={property.title} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Tidak Ada Foto Cover</div>
          )}
        </div>

        {galleryImages.length > 0 && (
          <div className="pt-2 md:pt-4">
            <h3 className="text-lg md:text-xl font-bold text-[#4A2F1B] mb-4 border-l-4 border-[#D6A34A] pl-3">Galeri Properti</h3>
            <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scroll cursor-grab active:cursor-grabbing items-start">
              {galleryImages.map((img) => (
                <div key={img.id} className="w-[280px] h-[210px] md:w-[320px] md:h-[240px] bg-gray-100 rounded-2xl relative overflow-hidden group snap-center shadow-sm shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`/api/media/${img.id}`} 
                    alt="Galeri Properti" 
                    loading="lazy" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
              ))}
            </div>
            {galleryImages.length > 2 && (
              <p className="text-center text-[10px] md:text-xs text-gray-400 mt-1 italic">Geser ke samping untuk melihat foto lainnya ↔</p>
            )}
          </div>
        )}

        {hasVirtualTour && (
          <div className="bg-[#4A2F1B] rounded-2xl md:rounded-3xl p-6 md:p-8 text-center text-white shadow-xl relative overflow-hidden my-6 md:my-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D6A34A] to-transparent"></div>
            <h2 className="text-xl md:text-2xl font-black mb-2 text-[#D6A34A]">Eksplorasi Virtual Tour 360°</h2>
            <p className="text-white/70 mb-6 text-xs md:text-sm">Lihat setiap sudut ruangan layaknya survei langsung.</p>
            
            {isMember ? (
              <Link href={`/properti/${property.slug}/tour`} className="inline-block bg-[#D6A34A] text-[#281C15] font-bold px-6 py-3 md:px-8 md:py-3.5 rounded-full hover:bg-[#c2913b] transition-transform hover:scale-105 shadow-lg text-sm md:text-base">
                Mulai Virtual Tour
              </Link>
            ) : (
              <div className="bg-white/10 p-4 rounded-xl md:rounded-2xl inline-block max-w-sm w-full backdrop-blur border border-white/10">
                <LockIcon className="mx-auto mb-2 text-[#D6A34A]" size={24} />
                <p className="text-xs md:text-sm font-medium mb-3">Akses Virtual Tour Khusus Member</p>
                <Link href="/auth/daftar" className="block w-full bg-[#D6A34A] text-[#4A2F1B] font-bold py-2.5 rounded-xl hover:bg-[#e8b65c] transition-colors text-sm">
                  Daftar / Masuk Member Gratis
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[#D6A34A]/20 shadow-sm mt-6 md:mt-8">
          <div className="flex flex-col items-center justify-center text-center p-2">
            <BedDouble size={24} className="text-[#D6A34A] mb-2 md:w-7 md:h-7" strokeWidth={1.5} />
            <span className="text-lg md:text-xl font-black text-[#4A2F1B]">{property.bedrooms || "-"}</span>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-wider">Kamar Tidur</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 border-l border-gray-100">
            <Bath size={24} className="text-[#D6A34A] mb-2 md:w-7 md:h-7" strokeWidth={1.5} />
            <span className="text-lg md:text-xl font-black text-[#4A2F1B]">{property.bathrooms || "-"}</span>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-wider">Kamar Mandi</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 border-t md:border-t-0 md:border-l border-gray-100">
            <Maximize2 size={24} className="text-[#D6A34A] mb-2 md:w-7 md:h-7" strokeWidth={1.5} />
            <span className="text-lg md:text-xl font-black text-[#4A2F1B]">{property.landArea || "-"} <span className="text-xs md:text-sm font-medium">m²</span></span>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-wider">Luas Tanah</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 border-t md:border-t-0 border-l border-gray-100">
            <HomeIcon size={24} className="text-[#D6A34A] mb-2 md:w-7 md:h-7" strokeWidth={1.5} />
            <span className="text-lg md:text-xl font-black text-[#4A2F1B]">{property.buildingArea || "-"} <span className="text-xs md:text-sm font-medium">m²</span></span>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-wider">Luas Bangunan</span>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-[#D6A34A]/20 mt-6 md:mt-8">
          <h3 className="text-lg md:text-xl font-bold text-[#4A2F1B] mb-4">Deskripsi Properti</h3>
          
          <div className="relative group">
            <input type="checkbox" id="readMoreToggle" className="peer hidden" />
            
            <div className="text-sm md:text-base text-[#281C15]/80 leading-relaxed max-h-32 md:max-h-48 overflow-hidden peer-checked:max-h-none transition-all duration-500 whitespace-pre-wrap">
              {property.publicSummary || "Belum ada deskripsi lengkap yang ditambahkan untuk properti ini."}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-16 md:h-24 bg-gradient-to-t from-white to-transparent peer-checked:hidden pointer-events-none"></div>
            
            <label htmlFor="readMoreToggle" className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 md:translate-y-5 bg-white border border-[#D6A34A]/40 px-5 md:px-6 py-1.5 md:py-2 rounded-full font-bold text-[#D6A34A] text-xs md:text-sm cursor-pointer hover:bg-[#FFF7E8] hover:border-[#D6A34A] transition-colors select-none shadow-sm z-10 whitespace-nowrap">
              <span className="block peer-checked:hidden">Baca Selengkapnya ▾</span>
              <span className="hidden peer-checked:block">Sembunyikan ▴</span>
            </label>
          </div>
        </div>

      </main>

      {/* FOOTER DIPASTIKAN BERADA DI PALING BAWAH */}
      <div className="mt-auto">
        <Footer />
      </div>

      <div className="fixed bottom-4 md:bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex justify-center">
        <a 
          href={`https://wa.me/6285815999953?text=Halo%20Pakde,%20saya%20tertarik%20dengan%20properti%20[${property.code}]%20${property.title}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="pointer-events-auto flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 md:py-4 px-6 md:px-8 rounded-full shadow-2xl hover:bg-[#20ba59] transition-transform hover:scale-105 max-w-sm w-full text-sm md:text-base"
        >
          <MessageCircle size={20} className="md:w-6 md:h-6" /> Hubungi WhatsApp
        </a>
      </div>
    </div>
  );
}

function LockIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
}