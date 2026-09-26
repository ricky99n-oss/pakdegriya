import { Compass, Handshake, ScanLine, ShieldCheck, Sparkles, Target } from "lucide-react";
import StaticPublicHeader from "@/components/StaticPublicHeader";
import Footer from "@/components/Footer";

export const dynamic = "force-static";

export default function TentangKamiPage() {
  return (
    <div className="min-h-screen bg-[#FFF7E8] text-[#281C15] flex flex-col">
      <StaticPublicHeader />
      <main className="flex-1">
        <section className="px-5 py-16 md:py-24">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.15fr_.85fr] gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D6A34A]/30 bg-[#D6A34A]/10 px-4 py-2 text-xs font-black text-[#4A2F1B]"><Sparkles size={15} /> Broker Properti Modern</span>
              <h1 className="mt-5 text-4xl md:text-6xl font-black leading-tight text-[#4A2F1B]">Kenal Lebih Dekat dengan <span className="text-[#D6A34A]">Pakde Griya</span></h1>
              <p className="mt-6 text-lg leading-relaxed text-[#281C15]/75">Pakde Griya adalah broker properti modern yang berfokus membantu pemilik, pembeli, penyewa, dan investor memahami properti dengan lebih transparan sebelum mengambil keputusan. Kami memadukan pendampingan manusia, pemasaran digital, kurasi informasi, serta teknologi Virtual Tour 360°.</p>
              <p className="mt-4 text-lg leading-relaxed text-[#281C15]/75">Fokus awal layanan kami adalah Batu dan Malang Raya. Setiap proses diarahkan agar calon pembeli dapat melihat informasi secara lebih jelas, berkomunikasi melalui kanal resmi, dan mendapatkan pendampingan dari tahap ketertarikan hingga proses transaksi.</p>
            </div>

            <div className="rounded-[2rem] bg-[#4A2F1B] text-white p-8 md:p-10 shadow-2xl border border-[#D6A34A]/25">
              <div className="w-16 h-16 rounded-2xl bg-[#D6A34A] text-[#4A2F1B] flex items-center justify-center font-black text-3xl">P</div>
              <h2 className="text-2xl font-black text-[#D6A34A] mt-6">Cara Kerja Pakde Griya</h2>
              <p className="text-white/75 leading-relaxed mt-3">Kami tidak sekadar menampilkan listing. Tim Pakde Griya membantu menata informasi properti, membuat materi pemasaran, menyajikan pengalaman visual, mengelola komunikasi calon pembeli, dan mendampingi proses sampai tahap yang disepakati para pihak.</p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 md:pb-28">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              <ValueCard icon={<ScanLine size={24} />} title="Virtual Tour 360°">Calon pembeli dapat mengeksplorasi sudut properti sebelum menjadwalkan survei langsung.</ValueCard>
              <ValueCard icon={<ShieldCheck size={24} />} title="Informasi Lebih Transparan">Kami mendorong penyajian data, foto, video, dan kondisi properti secara jelas dan mudah dipahami.</ValueCard>
              <ValueCard icon={<Handshake size={24} />} title="Pendampingan Transaksi">Komunikasi dan tindak lanjut dilakukan melalui tim resmi Pakde Griya untuk membantu proses lebih tertata.</ValueCard>
              <ValueCard icon={<Target size={24} />} title="Pemasaran Terarah">Konten, media sosial, website, dan jaringan pemasaran digunakan untuk mempertemukan properti dengan calon pasar yang relevan.</ValueCard>
              <ValueCard icon={<Compass size={24} />} title="Fokus Malang Raya">Kami membangun pengetahuan pasar lokal mulai dari Kota Batu dan kawasan Malang Raya.</ValueCard>
              <ValueCard icon={<Sparkles size={24} />} title="Pengalaman Modern">Teknologi dipakai untuk mempercepat pencarian informasi tanpa menghilangkan peran konsultasi langsung dengan tim.</ValueCard>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ValueCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-[#D6A34A]/20 p-6 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-[#D6A34A]/15 text-[#b67d1d] flex items-center justify-center">{icon}</div>
      <h3 className="mt-5 text-xl font-black text-[#4A2F1B]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#281C15]/70">{children}</p>
    </div>
  );
}
