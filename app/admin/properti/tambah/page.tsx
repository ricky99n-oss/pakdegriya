import { db } from "@/db";
import { properties } from "@/db/schema";
import { redirect } from "next/navigation";
import Link from "next/link";
import crypto from "crypto";

export default function TambahPropertiPage() {
  
  // Server Action untuk menyimpan ke database
  async function simpanProperti(formData: FormData) {
    "use server";
    
    const id = crypto.randomUUID();
    const code = formData.get("code") as string;
    const slug = formData.get("slug") as string;
    const title = formData.get("title") as string;
    const price = Number(formData.get("price"));
    const generalLocation = formData.get("generalLocation") as string;
    const transactionType = formData.get("transactionType") as "jual" | "sewa_bulan" | "sewa_tahun";
    const propertyType = formData.get("propertyType") as "rumah" | "tanah" | "villa" | "ruko" | "apartemen";

    await db.insert(properties).values({
      id,
      code,
      slug,
      title,
      price,
      generalLocation,
      transactionType,
      propertyType,
      publishStatus: "draft",
      availabilityStatus: "available",
    });

    // Setelah simpan, langsung arahkan ke halaman Edit & Upload Media
    redirect(`/admin/properti/${id}`);
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#D6A34A]/20">
        
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-black text-[#4A2F1B]">Tambah Properti Baru</h1>
          <Link href="/admin/properti" className="text-sm font-bold text-gray-500 hover:text-[#D6A34A] transition-colors">
            Batal & Kembali
          </Link>
        </div>

        <form action={simpanProperti} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Kode Properti (Mis: PG-001)</label>
              <input type="text" name="code" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15] placeholder-gray-400" placeholder="PG-001" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Slug URL (Mis: rumah-murah-malang)</label>
              <input type="text" name="slug" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15] placeholder-gray-400" placeholder="rumah-murah-malang" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#281C15] mb-2">Judul Iklan</label>
            <input type="text" name="title" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15] placeholder-gray-400" placeholder="Rumah Nyaman Siap Huni di Pusat Kota" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Harga (Angka saja, tanpa titik/Rp)</label>
              <input type="number" name="price" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15] placeholder-gray-400" placeholder="500000000" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Lokasi Umum (Mis: Lowokwaru, Malang)</label>
              <input type="text" name="generalLocation" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-gray-50 text-[#281C15] placeholder-gray-400" placeholder="Batu, Jawa Timur" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Tipe Transaksi</label>
              <select name="transactionType" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-white text-[#281C15]">
                <option value="jual">Jual</option>
                <option value="sewa_bulan">Sewa (Bulanan)</option>
                <option value="sewa_tahun">Sewa (Tahunan)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#281C15] mb-2">Jenis Properti</label>
              <select name="propertyType" required className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:border-[#D6A34A] focus:ring-1 focus:ring-[#D6A34A] bg-white text-[#281C15]">
                <option value="rumah">Rumah</option>
                <option value="tanah">Tanah</option>
                <option value="villa">Villa</option>
                <option value="ruko">Ruko</option>
                <option value="apartemen">Apartemen</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-[#D6A34A] text-[#281C15] font-black py-4 rounded-xl hover:bg-[#c2913b] transition-all shadow-md text-lg">
              Simpan sebagai Draft
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}