import { db } from "../../../db";
import { properties, propertyMedia } from "../../../db/schema";
import { validateRequest } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { Building2, Globe, FileImage, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const { user } = await validateRequest();
  
  // Proteksi ganda untuk halaman Dasbor
  if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
    redirect("/auth/masuk");
  }

  // Mengambil statistik dari database
  const allProperties = await db.select().from(properties);
  const publishedProps = allProperties.filter(p => p.publishStatus === "published");
  const draftProps = allProperties.filter(p => p.publishStatus === "draft");
  
  const allMedia = await db.select().from(propertyMedia);

  return (
    <div className="space-y-8">
      {/* Header Dasbor */}
      <div className="bg-white p-8 rounded-3xl border border-[#D6A34A]/20 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#D6A34A]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-[#281C15]">Dashboard Operasional</h1>
          <p className="text-[#4A2F1B]/70 mt-2 text-lg">
            Selamat datang kembali, <span className="font-black capitalize text-[#D6A34A]">{user.name}</span>!
          </p>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#D6A34A]/20 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-[#FFF7E8] text-[#D6A34A] rounded-2xl">
            <Building2 size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Listing</p>
            <p className="text-4xl font-black text-[#4A2F1B] mt-1">{allProperties.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
            <Globe size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Terkini Publik</p>
            <p className="text-4xl font-black text-[#4A2F1B] mt-1">{publishedProps.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-gray-50 text-gray-600 rounded-2xl">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Draft Disimpan</p>
            <p className="text-4xl font-black text-[#4A2F1B] mt-1">{draftProps.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#D6A34A]/20 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-[#4A2F1B] text-[#D6A34A] rounded-2xl">
            <FileImage size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Media</p>
            <p className="text-4xl font-black text-[#4A2F1B] mt-1">{allMedia.length}</p>
          </div>
        </div>
      </div>

      {/* Pintasan Aksi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FFF7E8] p-8 rounded-3xl border border-[#D6A34A]/30">
          <h3 className="text-xl font-bold text-[#4A2F1B] mb-4">Aksi Cepat</h3>
          <p className="text-sm text-[#281C15]/70 mb-6">Mulai tambahkan listing baru atau kelola properti yang sudah ada di database Anda.</p>
          <div className="flex gap-4">
            <Link href="/admin/properti/tambah" className="bg-[#4A2F1B] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#281C15] transition-colors text-sm shadow-md">
              + Tambah Properti
            </Link>
            <Link href="/admin/properti" className="bg-white text-[#4A2F1B] px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors border border-[#D6A34A]/30 text-sm flex items-center gap-2">
              Lihat Semua <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}