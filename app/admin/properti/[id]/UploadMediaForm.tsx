"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, UploadCloud, XCircle } from "lucide-react";

const MAX_BYTES: Record<string, number> = {
  cover_public: 15 * 1024 * 1024,
  gallery_private: 15 * 1024 * 1024,
  floorplan_private: 20 * 1024 * 1024,
  panorama_private: 45 * 1024 * 1024,
  intro_planet_public: 15 * 1024 * 1024,
  audio_private: 20 * 1024 * 1024,
};

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

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.68)
    );
    if (!blob) return null;

    return new File(
      [blob],
      `${file.name.replace(/\.[^.]+$/, "")}-preview.jpg`,
      { type: "image/jpeg" }
    );
  } catch (error) {
    console.warn("Preview panorama gagal dibuat, master tetap dapat diunggah:", error);
    return null;
  }
}

async function uploadBinary(input: {
  propertyId: string;
  fileType: string;
  fileId: string;
  file: File;
  variant: "preview" | "master";
  previewUploaded?: boolean;
}) {
  const params = new URLSearchParams({
    propertyId: input.propertyId,
    fileType: input.fileType,
    fileId: input.fileId,
    variant: input.variant,
    originalName: input.file.name,
    previewUploaded: input.previewUploaded ? "1" : "0",
  });

  const response = await fetch(`/api/admin/media/upload?${params.toString()}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": input.file.type || "application/octet-stream",
      "X-File-Size": String(input.file.size),
    },
    body: input.file,
  });

  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; error?: string }
    | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Upload gagal dengan status ${response.status}.`);
  }
}

export default function UploadMediaForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [stage, setStage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isUploading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fileType = String(formData.get("fileType") || "");
    const files = formData
      .getAll("file")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (!fileType || files.length === 0) {
      setMessage({ type: "error", text: "Pilih kategori dan file terlebih dahulu." });
      return;
    }
    if (files.length > 10) {
      setMessage({ type: "error", text: "Maksimal 10 file per sekali unggah." });
      return;
    }

    const maxBytes = MAX_BYTES[fileType];
    if (!maxBytes) {
      setMessage({ type: "error", text: "Kategori media tidak valid." });
      return;
    }

    const oversized = files.find((file) => file.size > maxBytes);
    if (oversized) {
      setMessage({
        type: "error",
        text: `${oversized.name} terlalu besar. Maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`,
      });
      return;
    }

    setIsUploading(true);
    setMessage(null);
    let completed = 0;

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const fileId = crypto.randomUUID();
        let previewUploaded = false;

        if (fileType === "panorama_private") {
          setStage(`Membuat preview 360° ${index + 1}/${files.length}...`);
          const preview = await createPanoramaPreview(file);

          if (preview) {
            setStage(`Mengunggah preview ${index + 1}/${files.length}...`);
            try {
              await uploadBinary({
                propertyId,
                fileType,
                fileId,
                file: preview,
                variant: "preview",
              });
              previewUploaded = true;
            } catch (previewError) {
              console.warn("Preview gagal diunggah, master tetap dilanjutkan:", previewError);
            }
          }
        }

        setStage(`Mengunggah file ${index + 1}/${files.length} ke R2...`);
        await uploadBinary({
          propertyId,
          fileType,
          fileId,
          file,
          variant: "master",
          previewUploaded,
        });

        completed += 1;
      }

      form.reset();
      setMessage({
        type: "success",
        text: `${completed} media berhasil diunggah.`,
      });
      router.refresh();
    } catch (error) {
      console.error("Upload failed:", error);
      const reason = error instanceof Error ? error.message : "Upload gagal.";
      setMessage({
        type: "error",
        text:
          completed > 0
            ? `${completed} file berhasil, lalu upload berhenti: ${reason}`
            : reason,
      });
    } finally {
      setStage("");
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`p-3 text-sm rounded-lg border font-bold flex items-start gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} className="shrink-0" />
          ) : (
            <XCircle size={18} className="shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 text-[#281C15]">
          Kategori Media
        </label>
        <select
          name="fileType"
          className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15]"
        >
          <option value="gallery_private">Foto Galeri (Biasa)</option>
          <option value="panorama_private">Foto Panorama 360°</option>
          <option value="cover_public">Foto Cover Utama</option>
          <option value="intro_planet_public">Foto Little Planet</option>
          <option value="floorplan_private">Denah / Floorplan</option>
          <option value="audio_private">Audio/Musik Latar (.mp3)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[#281C15]">
          Pilih File
        </label>
        <input
          type="file"
          name="file"
          multiple
          required
          className="w-full border p-2.5 rounded-lg focus:outline-none focus:border-[#D6A34A] bg-gray-50 text-[#281C15] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#D6A34A]/10 file:text-[#4A2F1B] hover:file:bg-[#D6A34A]/20"
        />
        <p className="text-[10px] leading-relaxed text-gray-400 mt-2">
          File dikirim langsung secara streaming ke Cloudflare R2 agar panorama besar tidak memenuhi memori Worker. Panorama otomatis dibuatkan preview 2048px di browser.
        </p>
      </div>

      <button
        type="submit"
        disabled={isUploading}
        className="w-full flex justify-center items-center gap-2 bg-[#4A2F1B] text-[#D6A34A] font-bold py-3 rounded-xl hover:bg-[#281C15] transition-all disabled:opacity-50"
      >
        <UploadCloud size={20} /> {isUploading ? stage || "Memproses..." : "Unggah Media"}
      </button>
    </form>
  );
}
