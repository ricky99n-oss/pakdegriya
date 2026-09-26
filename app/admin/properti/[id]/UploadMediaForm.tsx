"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadMediaAction } from "./actions";
import { CheckCircle2, UploadCloud, XCircle } from "lucide-react";

export default function UploadMediaForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);
    setMessage(null);
    try {
      const result = await uploadMediaAction(new FormData(event.currentTarget));
      if (!result.success) {
        setMessage({ type: "error", text: result.error || "Upload gagal." });
        return;
      }
      event.currentTarget.reset();
      setMessage({ type: "success", text: result.message || "Media berhasil diunggah." });
      router.refresh();
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({ type: "error", text: "Koneksi ke server terputus. Silakan coba lagi." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`p-3 text-sm rounded-lg border font-bold flex items-start gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
          {message.type === "success" ? <CheckCircle2 size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
          {message.text}
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
        <input type="file" name="file" multiple required className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#D6A34A]/10 file:text-[#4A2F1B] hover:file:bg-[#D6A34A]/20" />
      </div>
      <button type="submit" disabled={isUploading} className="w-full flex justify-center items-center gap-2 bg-[#4A2F1B] text-[#D6A34A] font-bold py-3 rounded-xl hover:bg-[#281C15] transition-all disabled:opacity-50">
        <UploadCloud size={20} /> {isUploading ? "Mengunggah... Mohon Tunggu" : "Unggah Media"}
      </button>
    </form>
  );
}
