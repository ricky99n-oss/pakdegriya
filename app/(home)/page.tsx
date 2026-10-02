import Link from "next/link";
import Image from "next/image";
import { Building2, Compass, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { validateRequest } from "@/lib/auth";
import PropertyCard from "@/components/PropertyCard";
import MemberWelcomeModal from "@/components/auth/MemberWelcomeModal";
import { loadPublicProperties } from "@/lib/property-listing";
import Footer from "@/components/Footer";
import PublicHeader from "@/components/PublicHeader";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function loadHomeData() {
  const { user } = await validateRequest();
  const supabase = getSupabase();

  const { data: publikProperti, error: propError } = await loadPublicProperties(supabase);

  if (propError) throw new Error(propError.message);

  const propertiDenganCover = await Promise.all(
    (publikProperti || []).map(async (prop) => {
      const { data: cover } = await supabase
        .from("property_media")
        .select("id")
        .eq("property_id", prop.id)
        .eq("file_type", "cover_public")
        .limit(1);

      return { ...prop, coverId: cover?.[0]?.id || null };
    })
  );

  return { user, propertiDenganCover };
}

export default async function BerandaPublik() {
  const data = await loadHomeData().catch((error) => {
    console.error("Kesalahan saat memuat halaman beranda:", error);
    return null;
  });
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF7E8] p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-200 max-w-lg w-full">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl font-black">!</span></div>
          <h1 className="text-2xl font-black text-[#4A2F1B] mb-3">Terjadi Gangguan Sistem</h1>
          <p className="text-gray-600 font-medium mb-8">Kami belum dapat memuat data properti saat ini. Silakan coba beberapa saat lagi.</p>
          <Link href="/" className="inline-block bg-[#D6A34A] text-[#4A2F1B] px-8 py-3 rounded-xl font-bold hover:bg-[#c2913b] transition-colors">Coba Muat Ulang</Link>
        </div>
      </div>
    );
  }
  const { user, propertiDenganCover } = data;
  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] flex flex-col relative overflow-hidden">
      <div
        className="fixed inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "url('/images/pola.webp')",
          backgroundSize: "400px",
          backgroundRepeat: "repeat",
          backgroundPosition: "center",
        }}
      />

      <PublicHeader user={user} />
      <MemberWelcomeModal isMember={Boolean(user)} />

      <main className="flex-grow z-10">
        <section className="py-14 md:py-20 px-5 md:px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 bg-[#D6A34A]/10 text-[#4A2F1B] px-4 py-1.5 rounded-full text-xs font-bold border border-[#D6A34A]/30">
              <Sparkles size={14} className="text-[#D6A34A]" /> Tuku gak tuku sak karepmu
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#4A2F1B] leading-tight">
              Temukan Hunian Impian di <span className="text-[#D6A34A]">PakdeGriya.com</span>
            </h1>
            <p className="text-lg text-[#281C15]/80 leading-relaxed font-medium">
              Survei virtual 360° sebelum survei langsung. Dijamin transparan, aman, dan dibimbing langsung oleh tim profesional Pakde Griya.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="https://wa.me/6285815999953?text=Halo%20Pakde%20Griya,%20saya%20tertarik%20konsultasi%20properti."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-[#25D366]/30 hover:bg-[#20ba59] transition-transform hover:scale-105"
              >
                <MessageCircle size={20} /> Konsultasi via WhatsApp
              </a>
            </div>
          </div>

          <div className="bg-[#4A2F1B] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-[#D6A34A]/30">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#D6A34A]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#D6A34A] text-[#4A2F1B] flex items-center justify-center font-black text-3xl shadow-lg">P</div>
              <h3 className="text-2xl font-bold text-[#D6A34A]">Jaminan Layanan Pakde</h3>
              <p className="text-white/90 text-sm leading-relaxed font-medium">Semua listing properti telah melalui kurasi. Dapatkan data akurat tanpa rekayasa.</p>
              <div className="pt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10"><ShieldCheck size={16} className="text-[#D6A34A]" /> Terverifikasi Tim</span>
                <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10"><Compass size={16} className="text-[#D6A34A]" /> Fitur Tur 360°</span>
              </div>
            </div>
          </div>
        </section>

        <section id="properti" className="py-14 md:py-16 px-5 md:px-6 max-w-7xl mx-auto scroll-mt-24">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-black text-[#4A2F1B]">Listing Pilihan</h2>
              <p className="text-[#281C15]/70 mt-1 font-medium">Properti siap huni dan investasi terbaik minggu ini.</p>
            </div>
          </div>

          {propertiDenganCover.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#D6A34A]/20 shadow-sm">
              <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-bold text-lg">Belum ada properti published yang tersedia saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {propertiDenganCover.map((item) => <PropertyCard key={item.id} item={item} />)}
            </div>
          )}
        </section>

        <section className="container mx-auto px-5 md:px-6 mt-16 mb-28 md:mb-32 space-y-24 md:space-y-32 max-w-7xl">
          <FeatureBlock image="/images/pakde-1.webp" imageAlt="Pakde Griya Survey 360 Derajat" title={<>Survey Rumah Makin Mudah dengan <span className="text-[#D6A34A]">Fitur 360°</span></>}>
            Gunakan fitur 360 derajat kami untuk melihat setiap sudut ruangan secara virtual tanpa harus keluar rumah. Hemat waktu dan pastinya transparan tanpa manipulasi sudut pandang.
          </FeatureBlock>

          <FeatureBlock reverse image="/images/pakde-2.webp" imageAlt="Daftarkan Properti di Pakde Griya" title={<>Dapatkan Kesempatan Masuk <span className="text-[#D6A34A]">Konten Pakde!</span></>}>
            Daftarkan propertimu sekarang dan raih peluang agar propertimu dipromosikan melalui konten eksklusif media sosial Pakde Griya yang menjangkau calon pembeli potensial.
            <a href="https://wa.me/6285815999953" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-3 px-7 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-2xl transition-transform hover:scale-105 shadow-xl shadow-[#25D366]/20"><MessageCircle size={22} /> Hubungi via WhatsApp</a>
          </FeatureBlock>

          <FeatureBlock image="/images/pakde-3.webp" imageAlt="Jual Properti Bersama Pakde" title={<>Jual Propertimu Bersama <span className="text-[#D6A34A]">Pakde Griya</span></>}>
            Percayakan penjualan propertimu kepada tim profesional kami. Kami bantu kurasi data, produksi konten, pemasaran, komunikasi calon pembeli, hingga pendampingan proses transaksi.
          </FeatureBlock>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureBlock({ image, imageAlt, title, children, reverse = false }: { image: string; imageAlt: string; title: React.ReactNode; children: React.ReactNode; reverse?: boolean }) {
  return (
    <div className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-10`}>
      <div className="w-full md:w-5/12 relative h-[320px] md:h-[450px] flex items-end justify-center group">
        <Image src={image} alt={imageAlt} fill className="object-contain object-bottom group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl" unoptimized />
      </div>
      <div className={`w-full md:w-7/12 space-y-6 ${reverse ? "md:pr-8" : "md:pl-8"}`}>
        <h2 className="text-3xl md:text-5xl font-black text-[#4A2F1B] leading-tight">{title}</h2>
        <div className="text-lg text-[#281C15]/80 leading-relaxed font-medium flex flex-col">{children}</div>
      </div>
    </div>
  );
}
