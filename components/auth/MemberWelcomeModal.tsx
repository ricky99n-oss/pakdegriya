"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Compass, Images, X } from "lucide-react";

const storageKey = "pakdegriya:member-welcome-dismissed";

export default function MemberWelcomeModal({ isMember }: { isMember: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isMember) return;
    try { if (sessionStorage.getItem(storageKey) === "1") return; } catch { /* Storage may be disabled. */ }
    const modal = dialog.current;
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    const restoreScroll = () => { document.body.style.overflow = previousOverflow; };
    modal.showModal();
    document.body.style.overflow = "hidden";
    modal.addEventListener("close", restoreScroll);
    return () => {
      modal.removeEventListener("close", restoreScroll);
      modal.close();
      restoreScroll();
    };
  }, [isMember]);

  const dismiss = () => {
    try { sessionStorage.setItem(storageKey, "1"); } catch { /* Closing still works without storage. */ }
    dialog.current?.close();
  };

  if (isMember) return null;
  return (
    <dialog ref={dialog} aria-labelledby="member-welcome-title" aria-describedby="member-welcome-description"
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl border border-[#D6A34A]/40 bg-[#FFF7E8] p-0 text-[#281C15] shadow-2xl backdrop:bg-black/65 backdrop:backdrop-blur-sm"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <div className="relative">
        <button type="button" onClick={dismiss} aria-label="Tutup ajakan daftar member" className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#D6A34A]"><X size={20} /></button>
        <div className="bg-[#4A2F1B] px-7 pb-8 pt-9 text-white sm:px-9">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D6A34A]/40 bg-[#D6A34A]/10 px-3 py-1.5 text-xs font-bold text-[#F2C87F]"><Compass size={16} /> Khusus Member Pakde Griya</span>
          <h2 id="member-welcome-title" className="text-3xl font-black leading-tight">Lihat lebih dekat,<br /><span className="text-[#D6A34A]">lewat tur 360°.</span></h2>
          <p id="member-welcome-description" className="mt-3 text-sm leading-relaxed text-white/80">Daftar member gratis untuk menjelajahi properti dari berbagai sudut sebelum datang survei.</p>
        </div>
        <div className="space-y-5 p-7 sm:p-9">
          <ul className="space-y-3 text-sm text-[#4A2F1B]">
            <li className="flex gap-3"><Compass className="shrink-0 text-[#B77F27]" size={22} /><span><b>Virtual Tour 360°</b><br />Jelajahi area properti yang memiliki tur virtual.</span></li>
            <li className="flex gap-3"><Images className="shrink-0 text-[#B77F27]" size={22} /><span><b>Galeri properti lengkap</b><br />Buka foto tambahan khusus member.</span></li>
          </ul>
          <Link href="/auth/daftar" onClick={dismiss} className="flex items-center justify-center gap-2 rounded-xl bg-[#D6A34A] px-5 py-3.5 font-black text-[#281C15] hover:bg-[#C2913B]">Daftar Member Gratis <ArrowRight size={18} /></Link>
          <p className="text-center text-sm text-[#4A2F1B]">Sudah punya akun? <Link href="/auth/masuk" onClick={dismiss} className="font-bold underline underline-offset-4">Masuk</Link></p>
          <button type="button" onClick={dismiss} className="block w-full py-1 text-center text-sm text-[#4A2F1B]/70 hover:text-[#4A2F1B]">Lihat listing dulu</button>
        </div>
      </div>
    </dialog>
  );
}
