"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { saveMemberPhoneAction } from "@/app/auth/actions";

type Props = {
  open: boolean;
  redirectTo: string;
  userName?: string;
  onComplete?: () => void;
};

export default function PhoneCompletionModal({ open, redirectTo, userName, onComplete }: Props) {
  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!acceptedTerms) {
      setError("Anda harus menyetujui Syarat & Ketentuan Pakde Griya.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await saveMemberPhoneAction(phone, acceptedTerms, marketingOptIn);
      if (!result.success) {
        setError(result.error || "Nomor telepon gagal disimpan.");
        return;
      }
      onComplete?.();
      window.location.replace(redirectTo || "/");
    } catch (err) {
      console.error("save phone failed:", err);
      setError("Koneksi ke server gagal. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="phone-title">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-[#D6A34A]/30">
        <div className="bg-[#4A2F1B] px-6 py-6 text-white">
          <div className="w-12 h-12 rounded-2xl bg-[#D6A34A] text-[#281C15] flex items-center justify-center mb-4"><Phone size={23} /></div>
          <h2 id="phone-title" className="text-2xl font-black">Lengkapi Nomor Telepon Anda</h2>
          <p className="text-white/70 text-sm mt-2">{userName ? `Halo ${userName}, ` : ""}nomor WhatsApp diperlukan untuk melengkapi akun member Pakde Griya.</p>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="rounded-xl bg-[#FFF7E8] border border-[#D6A34A]/20 p-3 flex gap-2 text-xs text-[#4A2F1B]">
            <ShieldCheck size={18} className="text-[#D6A34A] shrink-0" />
            <p>Gunakan nomor aktif. Format Indonesia seperti <b>0812...</b> atau <b>+62812...</b>.</p>
          </div>

          {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 p-3 text-sm font-bold">{error}</div>}

          <div>
            <label htmlFor="member-phone" className="block text-sm font-bold text-[#281C15] mb-2">Nomor Telepon / WhatsApp</label>
            <input id="member-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required autoFocus autoComplete="tel" inputMode="tel" placeholder="0812 3456 7890" className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-[#281C15] focus:outline-none focus:border-[#D6A34A] focus:ring-2 focus:ring-[#D6A34A]/20" />
          </div>

          <div className="space-y-3 rounded-2xl border border-[#D6A34A]/20 bg-[#FFF7E8] p-4">
            <label className="flex items-start gap-3 text-xs text-[#4A2F1B] cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 accent-[#D6A34A]" />
              <span>Saya menyetujui <Link href="/syarat-ketentuan" target="_blank" className="font-black underline text-[#b67d1d]">Syarat & Ketentuan Pakde Griya</Link>.</span>
            </label>
            <label className="flex items-start gap-3 text-xs text-[#4A2F1B]/80 cursor-pointer">
              <input type="checkbox" checked={marketingOptIn} onChange={(event) => setMarketingOptIn(event.target.checked)} className="mt-0.5 accent-[#D6A34A]" />
              <span>Saya bersedia menerima promo dan penawaran menarik melalui email dan/atau WhatsApp. Opsional.</span>
            </label>
          </div>

          <button type="submit" disabled={saving || !acceptedTerms} className="w-full h-12 rounded-xl bg-[#D6A34A] text-[#281C15] font-black flex items-center justify-center gap-2 hover:bg-[#c2913b] disabled:opacity-60">
            {saving ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : "Simpan & Lanjutkan"}
          </button>

          <p className="text-[11px] text-gray-400 text-center">Form ini wajib diselesaikan sebelum akun Google dapat digunakan sebagai member.</p>
        </form>
      </div>
    </div>
  );
}
