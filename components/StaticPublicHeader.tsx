"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function StaticPublicHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-[#D6A34A]/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 group min-w-0" onClick={close}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#4A2F1B] text-[#D6A34A] flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md group-hover:scale-105 transition-transform shrink-0">P</div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#4A2F1B] block leading-none truncate">Pakde Griya</span>
            <p className="text-[8px] sm:text-[10px] tracking-[.16em] text-[#D6A34A] uppercase font-bold mt-1 truncate">Broker Properti Malang Raya</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-5 font-medium text-[#4A2F1B]">
          <Link href="/" className="hover:text-[#D6A34A] transition-colors font-bold">Beranda</Link>
          <Link href="/#properti" className="hover:text-[#D6A34A] transition-colors font-bold">Cari Properti</Link>
          <Link href="/tentang-kami" className="hover:text-[#D6A34A] transition-colors font-bold">Tentang Kami</Link>
          <Link href="/syarat-ketentuan" className="hover:text-[#D6A34A] transition-colors font-bold">Syarat & Ketentuan</Link>
          <div className="flex items-center gap-3 pl-4 border-l border-[#D6A34A]/30">
            <Link href="/profil" prefetch={false} className="text-sm font-bold hover:text-[#D6A34A]">Profil</Link>
            <Link href="/auth/masuk" prefetch={false} className="text-sm font-bold hover:text-[#D6A34A]">Masuk</Link>
            <Link href="/auth/daftar" prefetch={false} className="text-xs bg-[#D6A34A] text-[#281C15] px-5 py-2.5 rounded-xl hover:bg-[#c2913b] transition-all font-bold shadow-md">Daftar Member</Link>
          </div>
        </nav>

        <button type="button" className="lg:hidden w-11 h-11 rounded-xl border border-[#D6A34A]/30 bg-[#FFF7E8] text-[#4A2F1B] flex items-center justify-center shrink-0" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Tutup menu" : "Buka menu"}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[#D6A34A]/20 bg-white/95 backdrop-blur-xl shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <MobileLink href="/" onClick={close}>Beranda</MobileLink>
            <MobileLink href="/#properti" onClick={close}>Cari Properti</MobileLink>
            <MobileLink href="/tentang-kami" onClick={close}>Tentang Kami</MobileLink>
            <MobileLink href="/syarat-ketentuan" onClick={close}>Syarat & Ketentuan</MobileLink>
            <div className="grid grid-cols-3 gap-2 border-t border-[#D6A34A]/20 mt-3 pt-3">
              <Link href="/profil" onClick={close} className="h-11 rounded-xl border border-[#D6A34A]/30 text-[#4A2F1B] text-sm font-black flex items-center justify-center">Profil</Link>
              <Link href="/auth/masuk" onClick={close} className="h-11 rounded-xl border border-[#D6A34A]/30 text-[#4A2F1B] text-sm font-black flex items-center justify-center">Masuk</Link>
              <Link href="/auth/daftar" onClick={close} className="h-11 rounded-xl bg-[#D6A34A] text-[#281C15] text-sm font-black flex items-center justify-center">Daftar</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return <Link href={href} onClick={onClick} className="block px-4 py-3 rounded-xl text-[#4A2F1B] font-bold hover:bg-[#FFF7E8]">{children}</Link>;
}
