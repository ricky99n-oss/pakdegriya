import Link from "next/link";
import { MailCheck, ArrowLeft, ShieldCheck } from "lucide-react";

export default async function VerifikasiEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const params = await searchParams;
  const email = String(params.email || "email Anda");

  return (
    <div className="min-h-screen bg-[#FFF7E8] flex items-center justify-center p-5 text-[#281C15]">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#D6A34A]/25 shadow-xl p-7 md:p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#D6A34A]/15 text-[#b67d1d] mx-auto flex items-center justify-center mb-6"><MailCheck size={32} /></div>
        <p className="text-[10px] tracking-[.22em] uppercase font-black text-[#D6A34A]">Satu Langkah Lagi</p>
        <h1 className="text-3xl md:text-4xl font-black text-[#4A2F1B] mt-2">Verifikasi Email Anda</h1>
        <p className="mt-4 text-[#281C15]/70 leading-relaxed">Kami mengirim tautan verifikasi ke <b className="text-[#4A2F1B] break-all">{email}</b>. Klik tautan tersebut untuk mengaktifkan akun sebelum login.</p>

        <div className="mt-6 rounded-2xl bg-[#FFF7E8] border border-[#D6A34A]/20 p-4 text-left text-sm text-[#4A2F1B] flex gap-3">
          <ShieldCheck size={20} className="text-[#D6A34A] shrink-0" />
          <div><p className="font-black">Belum menerima email?</p><p className="text-xs mt-1 text-[#4A2F1B]/65">Periksa folder Spam/Promotions dan tunggu beberapa menit. Pastikan juga alamat email yang dimasukkan sudah benar.</p></div>
        </div>

        <div className="mt-7 grid sm:grid-cols-2 gap-3">
          <Link href="/auth/masuk" className="h-12 rounded-xl bg-[#D6A34A] text-[#281C15] font-black flex items-center justify-center">Ke Halaman Login</Link>
          <Link href="/auth/daftar" className="h-12 rounded-xl border border-[#D6A34A]/30 text-[#4A2F1B] font-black flex items-center justify-center gap-2"><ArrowLeft size={17} /> Kembali Daftar</Link>
        </div>
      </div>
    </div>
  );
}
