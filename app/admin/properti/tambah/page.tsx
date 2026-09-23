"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPropertyAction } from "./actions";

export default function TambahPropertiPage() {
  const router = useRouter();
  const [judul, setJudul] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleJudulChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setJudul(text);
    setSlug(text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // Menunggu respons dari server action
      const result = await createPropertyAction(formData);
      
      // Jika server mengembalikan objek berisi error, hentikan proses dan tampilkan pesan
      if (result?.error) {
        setErrorMsg(result.error);
        setIsLoading(false);
        return;
      }

      // Jika berhasil
      router.push("/admin/properti");
      router.refresh();
      
    } catch (err) {
      // Menangkap error jika koneksi terputus total
      setErrorMsg("Koneksi ke server terputus. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/properti" className="p-2 bg-white rounded-xl shadow-sm border border-[#D6A34A]/20 hover:bg-[#FFF7E8] transition-colors">
            <ArrowLeft size={24} className="text-[#4A2F1B]" />
          </Link>
          <h1 className="text-3xl font-extrabold text-[#281C15] tracking-tight">Tambah Properti Baru</h1>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#D6A34A]/20">
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Kode Properti</label>
              <input type="text" name="code" required placeholder="Mis: PG-001" className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15]" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Judul Iklan</label>
              <input 
                type="text" 
                name="title" 
                required 
                value={judul}
                onChange={handleJudulChange}
                placeholder="Rumah Nyaman Siap Huni di Pusat Kota" 
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15] text-lg font-semibold" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Slug URL (Otomatis)</label>
              <div className="flex items-center">
                <span className="bg-gray-100 border border-gray-300 border-r-0 p-3 rounded-l-xl text-gray-500 text-sm hidden md:block">pakdegriya.com/properti/</span>
                <input 
                  type="text" 
                  name="slug" 
                  required 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="rumah-nyaman-siap-huni" 
                  className="w-full border border-gray-300 p-3 md:rounded-l-none rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-white text-[#281C15]" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Harga (Angka Saja)</label>
              <input type="number" name="price" required placeholder="500000000" className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15]" />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Lokasi Umum</label>
              <input type="text" name="generalLocation" required placeholder="Batu, Jawa Timur" className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15]" />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Tipe Transaksi</label>
              <select name="transactionType" className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-white text-[#281C15]">
                <option value="jual">Jual</option>
                <option value="sewa_bulan">Sewa (Bulanan)</option>
                <option value="sewa_tahun">Sewa (Tahunan)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4A2F1B] mb-2">Jenis Properti</label>
              <select name="propertyType" className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-white text-[#281C15]">
                <option value="rumah">Rumah</option>
                <option value="tanah">Tanah</option>
                <option value="villa">Villa</option>
                <option value="ruko">Ruko</option>
                <option value="apartemen">Apartemen</option>
              </select>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100">
            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold text-lg py-4 px-8 rounded-xl hover:bg-[#c2913b] transition-all shadow-lg shadow-[#D6A34A]/30 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? "Menyimpan..." : <><Save size={24} /> Simpan sebagai Draft</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}