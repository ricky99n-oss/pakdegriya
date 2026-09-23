import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

// Komponen SVG Kustom untuk Icon Brand
const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
);

export default function Footer() {
  return (
    <footer className="relative z-20 bg-[#4A2F1B] text-[#FFF7E8] pt-16 pb-8 px-6 border-t-[6px] border-[#D6A34A]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mb-12">
        
        {/* Kolom 1: Brand & Tagline */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D6A34A] text-[#4A2F1B] flex items-center justify-center font-black text-2xl shadow-md">
              P
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">Pakde Griya</span>
              <p className="text-[10px] tracking-widest text-[#D6A34A] uppercase font-bold">Broker Properti Malang Raya</p>
            </div>
          </div>
          <p className="text-[#FFF7E8]/70 text-sm leading-relaxed max-w-sm mt-4">
            Kami membantu Anda menemukan hunian dan aset investasi properti impian dengan fitur Virtual Tour 360° yang transparan, cerdas, dan terpercaya.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D6A34A] hover:text-[#4A2F1B] transition-all hover:scale-110" title="Instagram">
              <InstagramIcon />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D6A34A] hover:text-[#4A2F1B] transition-all hover:scale-110" title="Facebook">
              <FacebookIcon />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D6A34A] hover:text-[#4A2F1B] transition-all hover:scale-110" title="YouTube">
              <YoutubeIcon />
            </a>
          </div>
        </div>

        {/* Kolom 2: Informasi Kontak */}
        <div>
          <h3 className="text-lg font-bold text-[#D6A34A] mb-6">Hubungi Kami</h3>
          <ul className="space-y-5 text-sm text-[#FFF7E8]/80">
            <li className="flex items-start gap-4">
              <MapPin size={20} className="shrink-0 text-[#D6A34A] mt-0.5" />
              <span className="leading-relaxed">
                Office, Jl Patimura GG VI No 10,<br/>
                Temas, Batu, Jawa Timur, 65326
              </span>
            </li>
            <li className="flex items-center gap-4">
              <Phone size={20} className="shrink-0 text-[#D6A34A]" />
              <span className="font-bold text-white tracking-wide">085 815 9999 53</span>
            </li>
            <li className="flex items-center gap-4">
              <Mail size={20} className="shrink-0 text-[#D6A34A]" />
              <a href="mailto:halobos@pakdegriya.com" className="hover:text-[#D6A34A] transition-colors cursor-pointer">
                halobos@pakdegriya.com
              </a>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Tautan Cepat */}
        <div>
          <h3 className="text-lg font-bold text-[#D6A34A] mb-6">Tautan Cepat</h3>
          <ul className="space-y-3 text-sm text-[#FFF7E8]/80 font-medium">
            <li><Link href="/" className="hover:text-[#D6A34A] hover:pl-2 transition-all flex items-center gap-2">▸ Beranda Utama</Link></li>
            <li><Link href="/#properti" className="hover:text-[#D6A34A] hover:pl-2 transition-all flex items-center gap-2">▸ Cari Properti</Link></li>
            <li><Link href="/auth/masuk" className="hover:text-[#D6A34A] hover:pl-2 transition-all flex items-center gap-2">▸ Masuk Member</Link></li>
            <li><Link href="/auth/daftar" className="hover:text-[#D6A34A] hover:pl-2 transition-all flex items-center gap-2">▸ Daftar Member Baru</Link></li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center text-xs text-[#FFF7E8]/40 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 Pakde Griya. Seluruh hak cipta dilindungi.</p>
        <p>Broker Properti Terdepan di Batu, Jawa Timur</p>
      </div>
    </footer>
  );
}