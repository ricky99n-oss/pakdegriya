// 1. Gunakan jalur relatif agar 100% terbaca
import { db } from "../../../../db";
import { properties, propertyMedia } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Lock, Globe, Save, Trash2, Music, Sparkles } from "lucide-react";
import { uploadMediaAction, togglePublishStatus, updatePropertyAction, deleteMediaAction } from "./actions";

// Trik kompatibilitas aman untuk membaca params tanpa crash
export default async function KelolaMediaProperti(props: { params: Promise<{ id: string }> | { id: string } }) {
  // Secara cerdas membaca params terlepas dari versi Next.js-nya
  const resolvedParams = await Promise.resolve(props.params);
  const id = resolvedParams.id;

  const propertyRecord = await db.select().from(properties).where(eq(properties.id, id));
  if (propertyRecord.length === 0) redirect("/admin/properti");
  const property = propertyRecord[0];

  const mediaList = await db.select().from(propertyMedia).where(eq(propertyMedia.propertyId, id));

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/properti" className="p-2 bg-white rounded-xl shadow-sm border border-[#D6A34A]/20 hover:bg-[#FFF7E8] transition-colors">
            <ArrowLeft size={24} className="text-[#4A2F1B]" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-[#281C15] flex items-center gap-3">
              Edit Properti
              <span className={`text-xs px-2 py-1 rounded-md uppercase tracking-wider font-bold ${property.publishStatus === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                {property.publishStatus}
              </span>
            </h1>
            <p className="text-[#4A2F1B]/70 font-mono text-sm mt-1">{property.code}</p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <Link 
            href={`/admin/properti/${property.id}/tour`} 
            className="px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-[#4A2F1B] text-[#D6A34A] hover:bg-[#281C15] border border-[#D6A34A]/50 flex items-center gap-2 text-sm"
          >
            Buka Editor Tur 360°
          </Link>

          <form action={togglePublishStatus}>
            <input type="hidden" name="propertyId" value={property.id} />
            <input type="hidden" name="currentStatus" value={property.publishStatus} />
            <button type="submit" className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm ${property.publishStatus === 'published' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-[#25D366] text-white hover:bg-[#20ba59]'}`}>
              {property.publishStatus === 'published' ? 'Kembalikan ke Draft' : 'Terbitkan ke Publik'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20">
        <h2 className="text-xl font-bold text-[#4A2F1B] mb-6 border-b border-gray-100 pb-4">Detail Informasi</h2>
        <form action={updatePropertyAction} className="space-y-4">
          <input type="hidden" name="propertyId" value={property.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#281C15]">Judul Iklan</label>
              <input type="text" name="title" defaultValue={property.title} required className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#281C15]">Slug URL</label>
              <input type="text" name="slug" defaultValue={property.slug} required className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#281C15]">Harga (Angka)</label>
              <input type="number" name="price" defaultValue={property.price} required className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#281C15]">Lokasi Umum</label>
              <input type="text" name="generalLocation" defaultValue={property.generalLocation} required className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#281C15]">Tipe Transaksi</label>
              <select name="transactionType" defaultValue={property.transactionType} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-white text-[#281C15]">
                <option value="jual">Jual</option>
                <option value="sewa_bulan">Sewa (Bulanan)</option>
                <option value="sewa_tahun">Sewa (Tahunan)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#281C15]">Jenis Properti</label>
              <select name="propertyType" defaultValue={property.propertyType} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-white text-[#281C15]">
                <option value="rumah">Rumah</option>
                <option value="tanah">Tanah</option>
                <option value="villa">Villa</option>
                <option value="ruko">Ruko</option>
                <option value="apartemen">Apartemen</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#281C15]">Ringkasan Properti (Publik)</label>
            <textarea name="publicSummary" defaultValue={property.publicSummary || ""} rows={4} className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15]"></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="flex items-center gap-2 bg-[#D6A34A] text-[#281C15] font-bold py-2.5 px-6 rounded-xl hover:bg-[#c2913b] transition-all shadow-md">
              <Save size={18} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20">
            <div className="flex items-center gap-2 mb-4">
              <ImagePlus className="text-[#D6A34A]" />
              <h2 className="text-xl font-bold text-[#4A2F1B]">Tambah Media</h2>
            </div>
            
            <form action={uploadMediaAction} className="space-y-4">
              <input type="hidden" name="propertyId" value={property.id} />
              <div>
                <label className="block text-sm font-medium mb-1 text-[#281C15]">Jenis Media</label>
                <select name="fileType" className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-white text-[#281C15] font-medium shadow-sm">
                  <option value="cover_public">Cover Publik (Dilihat Semua Orang)</option>
                  <option value="gallery_private">Galeri Detail (Khusus Member)</option>
                  <option value="panorama_private">Panorama 360 (Khusus Member)</option>
                  <option value="audio_private">Audio MP3/WAV (Voice Over/Musik)</option>
                  <option value="intro_planet_public">Gambar Intro Little Planet (Publik)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#281C15]">Pilih File</label>
                <input type="file" name="file" accept="image/jpeg, image/png, image/webp, audio/mpeg, audio/wav" required className="w-full border p-2 rounded-lg bg-white text-[#281C15] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFF7E8] file:text-[#4A2F1B] hover:file:bg-[#D6A34A] hover:file:text-white transition-all cursor-pointer shadow-sm" />
              </div>
              <button type="submit" className="w-full bg-[#4A2F1B] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#281C15] transition-all shadow-md mt-4">
                Unggah File
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D6A34A]/20 min-h-full">
            <h2 className="text-xl font-bold text-[#4A2F1B] mb-6">Media Tersimpan</h2>
            
            {mediaList.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">Belum ada media yang diunggah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaList.map((media) => (
                  <div key={media.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[4/3]">
                    
                    {media.fileType === "audio_private" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#FFF7E8] text-[#4A2F1B]">
                        <Music size={32} className="mb-2 text-[#D6A34A]" />
                        <span className="text-xs text-center px-2 truncate w-full font-bold">{media.fileName}</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/media/${media.id}`} alt={media.fileName} className="w-full h-full object-cover" />
                    )}
                    
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      {media.fileType === "cover_public" && (
                        <span className="bg-green-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"><Globe size={10} /> Publik</span>
                      )}
                      {media.fileType === "intro_planet_public" && (
                        <span className="bg-blue-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"><Sparkles size={10} /> Planet</span>
                      )}
                      {(media.fileType === "gallery_private" || media.fileType === "panorama_private" || media.fileType === "audio_private") && (
                        <span className="bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"><Lock size={10} /> Privat</span>
                      )}
                    </div>

                    <form action={deleteMediaAction} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <input type="hidden" name="mediaId" value={media.id} />
                      <input type="hidden" name="propertyId" value={property.id} />
                      <input type="hidden" name="fileName" value={media.fileName} />
                      <button type="submit" className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all">
                        <Trash2 size={20} />
                      </button>
                    </form>
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