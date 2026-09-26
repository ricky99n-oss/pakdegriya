"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu, UserCircle2, X } from "lucide-react";
import { keluarAction } from "@/app/auth/actions";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
} | null;

export default function PublicHeader({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const role = String(user?.role || "member").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";

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

          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-[#D6A34A]/30">
              <div className="text-right leading-tight max-w-36">
                <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider block">Halo, {role}</span>
                <span className="font-black text-sm capitalize text-[#4A2F1B] truncate block">{user.name || "Member"}</span>
              </div>
              <Link href="/profil" prefetch={false} className="text-xs bg-[#FFF7E8] border border-[#D6A34A]/30 text-[#4A2F1B] px-3.5 py-2.5 rounded-xl hover:bg-[#D6A34A]/15 transition-all font-bold flex items-center gap-1.5"><UserCircle2 size={15} /> Profil</Link>
              {isAdmin && <Link href="/admin/dashboard" prefetch={false} className="text-xs bg-[#4A2F1B] text-[#D6A34A] px-4 py-2.5 rounded-xl hover:bg-[#281C15] transition-all font-bold shadow-md">Panel Admin</Link>}
              <form action={keluarAction}>
                <button type="submit" className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 border border-red-200 px-3.5 py-2.5 rounded-xl hover:bg-red-100 transition-all font-bold shadow-sm"><LogOut size={14} /> Keluar</button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-4 border-l border-[#D6A34A]/30">
              <Link href="/auth/masuk" prefetch={false} className="text-sm font-bold hover:text-[#D6A34A]">Masuk</Link>
              <Link href="/auth/daftar" prefetch={false} className="text-xs bg-[#D6A34A] text-[#281C15] px-5 py-2.5 rounded-xl hover:bg-[#c2913b] transition-all font-bold shadow-md">Daftar Member</Link>
            </div>
          )}
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

            <div className="border-t border-[#D6A34A]/20 mt-3 pt-3">
              {user ? (
                <div className="space-y-2">
                  <div className="rounded-2xl bg-[#FFF7E8] p-4 border border-[#D6A34A]/20">
                    <p className="text-[10px] uppercase tracking-wider text-[#D6A34A] font-black">Login sebagai {role}</p>
                    <p className="font-black text-[#4A2F1B] mt-1">{user.name || "Member"}</p>
                    {user.email && <p className="text-xs text-[#4A2F1B]/60 truncate">{user.email}</p>}
                  </div>
                  <Link href="/profil" onClick={close} className="w-full h-11 rounded-xl bg-[#FFF7E8] border border-[#D6A34A]/30 text-[#4A2F1B] font-black flex items-center justify-center gap-2"><UserCircle2 size={18} /> Profil Member</Link>
                  {isAdmin && <Link href="/admin/dashboard" onClick={close} className="w-full h-11 rounded-xl bg-[#4A2F1B] text-[#D6A34A] font-black flex items-center justify-center">Panel Admin</Link>}
                  <form action={keluarAction}><button type="submit" className="w-full h-11 rounded-xl bg-red-50 border border-red-200 text-red-600 font-black flex items-center justify-center gap-2"><LogOut size={17} /> Keluar</button></form>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/auth/masuk" onClick={close} className="h-11 rounded-xl border border-[#D6A34A]/30 text-[#4A2F1B] font-black flex items-center justify-center">Masuk</Link>
                  <Link href="/auth/daftar" onClick={close} className="h-11 rounded-xl bg-[#D6A34A] text-[#281C15] font-black flex items-center justify-center">Daftar</Link>
                </div>
              )}
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
