"use client";

import { useFormStatus } from "react-dom";
import { uploadMediaAction } from "./actions";
import { Loader2 } from "lucide-react";

// Komponen tombol cerdas yang bisa mendeteksi saat file sedang dikirim
function TombolUnggah() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className={`w-full font-bold py-3 px-4 rounded-xl shadow-md mt-4 flex items-center justify-center gap-2 transition-all ${
        pending 
          ? "bg-gray-400 text-white cursor-wait" 
          : "bg-[#4A2F1B] text-white hover:bg-[#281C15]"
      }`}
    >
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin" /> Sedang Mengunggah...
        </>
      ) : (
        "Unggah File"
      )}
    </button>
  );
}

export default function UploadMediaForm({ propertyId }: { propertyId: string }) {
  return (
    <form action={uploadMediaAction} encType="multipart/form-data" className="space-y-4">
      <input type="hidden" name="propertyId" value={propertyId} />
      
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
        <input 
          type="file" 
          name="file" 
          accept="image/jpeg, image/png, image/webp, audio/mpeg, audio/wav" 
          required 
          className="w-full border p-2 rounded-lg bg-white text-[#281C15] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFF7E8] file:text-[#4A2F1B] hover:file:bg-[#D6A34A] hover:file:text-white transition-all cursor-pointer shadow-sm" 
        />
      </div>

      <TombolUnggah />
    </form>
  );
}