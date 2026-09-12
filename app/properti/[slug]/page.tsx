import { db } from "@/db";
import { properties, propertyMedia } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, MapPin, Tag, ShieldAlert } from "lucide-react";
import { validateRequest } from "@/lib/auth"; // <-- BARU: Memanggil fungsi autentikasi

export default async function DetailPropertiPublik({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // <-- BARU: Mengecek apakah pengunjung sudah login
  const { user } = await validateRequest(); 

  // 1. Tarik data properti berdasarkan slug dan pastikan sudah published
  const propertyRecord = await db
    .select()
    .from(properties)
    .where(and(eq(properties.slug, slug), eq(properties.publishStatus, "published")));

  if (propertyRecord.length === 0) {
    notFound(); // Menampilkan halaman 404 jika properti tidak ada / belum published
  }

  const property = propertyRecord[0];

  // 2. Tarik gambar cover publik
  const coverRecord = await db
    .select()
    .from(propertyMedia)
    .where(and(eq(propertyMedia.propertyId, property.id), eq(propertyMedia.fileType, "cover_public")))
    .limit(1);

  const coverId = coverRecord.length > 0 ? coverRecord[0].id : null;

  // Format pesan WhatsApp otomatis sesuai brief
  const waMessage = encodeURIComponent(
    `Halo Pakde Griya, saya tertarik properti ${property.code} — ${property.title}, harga Rp ${property.price.toLocaleString('id-ID')}, lokasi ${property.generalLocation}. Link: http://localhost:3000/properti/${property.slug}. Saya ingin bertanya/jadwal survei.`
  );

  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] pb-20">
      {/* Navbar Atas */}
      <div className="bg-white border-b border-[#D6A34A]/20 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#4A2F1B] font-bold hover:text-[#D6A34A] transition-colors">
            <ArrowLeft size={20} /> Kembali ke Beranda
          </Link>
          <span className="font-mono text-xs font-bold bg-[#FFF7E8] px-3 py-1 rounded-full border border-[#D6A34A]/30">
            {property.code}
          </span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 pt-10 space-y-8">
        {/* Judul & Lokasi */}
        <div className="space-y-2">
          <span className="inline-block uppercase tracking-wider text-xs font-bold text-[#D6A34A] bg-[#4A2F1B] px-3 py-1 rounded-md">
            {property.propertyType} • {property.transactionType.replace('_', ' ')}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-[#4A2F1B]">{property.title}</h1>
          <p className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
            <MapPin size={16} className="text-[#D6A34A]" /> {property.generalLocation}
          </p>
        </div>

        {/* Cover Utama */}
        <div className="rounded-3xl overflow-hidden aspect-[16/9] bg-white border border-[#D6A34A]/20 shadow-md">
          {coverId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={`/api/media/${coverId}`} 
              alt={property.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Tidak ada cover publik
            </div>
          )}
        </div>

        {/* Grid Informasi & CTA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sisi Kiri: Harga & Ringkasan */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-[#D6A34A]/20 shadow-sm space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Harga Penawaran</p>
                <p className="text-4xl font-black text-[#4A2F1B] mt-1">Rp {property.price.toLocaleString('id-ID')}</p>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h3 className="text-lg font-bold text-[#4A2F1B] mb-2">Ringkasan Properti</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {property.publicSummary || "Hubungi tim Pakde Griya melalui WhatsApp untuk mendapatkan rangkuman lengkap spesifikasi properti ini."}
                </p>
              </div>
            </div>

            {/* <-- BARU: Kotak Pengaman Akses Member (Dinamis berdasarkan sesi) --> */}
            <div className="bg-[#4A2F1B] text-white p-8 rounded-3xl shadow-lg border border-[#D6A34A]/30 space-y-4">
              {user ? (
                <>
                  <div className="flex items-center gap-3 text-[#D6A34A]">
                    <ShieldAlert size={28} />
                    <h3 className="text-xl font-bold text-white">Akses Member Terbuka</h3>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Karena Anda masuk sebagai <span className="font-bold text-[#D6A34A]">{user.name}</span>, Anda memiliki hak penuh untuk menjelajahi properti ini melalui Simulasi Virtual 360°.
                  </p>
                  <div className="pt-2">
                    <Link href={`/properti/${property.slug}/tour`} className="inline-block bg-[#D6A34A] text-[#281C15] font-bold px-8 py-3 rounded-xl hover:bg-[#c2913b] transition-all shadow-lg shadow-[#D6A34A]/20">
                      Mulai Virtual Tour 360°
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-[#D6A34A]">
                    <ShieldAlert size={28} />
                    <h3 className="text-xl font-bold text-white">Tur 360° Terkunci</h3>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Simulasi <strong>Virtual Tour 360°</strong> hanya dapat diakses oleh member aktif terdaftar.
                  </p>
                  <div className="pt-2">
                    <Link href="/setup" className="inline-block bg-[#D6A34A] text-[#281C15] font-bold px-6 py-2.5 rounded-xl hover:bg-[#c2913b] transition-all text-sm">
                      Masuk / Daftar Member
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Kotak Aksi WhatsApp Pusat */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-[#D6A34A]/20 shadow-sm sticky top-24 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF7E8] text-[#4A2F1B] flex items-center justify-center mx-auto font-bold text-xl border border-[#D6A34A]/30">
                  <Tag size={20} />
                </div>
                <h3 className="font-bold text-lg text-[#4A2F1B]">Minat Properti Ini?</h3>
                <p className="text-xs text-gray-500">Tanyakan ketersediaan dan jadwalkan survei langsung dengan pusat.</p>
              </div>

              <a 
                href={`https://wa.me/6289681011618?text=${waMessage}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-[#25D366]/20 hover:bg-[#20ba59] transition-all text-center"
              >
                <MessageCircle size={18} /> Hubungi WhatsApp
              </a>

              <div className="text-center text-[11px] text-gray-400">
                Respon cepat pada jam kerja operasional Malang Raya.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}