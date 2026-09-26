import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { ArrowLeft, MessageCircle, MapPin, BedDouble, Bath, Maximize2, Home as HomeIcon, Lock } from "lucide-react";
import { validateRequest } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import ShareButton from "@/components/ShareButton";
import Footer from "@/components/Footer";
import GallerySlider from "@/components/GallerySlider";

export const dynamic = "force-dynamic";

export default async function DetailPropertiPage({ params }: { params: Promise<{ slug: string }> }) {
  await headers();
  const { slug } = await params;
  const { user } = await validateRequest();
  const isMember = Boolean(user);
  const supabase = getSupabase();

  const { data: records, error } = await supabase
    .from("properties")
    .select("id, code, slug, title, price, property_type, transaction_type, general_location, land_area, building_area, bedrooms, bathrooms, public_summary, publish_status")
    .eq("slug", slug)
    .limit(1);
  if (error || !records?.length) notFound();
  const property = records[0];

  const { data: mediaData } = await supabase
    .from("property_media")
    .select("id, file_type, is_public")
    .eq("property_id", property.id);

  const media = mediaData || [];
  const accessible = (item: any) => Boolean(item.is_public) || isMember;
  const cover = media.find((item) => item.file_type === "cover_public" && accessible(item));
  const galleryImages = media
    .filter((item) => ["cover_public", "gallery_private"].includes(item.file_type) && accessible(item))
    .map((item) => ({ id: item.id }));
  const hasPrivateGallery = media.some((item) => item.file_type === "gallery_private" && !item.is_public);
  const hasTour = media.some((item) => item.file_type === "panorama_private");

  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] flex flex-col">
      <div className="bg-pakde-pattern" aria-hidden="true" />
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#D6A34A]/20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" prefetch={false} className="flex items-center gap-2 text-[#4A2F1B] hover:text-[#D6A34A] font-bold"><ArrowLeft size={20} /><span className="hidden md:inline">Kembali</span></Link>
          <div className="font-black text-lg text-[#4A2F1B]">P<span className="text-[#D6A34A]">G</span></div>
        </div>
      </header>

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 mt-6 md:mt-8 space-y-6 md:space-y-8 relative z-10 pb-24">
        <section>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#D6A34A] uppercase tracking-wider">
              <span className="bg-[#D6A34A]/10 px-2 py-1 rounded">{property.property_type}</span>
              <span>•</span><span>{String(property.transaction_type).replace("_", " ")}</span>
            </div>
            <ShareButton title={property.title} slug={property.slug} className="w-10 h-10 shrink-0" />
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-[#4A2F1B] leading-tight mb-2">{property.title}</h1>
          <p className="flex items-center gap-1.5 text-gray-500 font-medium mb-4"><MapPin size={18} /> {property.general_location}</p>
          <div className="text-2xl md:text-3xl font-black text-[#4A2F1B]">Rp {Number(property.price).toLocaleString("id-ID")}</div>
        </section>

        <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-gray-200 rounded-2xl md:rounded-3xl overflow-hidden relative shadow-lg">
          {cover ? <Image src={`/api/media/${cover.id}`} alt={property.title} fill className="object-cover" priority /> : <div className="w-full h-full flex items-center justify-center text-gray-400">Foto cover belum tersedia untuk akses ini.</div>}
        </div>

        <GallerySlider images={galleryImages} />
        {!isMember && hasPrivateGallery && (
          <div className="bg-white border border-[#D6A34A]/30 rounded-2xl p-4 flex items-center gap-3 text-sm text-[#4A2F1B]">
            <Lock size={20} className="text-[#D6A34A] shrink-0" />
            <p><Link href={`/auth/masuk?next=${encodeURIComponent(`/properti/${slug}`)}`} className="font-bold text-[#D6A34A] hover:underline">Masuk sebagai member</Link> untuk melihat seluruh galeri privat properti.</p>
          </div>
        )}

        {hasTour && <TourAccessCard slug={property.slug} isMember={isMember} />}
        <PropertyStats property={property} />

        <section className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-[#D6A34A]/20">
          <h3 className="text-lg md:text-xl font-bold text-[#4A2F1B] mb-4">Deskripsi Properti</h3>
          <div className="text-sm md:text-base text-[#281C15]/80 leading-relaxed whitespace-pre-wrap">{property.public_summary || "Belum ada deskripsi lengkap yang ditambahkan untuk properti ini."}</div>
        </section>
      </main>

      <Footer />
      <div className="fixed bottom-4 md:bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex justify-center">
        <a href={`https://wa.me/6285815999953?text=Halo%20Pakde,%20saya%20tertarik%20dengan%20properti%20[${property.code}]%20${encodeURIComponent(property.title)}`} target="_blank" rel="noopener noreferrer" className="pointer-events-auto flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 md:py-4 px-6 md:px-8 rounded-full shadow-2xl hover:bg-[#20ba59] max-w-sm w-full"><MessageCircle size={20} /> Hubungi WhatsApp</a>
      </div>

      <style>{`.bg-pakde-pattern{background-image:url('/images/pola.webp');background-size:300px;opacity:.05;position:fixed;inset:0;z-index:0;pointer-events:none}`}</style>
    </div>
  );
}

function TourAccessCard({ slug, isMember }: { slug: string; isMember: boolean }) {
  return (
    <div className="bg-[#4A2F1B] rounded-2xl md:rounded-3xl p-6 md:p-8 text-center text-white shadow-xl relative overflow-hidden">
      <h2 className="text-xl md:text-2xl font-black mb-2 text-[#D6A34A]">Eksplorasi Virtual Tour 360°</h2>
      <p className="text-white/70 mb-6 text-sm">Lihat setiap sudut ruangan layaknya survei langsung.</p>
      {isMember ? (
        <Link href={`/properti/${slug}/tour`} prefetch={false} className="inline-block bg-[#D6A34A] text-[#281C15] font-bold px-8 py-3.5 rounded-full hover:bg-[#c2913b] shadow-lg">Mulai Virtual Tour</Link>
      ) : (
        <div className="bg-white/10 p-4 rounded-2xl inline-block max-w-sm w-full border border-white/10">
          <Lock className="mx-auto mb-2 text-[#D6A34A]" size={24} />
          <p className="text-sm font-medium mb-3">Akses Virtual Tour Khusus Member</p>
          <Link href={`/auth/masuk?next=${encodeURIComponent(`/properti/${slug}/tour`)}`} className="block w-full bg-[#D6A34A] text-[#4A2F1B] font-bold py-2.5 rounded-xl">Masuk / Daftar Member Gratis</Link>
        </div>
      )}
    </div>
  );
}

function PropertyStats({ property }: { property: any }) {
  const stats = [
    { icon: <BedDouble />, value: property.bedrooms || "-", label: "Kamar Tidur" },
    { icon: <Bath />, value: property.bathrooms || "-", label: "Kamar Mandi" },
    { icon: <Maximize2 />, value: `${property.land_area || "-"} m²`, label: "Luas Tanah" },
    { icon: <HomeIcon />, value: `${property.building_area || "-"} m²`, label: "Luas Bangunan" },
  ];
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 md:p-6 rounded-3xl border border-[#D6A34A]/20 shadow-sm">{stats.map((stat) => <div key={stat.label} className="flex flex-col items-center text-center p-2"><span className="text-[#D6A34A] mb-2">{stat.icon}</span><span className="text-lg font-black text-[#4A2F1B]">{stat.value}</span><span className="text-[10px] text-gray-500 uppercase font-bold">{stat.label}</span></div>)}</div>;
}
