import Link from "next/link";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
);

const TikTokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18a4 4 0 1 1 4-4V3h3c.5 2.5 2 4 5 4v3c-2 0-3.7-.6-5-1.6V14a7 7 0 1 1-7-7"/></svg>
);

const ThreadsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c5.5 0 9 3.7 9 10s-3.5 10-9 10S3 18.3 3 12 6.5 2 12 2Z"/><path d="M8.5 8.5c1-1.5 3.7-1.8 5.4-.6 2 1.4 2.1 5.9-.7 7.3-2.2 1.1-4.7.1-4.7-1.7 0-1.8 2.2-2.7 4.5-2.2 2.5.5 4 2.1 4.3 4.3"/></svg>
);

const socials = [
  { label: "Instagram @pakdegriyacom", href: "https://www.instagram.com/pakdegriyacom/", Icon: InstagramIcon },
  { label: "Facebook pakdegriyacom", href: "https://www.facebook.com/pakdegriyacom", Icon: FacebookIcon },
  { label: "TikTok @pakdegriyacom", href: "https://www.tiktok.com/@pakdegriyacom", Icon: TikTokIcon },
  { label: "Threads @pakdegriyacom", href: "https://www.threads.com/@pakdegriyacom", Icon: ThreadsIcon },
  { label: "YouTube @pakdegriyacom", href: "https://www.youtube.com/@pakdegriyacom", Icon: YoutubeIcon },
];

export default function Footer() {
  return (
    <footer className="relative z-20 bg-[#4A2F1B] text-[#FFF7E8] pt-16 pb-8 px-6 border-t-[6px] border-[#D6A34A]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D6A34A] text-[#4A2F1B] flex items-center justify-center font-black text-2xl shadow-md">P</div>
            <div><span className="text-2xl font-black tracking-tight text-white">Pakde Griya</span><p className="text-[10px] tracking-widest text-[#D6A34A] uppercase font-bold">Broker Properti Malang Raya</p></div>
          </div>
          <p className="text-[#FFF7E8]/70 text-sm leading-relaxed max-w-sm">Broker properti modern yang memadukan kurasi listing, pemasaran digital, pendampingan transaksi, dan Virtual Tour 360° agar pencarian properti lebih transparan dan efisien.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            {socials.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D6A34A] hover:text-[#4A2F1B] transition-all hover:scale-110" title={label} aria-label={label}><Icon /></a>
            ))}
          </div>
          <p className="text-xs text-[#D6A34A] font-bold">Semua sosial media: @pakdegriyacom</p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#D6A34A] mb-6">Hubungi Kami</h3>
          <ul className="space-y-5 text-sm text-[#FFF7E8]/80">
            <li className="flex items-start gap-4"><MapPin size={20} className="shrink-0 text-[#D6A34A] mt-0.5" /><span className="leading-relaxed">Office, Jl Patimura GG VI No 10,<br/>Temas, Batu, Jawa Timur, 65326</span></li>
            <li className="flex items-center gap-4"><Phone size={20} className="shrink-0 text-[#D6A34A]" /><a href="https://wa.me/6285815999953" target="_blank" rel="noopener noreferrer" className="font-bold text-white tracking-wide hover:text-[#D6A34A]">085 815 9999 53</a></li>
            <li className="flex items-center gap-4"><Mail size={20} className="shrink-0 text-[#D6A34A]" /><a href="mailto:halobos@pakdegriya.com" className="hover:text-[#D6A34A] transition-colors">halobos@pakdegriya.com</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#D6A34A] mb-6">Informasi</h3>
          <ul className="space-y-3 text-sm text-[#FFF7E8]/80 font-medium">
            <li><Link href="/tentang-kami" className="hover:text-[#D6A34A] hover:pl-2 transition-all">▸ Tentang Kami</Link></li>
            <li><Link href="/syarat-ketentuan" className="hover:text-[#D6A34A] hover:pl-2 transition-all">▸ Syarat & Ketentuan</Link></li>
            <li><Link href="/#properti" className="hover:text-[#D6A34A] hover:pl-2 transition-all">▸ Cari Properti</Link></li>
            <li><a href="https://wa.me/6285815999953" target="_blank" rel="noopener noreferrer" className="hover:text-[#D6A34A] hover:pl-2 transition-all inline-flex items-center gap-1">▸ Kontak Resmi <ExternalLink size={12} /></a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#D6A34A] mb-6">Member</h3>
          <ul className="space-y-3 text-sm text-[#FFF7E8]/80 font-medium">
            <li><Link href="/auth/masuk" className="hover:text-[#D6A34A] hover:pl-2 transition-all">▸ Masuk Member</Link></li>
            <li><Link href="/auth/daftar" className="hover:text-[#D6A34A] hover:pl-2 transition-all">▸ Daftar Member Baru</Link></li>
            <li><Link href="/profil" className="hover:text-[#D6A34A] hover:pl-2 transition-all">▸ Profil Saya</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center text-xs text-[#FFF7E8]/40 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 Pakde Griya. Seluruh hak cipta dilindungi.</p>
        <p>Broker Properti Modern di Batu & Malang Raya</p>
      </div>
    </footer>
  );
}
