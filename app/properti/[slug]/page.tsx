import { db } from "@/db";
import { properties, propertyMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { validateRequest } from "@/lib/auth";
import { ArrowLeft, MessageCircle, MapPin, BedDouble, Bath, Maximize2, Home as HomeIcon } from "lucide-react";

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
  const galleryImages = allMedia.filter(m => m.fileType === "gallery_private");
  const hasVirtualTour = allMedia.some(m => m.fileType === "panorama_private");

  const isMember = !!user;

  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] pb-32">
      
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#D6A34A]/20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#4A2F1B] hover:text-[#D6A34A] font-bold transition-colors">
            <ArrowLeft size={20} /> Kembali
          </Link>
          <div className="font-black text-lg tracking-tight text-[#4A2F1B]">
            P<span className="text-[#D6A34A]">G</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        {/* JUDUL & HARGA */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D6A34A] uppercase tracking-wider mb-2">
            <span className="bg-[#D6A34A]/10 px-2 py-1 rounded">{property.propertyType}</span>
            <span>•</span>
            <span>{property.transactionType.replace('_', ' ')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#4A2F1B] leading-tight mb-2">
            {property.title}
          </h1>
          <p className="flex items-center gap-1.5 text-gray-500 font-medium mb-4">
            <MapPin size={16} /> {property.generalLocation}
          </p>
          <div className="text-3xl font-black text-[#4A2F1B]">
            Rp {property.price.toLocaleString('id-ID')}
          </div>
        </div>

        {/* FOTO COVER UTAMA */}
        <div className="w-full aspect-[16/9] bg-gray-200 rounded-3xl overflow-hidden relative shadow-lg">
          {coverImage ? (
            <Image src={`/api/media/${coverImage.id}`} alt={property.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Tidak Ada Foto Cover</div>
          )}
        </div>

        {/* GALERI FOTO */}
        {galleryImages.length > 0 && (
          <div className="pt-4">
            <h3 className="text-xl font-bold text-[#4A2F1B] mb-4 border-l-4 border-[#D6A34A] pl-3">Galeri Properti</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {galleryImages.slice(0, 6).map((img) => (
                <div key={img.id} className="aspect-square bg-gray-100 rounded-2xl relative overflow-hidden group">
                  {isMember ? (
                    <Image src={`/api/media/${img.id}`} alt="Galeri" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <LockIcon size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!isMember && galleryImages.length > 0 && (
              <p className="text-center text-sm text-gray-500 mt-4 italic">Login sebagai member untuk melihat resolusi penuh galeri foto.</p>
            )}
          </div>
        )}

        {/* VIRTUAL TOUR 360 */}
        {hasVirtualTour && (
          <div className="bg-[#4A2F1B] rounded-3xl p-8 text-center text-white shadow-xl relative overflow-hidden my-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D6A34A] to-transparent"></div>
            <h2 className="text-2xl font-black mb-2 text-[#D6A34A]">Eksplorasi Virtual Tour 360°</h2>
            <p className="text-white/70 mb-6 text-sm">Lihat setiap sudut ruangan layaknya survei langsung.</p>
            
            {isMember ? (
              <Link href={`/properti/${property.slug}/tour`} className="inline-block bg-[#D6A34A] text-[#281C15] font-bold px-8 py-3.5 rounded-full hover:bg-[#c2913b] transition-transform hover:scale-105 shadow-lg">
                Mulai Virtual Tour
              </Link>
            ) : (
              <div className="bg-white/10 p-4 rounded-2xl inline-block max-w-sm w-full backdrop-blur border border-white/10">
                <LockIcon className="mx-auto mb-2 text-[#D6A34A]" size={24} />
                <p className="text-sm font-medium mb-3">Akses Virtual Tour Terkunci</p>
                <Link href="/auth/daftar" className="block w-full bg-white text-[#4A2F1B] font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                  Daftar Member Gratis
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ICON SPESIFIKASI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border border-[#D6A34A]/20 shadow-sm mt-8">
          <div className="flex flex-col items-center justify-center text-center p-2">
            <BedDouble size={28} className="text-[#D6A34A] mb-2" strokeWidth={1.5} />
            <span className="text-xl font-black text-[#4A2F1B]">{property.bedrooms || "-"}</span>
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Kamar Tidur</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 border-l border-gray-100">
            <Bath size={28} className="text-[#D6A34A] mb-2" strokeWidth={1.5} />
            <span className="text-xl font-black text-[#4A2F1B]">{property.bathrooms || "-"}</span>
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Kamar Mandi</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 border-t md:border-t-0 md:border-l border-gray-100">
            <Maximize2 size={28} className="text-[#D6A34A] mb-2" strokeWidth={1.5} />
            <span className="text-xl font-black text-[#4A2F1B]">{property.landArea || "-"} <span className="text-sm">m²</span></span>
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Luas Tanah</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 border-t md:border-t-0 border-l border-gray-100">
            <HomeIcon size={28} className="text-[#D6A34A] mb-2" strokeWidth={1.5} />
            <span className="text-xl font-black text-[#4A2F1B]">{property.buildingArea || "-"} <span className="text-sm">m²</span></span>
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Luas Bangunan</span>
          </div>
        </div>

        {/* DESKRIPSI (PALING BAWAH, DENGAN READ MORE) */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#D6A34A]/20 mt-8">
          <h3 className="text-xl font-bold text-[#4A2F1B] mb-4">Deskripsi Properti</h3>
          
          <div className="relative group">
            <input type="checkbox" id="readMoreToggle" className="peer hidden" />
            
            <div className="text-[#281C15]/80 leading-relaxed max-h-48 overflow-hidden peer-checked:max-h-none transition-all duration-500 whitespace-pre-wrap">
              {property.publicSummary || "Belum ada deskripsi lengkap yang ditambahkan untuk properti ini."}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent peer-checked:hidden pointer-events-none"></div>
            
            <label htmlFor="readMoreToggle" className="mt-4 inline-block font-bold text-[#D6A34A] cursor-pointer hover:text-[#4A2F1B] transition-colors select-none">
              <span className="block peer-checked:hidden">Baca Selengkapnya ▾</span>
              <span className="hidden peer-checked:block">Sembunyikan ▴</span>
            </label>
          </div>
        </div>

      </main>

      {/* FLOATING ACTION BUTTON (WA) */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex justify-center">
        <a 
          href={`https://wa.me/6285815999953?text=Halo%20Pakde,%20saya%20tertarik%20dengan%20properti%20[${property.code}]%20${property.title}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="pointer-events-auto flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:bg-[#20ba59] transition-transform hover:scale-105 max-w-sm w-full"
        >
          <MessageCircle size={24} /> Minat? Hubungi WhatsApp
        </a>
      </div>
    </div>
  );
}

function LockIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
}