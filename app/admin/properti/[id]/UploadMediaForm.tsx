"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadMediaAction } from "./actions";
import { CheckCircle2, UploadCloud, XCircle } from "lucide-react";

async function createPanoramaPreview(file: File) {
  if (!file.type.startsWith("image/")) return null;

  try {
    const bitmap = await createImageBitmap(file);
    const maxWidth = 2048;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      bitmap.close();
      return null;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.68));
    if (!blob) return null;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-preview.jpg`, { type: "image/jpeg" });
  } catch (error) {
    console.warn("Preview panorama gagal dibuat, upload master tetap dilanjutkan:", error);
    return null;
  }
}

export default function UploadMediaForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stage, setStage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData(form);
      const fileType = String(formData.get("fileType") || "");
      const files = formData.getAll("file").filter((item): item is File => item instanceof File && item.size > 0);

      if (fileType === "panorama_private") {
        setStage("Membuat preview 360° ringan...");
        for (let index = 0; index < files.length; index += 1) {
          const preview = await createPanoramaPreview(files[index]);
          if (preview) formData.set(`preview_${index}`, preview);
        }
      }

      setStage("Mengunggah ke Cloudflare R2...");
      const result = await uploadMediaAction(formData);
      if (!result.success) {
        setMessage({ type: "error", text: result.error || "Upload gagal." });
        return;
      }

      form.reset();
      setMessage({ type: "success", text: result.message || "Media berhasil diunggah." });
      router.refresh();
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({ type: "error", text: "Koneksi ke server terputus. Silakan coba lagi." });
    } finally {
      setStage("");
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
          <option value="floorplan_private">Denah / Floorplan</option>
          <option value="audio_private">Audio/Musik Latar (.mp3)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[#281C15]">Pilih File</label>
        <input type="file" name="file" multiple required className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#D6A34A]/10 file:text-[#4A2F1B] hover:file:bg-[#D6A34A]/20" />
        <p className="text-[10px] leading-relaxed text-gray-400 mt-2">Untuk panorama, browser otomatis membuat preview 2048px yang lebih ringan. File master tetap disimpan untuk kualitas penuh.</p>
      </div>

      <button type="submit" disabled={isUploading} className="w-full flex justify-center items-center gap-2 bg-[#4A2F1B] text-[#D6A34A] font-bold py-3 rounded-xl hover:bg-[#281C15] transition-all disabled:opacity-50">
        <UploadCloud size={20} /> {isUploading ? (stage || "Memproses...") : "Unggah Media"}
      </button>
    </form>
  );
}
