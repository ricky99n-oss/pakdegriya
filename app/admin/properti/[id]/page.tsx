import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Lock, Globe, Save, Trash2, Music, Sparkles } from "lucide-react";
import { togglePublishStatus, updatePropertyAction } from "../actions";
import { deleteMediaAction } from "./actions";
import UploadMediaForm from "./UploadMediaForm";
import ActionForm from "@/components/admin/ActionForm";
import { getSupabase } from "@/lib/supabase";

export default async function KelolaMediaProperti({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();
  const { data: propertyRecord, error: propError } = await supabase.from("properties").select("*").eq("id", id).limit(1);
  if (propError || !propertyRecord?.length) redirect("/admin/properti");
  const property = propertyRecord[0];
  const { data: mediaList } = await supabase.from("property_media").select("*").eq("property_id", id).order("created_at", { ascending: false });
  const mediaFiles = mediaList || [];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/properti" className="p-2 bg-white rounded-xl shadow-sm border border-[#D6A34A]/20 hover:bg-[#FFF7E8]"><ArrowLeft size={24} className="text-[#4A2F1B]" /></Link>
          <div>
            <h1 className="text-3xl font-extrabold text-[#281C15] flex items-center gap-3">Edit Properti <span className={`text-xs px-2 py-1 rounded-md uppercase font-bold ${property.publish_status === "published" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>{property.publish_status}</span></h1>
            <p className="text-[#4A2F1B]/70 font-mono text-sm mt-1">{property.code}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Link href={`/admin/properti/${property.id}/tour`} className="px-6 py-2.5 rounded-xl font-bold bg-[#4A2F1B] text-[#D6A34A] hover:bg-[#281C15] border border-[#D6A34A]/50 text-sm">Buka Editor Tur 360°</Link>
          <ActionForm action={togglePublishStatus}>
            <input type="hidden" name="propertyId" value={property.id} />
            <input type="hidden" name="currentStatus" value={property.publish_status} />
            <button type="submit" className={`px-6 py-2.5 rounded-xl font-bold shadow-sm text-sm ${property.publish_status === "published" ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-[#25D366] text-white hover:bg-[#20ba59]"}`}>{property.publish_status === "published" ? "Kembalikan ke Draft" : "Terbitkan ke Publik"}</button>
          </ActionForm>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20">
        <h2 className="text-xl font-bold text-[#4A2F1B] mb-6 border-b border-gray-100 pb-4">Detail Informasi</h2>
        <ActionForm action={updatePropertyAction} className="space-y-4">
          <input type="hidden" name="propertyId" value={property.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Judul Iklan"><input type="text" name="title" defaultValue={property.title} required maxLength={255} className={inputClass} /></Field>
            <Field label="Slug URL"><input type="text" name="slug" defaultValue={property.slug} required maxLength={255} className={inputClass} /></Field>
            <Field label="Harga (Angka)"><input type="number" name="price" min="0" defaultValue={property.price} required className={inputClass} /></Field>
            <Field label="Lokasi Umum"><input type="text" name="generalLocation" defaultValue={property.general_location} required maxLength={255} className={inputClass} /></Field>
            <Field label="Tipe Transaksi"><select name="transactionType" defaultValue={property.transaction_type} className={inputClass}><option value="jual">Jual</option><option value="sewa_bulan">Sewa (Bulanan)</option><option value="sewa_tahun">Sewa (Tahunan)</option></select></Field>
            <Field label="Jenis Properti"><select name="propertyType" defaultValue={property.property_type} className={inputClass}><option value="rumah">Rumah</option><option value="tanah">Tanah</option><option value="villa">Villa</option><option value="ruko">Ruko</option><option value="apartemen">Apartemen</option></select></Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100 my-4">
            <MiniNumber label="Kamar Tidur" name="bedrooms" value={property.bedrooms || 0} />
            <MiniNumber label="Kamar Mandi" name="bathrooms" value={property.bathrooms || 0} />
            <MiniNumber label="Luas Tanah (m²)" name="landArea" value={property.land_area || 0} />
            <MiniNumber label="Luas Bangunan (m²)" name="buildingArea" value={property.building_area || 0} />
          </div>
          <Field label="Ringkasan Properti (Publik)"><textarea name="publicSummary" defaultValue={property.public_summary || ""} rows={4} maxLength={5000} className={inputClass} /></Field>
          <div className="flex justify-end pt-4"><button type="submit" className="flex items-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold py-2.5 px-6 rounded-xl hover:bg-[#c2913b] shadow-md"><Save size={18} /> Simpan Perubahan</button></div>
        </ActionForm>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1"><div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20"><div className="flex items-center gap-2 mb-4"><ImagePlus className="text-[#D6A34A]" /><h2 className="text-xl font-bold text-[#4A2F1B]">Tambah Media</h2></div><UploadMediaForm propertyId={property.id} /></div></div>
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20 min-h-full">
            <h2 className="text-xl font-bold text-[#4A2F1B] mb-6">Media Tersimpan</h2>
            {mediaFiles.length === 0 ? <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300"><p className="text-gray-500">Belum ada media yang diunggah.</p></div> : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaFiles.map((media) => (
                  <div key={media.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[4/3]">
                    {media.file_type === "audio_private" ? <div className="w-full h-full flex flex-col items-center justify-center bg-[#FFF7E8] text-[#4A2F1B]"><Music size={32} className="mb-2 text-[#D6A34A]" /><span className="text-xs text-center px-2 truncate w-full font-bold">{media.file_name}</span></div> : <img src={`/api/media/${media.id}`} alt={media.file_name} className="w-full h-full object-cover" />}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      {media.file_type === "cover_public" && <Badge icon={<Globe size={10} />} text="Publik" color="green" />}
                      {media.file_type === "intro_planet_public" && <Badge icon={<Sparkles size={10} />} text="Planet" color="blue" />}
                      {["gallery_private", "panorama_private", "audio_private"].includes(media.file_type) && <Badge icon={<Lock size={10} />} text="Privat" color="red" />}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <ActionForm action={deleteMediaAction} confirmMessage="Hapus media ini secara permanen?">
                        <input type="hidden" name="mediaId" value={media.id} /><input type="hidden" name="propertyId" value={property.id} /><input type="hidden" name="fileName" value={media.file_name} />
                        <button type="submit" className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg"><Trash2 size={20} /></button>
                      </ActionForm>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15]";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="block text-sm font-medium mb-1 text-[#281C15]">{label}</label>{children}</div>; }
function MiniNumber({ label, name, value }: { label: string; name: string; value: number }) { return <div><label className="block text-xs font-bold mb-1 text-gray-500">{label}</label><input type="number" min="0" name={name} defaultValue={value} className={inputClass} /></div>; }
function Badge({ icon, text, color }: { icon: React.ReactNode; text: string; color: "green" | "blue" | "red" }) { const cls = color === "green" ? "bg-green-500/90" : color === "blue" ? "bg-blue-500/90" : "bg-red-500/90"; return <span className={`${cls} backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm`}>{icon} {text}</span>; }
