"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Save, XCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPropertyAction } from "./actions";

export default function TambahPropertiPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleTitle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTitle(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const result = await createPropertyAction(new FormData(event.currentTarget));
      if (!result.success) {
        setNotice({ type: "error", text: result.error || "Gagal menyimpan properti." });
        return;
      }
      setNotice({ type: "success", text: result.message || "Properti berhasil dibuat." });
      window.setTimeout(() => {
        router.push(result.redirectTo || "/admin/properti");
        router.refresh();
      }, 650);
    } catch (error) {
      console.error("Create property failed:", error);
      setNotice({ type: "error", text: "Koneksi ke server terputus. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {notice && <div className="fixed inset-x-0 top-5 z-[9999] flex justify-center px-4"><div className={`max-w-md w-full rounded-2xl p-4 border shadow-2xl flex items-center gap-3 ${notice.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>{notice.type === "success" ? <CheckCircle2 /> : <XCircle />}<span className="font-bold text-sm">{notice.text}</span></div></div>}
      <div className="flex items-center gap-4"><Link href="/admin/properti" className="p-2 bg-white rounded-xl shadow-sm border border-[#D6A34A]/20 hover:bg-[#FFF7E8]"><ArrowLeft size={24} className="text-[#4A2F1B]" /></Link><h1 className="text-3xl font-extrabold text-[#281C15]">Tambah Properti Baru</h1></div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#D6A34A]/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Kode Properti"><input type="text" name="code" required maxLength={50} placeholder="Mis: PG-001" className={inputClass} /></Field>
            <div className="md:col-span-2"><Field label="Judul Iklan"><input type="text" name="title" required maxLength={255} value={title} onChange={handleTitle} placeholder="Rumah Nyaman Siap Huni di Pusat Kota" className={`${inputClass} text-lg font-semibold`} /></Field></div>
            <div className="md:col-span-2"><Field label="Slug URL"><div className="flex items-center"><span className="bg-gray-100 border border-gray-300 border-r-0 p-3 rounded-l-xl text-gray-500 text-sm hidden md:block">pakdegriya.com/properti/</span><input type="text" name="slug" required maxLength={255} value={slug} onChange={(event) => setSlug(event.target.value)} className={`${inputClass} md:rounded-l-none`} /></div></Field></div>
            <Field label="Harga (Angka Saja)"><input type="number" name="price" min="0" required placeholder="500000000" className={inputClass} /></Field>
            <Field label="Lokasi Umum"><input type="text" name="generalLocation" required maxLength={255} placeholder="Batu, Jawa Timur" className={inputClass} /></Field>
            <Field label="Tipe Transaksi"><select name="transactionType" className={inputClass}><option value="jual">Jual</option><option value="sewa_bulan">Sewa Bulanan</option><option value="sewa_tahun">Sewa Tahunan</option></select></Field>
            <Field label="Jenis Properti"><select name="propertyType" className={inputClass}><option value="rumah">Rumah</option><option value="tanah">Tanah</option><option value="villa">Villa</option><option value="ruko">Ruko</option><option value="apartemen">Apartemen</option></select></Field>
          </div>
          <div className="pt-6 border-t border-gray-100"><button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold text-lg py-4 rounded-xl hover:bg-[#c2913b] shadow-lg disabled:opacity-50">{loading ? "Menyimpan..." : <><Save size={24} /> Simpan sebagai Draft</>}</button></div>
        </form>
      </div>
    </div>
  );
}

const inputClass = "w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15]";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="block text-sm font-bold text-[#4A2F1B] mb-2">{label}</label>{children}</div>; }
