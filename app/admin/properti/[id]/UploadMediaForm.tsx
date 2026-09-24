"use client";

import { useState } from "react";
import { uploadMediaAction } from "./actions";
import { UploadCloud } from "lucide-react";

export default function UploadMediaForm({ propertyId }: { propertyId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    
    try {
      // Deklarasi tipe eksplisit agar TypeScript tidak error "never"
      const res = (await uploadMediaAction(formData)) as { error?: string; success?: boolean };
      
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        // Jika sukses, bersihkan form
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan sistem saat menghubungi server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 font-bold">
          {errorMsg}
        </div>
      )}
      
      <input type="hidden" name="propertyId" value={propertyId} />
      
      <div>
        <label className="block text-sm font-medium mb-1 text-[#281C15]">Kategori Media</label>
        <select name="fileType" className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15]">
          <option value="gallery_private">Foto Galeri (Biasa)</option>
          <option value="panorama_private">Foto Panorama 360°</option>
          <option value="cover_public">Foto Cover Utama</option>
          <option value="intro_planet_public">Foto Little Planet</option>
          <option value="audio_private">Audio/Musik Latar (.mp3)</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1 text-[#281C15]">Pilih File</label>
        <input 
          type="file" 
          name="file" 
          multiple 
          required 
          className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#D6A34A]/10 file:text-[#4A2F1B] hover:file:bg-[#D6A34A]/20" 
        />
      </div>

      <button 
        type="submit" 
        disabled={isUploading} 
        className="w-full flex justify-center items-center gap-2 bg-[#4A2F1B] text-[#D6A34A] font-bold py-3 rounded-xl hover:bg-[#281C15] transition-all disabled:opacity-50"
      >
        <UploadCloud size={20} />
        {isUploading ? "Mengunggah... Mohon Tunggu" : "Unggah Media"}
      </button>
    </form>
  );
}