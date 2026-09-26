import Link from "next/link";
import { Plus, Building2, Edit2, Trash2 } from "lucide-react";
import { hapusPropertiAction } from "./actions"; 
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DaftarPropertiPage() {
  const supabase = getSupabase();
  
  // Menggunakan Supabase REST Client
  const { data: dataProperti } = await supabase
    .from("properties")
    .select("id, title, code, property_type, transaction_type, price, publish_status")
    .order("updated_at", { ascending: false });

  const propertiLengkap = dataProperti || [];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[#281C15] tracking-tight">Kelola Properti</h1>
          <p className="text-[#4A2F1B]/70 mt-1">Daftar semua listing properti Anda.</p>
        </div>
        <Link href="/admin/properti/tambah" className="flex items-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold px-5 py-2.5 rounded-xl hover:bg-[#c2913b] transition-all shadow-lg shadow-[#D6A34A]/30">
          <Plus size={20} strokeWidth={2.5} />
          Tambah Baru
        </Link>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#D6A34A]/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF7E8]/50 border-b border-[#D6A34A]/20 text-xs uppercase tracking-wider text-[#4A2F1B]/60">
                <th className="p-5 font-semibold">Listing</th>
                <th className="p-5 font-semibold">Tipe & Transaksi</th>
                <th className="p-5 font-semibold">Harga</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {propertiLengkap.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Building2 size={32} className="text-gray-300" />
                      </div>
                      <p>Belum ada data properti. Silakan tambah baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                propertiLengkap.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-5">
                      <p className="font-bold text-[#281C15] text-base">{item.title}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1">{item.code}</p>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#FFF7E8] text-[#4A2F1B] text-xs font-semibold capitalize border border-[#D6A34A]/30">
                        {item.property_type}
                      </span>
                      <p className="text-xs text-gray-500 mt-2 capitalize font-medium">
                        {item.transaction_type.replace('_', ' ')}
                      </p>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-[#4A2F1B]">Rp {item.price.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${item.publish_status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.publish_status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Link href={`/admin/properti/${item.id}`} className="inline-block p-2 text-blue-500 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 shadow-sm" title="Kelola Media & Edit">
                          <Edit2 size={16} />
                        </Link>
                        
                        <form action={hapusPropertiAction}>
                          <input type="hidden" name="propertyId" value={item.id} />
                          <button type="submit" className="inline-block p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 shadow-sm cursor-pointer" title="Hapus Properti">
                            <Trash2 size={16} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}