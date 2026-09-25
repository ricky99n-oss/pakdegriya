import Link from "next/link";
import Image from "next/image";
import { Building2, Compass, MessageCircle, ShieldCheck, Sparkles, LogOut } from "lucide-react";
import { validateRequest } from "@/lib/auth";
import { keluarAction } from "@/app/auth/actions";
import ShareButton from "@/components/ShareButton";
import Footer from "@/components/Footer";
import { headers } from "next/headers";
import { getSupabase } from "@/lib/supabase"; 

export const dynamic = "force-dynamic";

export default async function BerandaPublik() {
  headers();

  try {
    const { user } = await validateRequest();
    const supabase = getSupabase();

    const { data: publikProperti, error: propError } = await supabase
      .from("properties")
      .select(`
        id, 
        code, 
        slug, 
        title, 
        description, 
        publicSummary:public_summary, 
        price, 
        transactionType:transaction_type, 
        propertyType:property_type, 
        generalLocation:general_location, 
        preciseAddress:precise_address, 
        landArea:land_area, 
        buildingArea:building_area, 
        bedrooms, 
        bathrooms, 
        publishStatus:publish_status, 
        availabilityStatus:availability_status, 
        updatedAt:updated_at
      `)
      .eq("publish_status", "published")
      .order("updated_at", { ascending: false })
      .limit(6);

    if (propError) throw new Error(propError.message);

    // URL fallback jika environment variable tidak terbaca
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lfqobyxyuurpzepjyzjw.supabase.co";

    // 2. Ambil data cover dan LANGSUNG buat URL publiknya
    const propertiDenganCover = await Promise.all(
      (publikProperti || []).map(async (prop) => {
        const { data: cover } = await supabase
          .from("property_media")
          .select("id, file_name") // Minta file_name langsung
          .eq("property_id", prop.id)
          .eq("file_type", "cover_public")
          .limit(1);

        let coverUrl = null;
        if (cover && cover.length > 0 && cover[0].file_name) {
          // Buat URL langsung ke CDN Supabase (bypass API Media dan cegah error Firefox)
          coverUrl = `${supabaseUrl}/storage/v1/object/public/pakdegriya-media/${cover[0].file_name}`;
        }

        return {
          ...prop,
          coverUrl, // Simpan URL yang sudah jadi
        };
      })
    );

    return (
      <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] flex flex-col relative overflow-hidden">
        
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
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] flex items-center justify-center font-bold text-2xl shadow-md group-hover:scale-105 transition-transform">
                P
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-[#4A2F1B]">Pakde Griya</span>
                <p className="text-[10px] tracking-widest text-[#D6A34A] uppercase font-bold">Broker Properti Malang Raya</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 font-medium text-[#4A2F1B]">
              <Link href="/" className="hover:text-[#D6A34A] transition-colors font-bold">Beranda</Link>
              <Link href="#properti" className="hover:text-[#D6A34A] transition-colors font-bold">Cari Properti</Link>
              
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-[#D6A34A]/30">
                  <div className="text-right leading-tight">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Halo, {user.role}</span>
                    <span className="font-black text-sm capitalize text-[#4A2F1B]">{user.name}</span>
                  </div>
                  
                  {(user.role === 'superadmin' || user.role === 'admin') && (
                    <Link href="/admin/dashboard" prefetch={false} className="text-xs bg-[#4A2F1B] text-[#D6A34A] px-4 py-2.5 rounded-xl hover:bg-[#281C15] transition-all font-bold shadow-md">
                      Panel Admin
                    </Link>
                  )}

                  <form action={keluarAction}>
                    <button type="submit" className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 border border-red-200 px-3.5 py-2.5 rounded-xl hover:bg-red-100 transition-all font-bold shadow-sm" title="Keluar Akun">
                      <LogOut size={14} /> Keluar
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-4 border-l border-[#D6A34A]/30">
                  <Link href="/auth/masuk" prefetch={false} className="text-sm font-bold text-[#4A2F1B] hover:text-[#D6A34A] transition-colors">Masuk</Link>
                  <Link href="/auth/daftar" prefetch={false} className="text-xs bg-[#D6A34A] text-[#281C15] px-5 py-2.5 rounded-xl hover:bg-[#c2913b] transition-all font-bold shadow-md">
                    Daftar Member
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-grow z-10">
          <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
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
                <p className="text-white/90 text-sm leading-relaxed font-medium">
                  Semua listing properti telah melalui kurasi. Dapatkan data akurat tanpa rekayasa.
                </p>
                <div className="pt-4 flex items-center gap-4 text-xs font-bold text-white">
                  <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10"><ShieldCheck size={16} className="text-[#D6A34A]" /> Terverifikasi Tim</span>
                  <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10"><Compass size={16} className="text-[#D6A34A]" /> Fitur Tur 360°</span>
                </div>
              </div>
            </div>
          </section>

          <section id="properti" className="py-16 px-6 max-w-7xl mx-auto">
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
                {propertiDenganCover.map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-[#D6A34A]/20 flex flex-col group relative">
                    
                    <div className="relative aspect-[16/10] bg-gray-200 overflow-hidden block">
                      <Link href={`/properti/${item.slug}`} prefetch={false} className="absolute inset-0 z-10"></Link>
                      
                      {item.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={item.coverUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm bg-gray-100">Tanpa Cover</div>
                      )}
                      
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-[#4A2F1B] shadow-lg uppercase tracking-wider pointer-events-none z-20">
                        {item.propertyType}
                      </div>

                      <div className="absolute top-4 right-4 z-30">
                        <ShareButton title={item.title} slug={item.slug} />
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4 relative z-20 bg-white">
                      <div>
                        <p className="text-[10px] text-[#D6A34A] font-black uppercase tracking-widest">{item.generalLocation}</p>
                        <Link href={`/properti/${item.slug}`} prefetch={false} className="block mt-2 hover:text-[#D6A34A] transition-colors">
                          <h3 className="text-xl font-bold text-[#281C15] line-clamp-2 leading-tight">{item.title}</h3>
                        </Link>
                        <p className="text-2xl font-black text-[#4A2F1B] mt-3">Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>

                      <Link href={`/properti/${item.slug}`} prefetch={false} className="w-full block text-center bg-[#FFF7E8] text-[#4A2F1B] border border-[#D6A34A]/40 font-bold py-3.5 rounded-xl hover:bg-[#4A2F1B] hover:text-[#D6A34A] transition-colors shadow-sm">
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="container mx-auto px-6 mt-16 mb-32 space-y-32 max-w-7xl">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-full md:w-5/12 relative h-[350px] md:h-[450px] flex items-end justify-center group">
                <Image src="/images/pakde-1.webp" alt="Pakde Griya Survey 360 Derajat" fill className="object-contain object-bottom group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl" />
              </div>
              <div className="w-full md:w-7/12 space-y-6 md:pl-8">
                <h2 className="text-3xl md:text-5xl font-black text-[#4A2F1B] leading-tight">
                  Survey Rumah Makin Mudah dengan <span className="text-[#D6A34A]">Fitur 360°</span>
                </h2>
                <p className="text-lg text-[#281C15]/80 leading-relaxed font-medium">
                  Gunakan fitur 360 derajat kami untuk melihat setiap sudut ruangan secara virtual tanpa harus keluar rumah. Hemat waktu dan pastinya 100% transparan tanpa manipulasi sudut pandang.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse items-center gap-10">
              <div className="w-full md:w-5/12 relative h-[350px] md:h-[450px] flex items-end justify-center group">
                <Image src="/images/pakde-2.webp" alt="Daftarkan Properti di Pakde Griya" fill className="object-contain object-bottom group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl" />
              </div>
              <div className="w-full md:w-7/12 space-y-6 md:pr-8">
                <h2 className="text-3xl md:text-5xl font-black text-[#4A2F1B] leading-tight">
                  Dapatkan Kesempatan Masuk <span className="text-[#D6A34A]">Konten Pakde!</span>
                </h2>
                <p className="text-lg text-[#281C15]/80 leading-relaxed font-medium mb-4">
                  Daftarkan propertimu sekarang dan raih peluang agar propertimu dipromosikan langsung melalui konten eksklusif media sosial Pakde Griya yang menjangkau ribuan calon pembeli potensial.
                </p>
                <a href="https://wa.me/6285815999953" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-2xl transition-transform hover:scale-105 shadow-xl shadow-[#25D366]/20">
                  <MessageCircle size={24} /> Hubungi via WA (085815999953)
                </a>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-full md:w-5/12 relative h-[350px] md:h-[450px] flex items-end justify-center group">
                <Image src="/images/pakde-3.webp" alt="Jual Properti Bersama Pakde" fill className="object-contain object-bottom group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl" />
              </div>
              <div className="w-full md:w-7/12 space-y-6 md:pl-8">
                <h2 className="text-3xl md:text-5xl font-black text-[#4A2F1B] leading-tight">
                  Jual Propertimu Bersama <span className="text-[#D6A34A]">Pakde Griya</span>
                </h2>
                <p className="text-lg text-[#281C15]/80 leading-relaxed font-medium">
                  Percayakan penjualan propertimu kepada tim profesional kami. Kami urus segala kerumitan teknis dan promosinya. Transaksi dijamin aman, cepat, dan transparan dari awal hingga tuntas.
                </p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
        
      </div>
    );
  } catch (error: any) {
    console.error("Kesalahan saat memuat halaman beranda:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF7E8] p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-200 max-w-lg w-full">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-black">!</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A2F1B] mb-3">Terjadi Gangguan Sistem</h1>
          <p className="text-gray-600 font-medium mb-4">Kami tidak dapat memuat data properti saat ini karena kendala koneksi database.</p>
          
          <div className="bg-red-50 text-red-800 p-4 rounded-lg text-xs font-mono text-left mb-8 overflow-auto max-h-60 border border-red-200">
            <strong>Detail Error (Beri tahu tim IT):</strong><br/>
            {error?.message || String(error)}<br/>
            <pre className="mt-2 text-[10px] whitespace-pre-wrap">
              {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
            </pre>
          </div>
          
          <a 
            href="/" 
            className="inline-block bg-[#D6A34A] text-[#4A2F1B] px-8 py-3 rounded-xl font-bold hover:bg-[#c2913b] transition-colors"
          >
            Coba Muat Ulang
          </a>
        </div>
      </div>
    );
  }
}