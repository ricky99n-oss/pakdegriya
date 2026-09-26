"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { requireAdmin, adminActionErrorMessage } from "@/lib/admin-auth";
import { actionError, actionSuccess, type AdminActionResult } from "@/lib/admin-action";

const FILE_RULES: Record<string, { prefixes: string[]; maxBytes: number }> = {
  cover_public: { prefixes: ["image/"], maxBytes: 15 * 1024 * 1024 },
  gallery_private: { prefixes: ["image/"], maxBytes: 15 * 1024 * 1024 },
  floorplan_private: { prefixes: ["image/", "application/pdf"], maxBytes: 20 * 1024 * 1024 },
  panorama_private: { prefixes: ["image/"], maxBytes: 45 * 1024 * 1024 },
  intro_planet_public: { prefixes: ["image/"], maxBytes: 15 * 1024 * 1024 },
  audio_private: { prefixes: ["audio/"], maxBytes: 20 * 1024 * 1024 },
};

function validMime(file: File, prefixes: string[]) {
  return prefixes.some((prefix) => prefix.endsWith("/") ? file.type.startsWith(prefix) : file.type === prefix);
}

export async function uploadMediaAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") || "");
    const fileType = String(formData.get("fileType") || "");
    const files = formData.getAll("file").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const rule = FILE_RULES[fileType];
    if (!propertyId || !rule || files.length === 0) return actionError("File atau kategori media tidak valid.");
    if (files.length > 10) return actionError("Maksimal 10 file per sekali unggah.");

    for (const file of files) {
      if (!validMime(file, rule.prefixes)) return actionError(`Tipe file ${file.name} tidak diizinkan untuk kategori ini.`);
      if (file.size > rule.maxBytes) return actionError(`${file.name} terlalu besar. Maksimal ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`);
    }

    const env = getRequestContext().env as any;
    const bucket = env.R2_MEDIA_BUCKET;
    if (!bucket) return actionError("R2 Storage belum dikonfigurasi di Cloudflare.");
    const supabase = getSupabase();

    for (const file of files) {
      const fileId = crypto.randomUUID();
      const safeExt = (file.name.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] || "").toLowerCase();
      const finalFileName = `${fileId}${safeExt}`;
      await bucket.put(finalFileName, file.stream(), {
        httpMetadata: { contentType: file.type || "application/octet-stream" },
        customMetadata: { propertyId, fileType },
      });

      const { error: dbError } = await supabase.from("property_media").insert({
        id: fileId,
        property_id: propertyId,
        file_type: fileType,
        file_name: finalFileName,
        mime_type: file.type || "application/octet-stream",
      });
      if (dbError) {
        await bucket.delete(finalFileName);
        throw dbError;
      }
    }

    revalidatePath(`/admin/properti/${propertyId}`);
    return actionSuccess(`${files.length} media berhasil diunggah.`);
  } catch (error) {
    console.error("uploadMediaAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function deleteMediaAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const mediaId = String(formData.get("mediaId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const fileName = String(formData.get("fileName") || "");
    if (!mediaId || !propertyId || !fileName) return actionError("Data media tidak valid.");

    const supabase = getSupabase();
    const { error: dbError } = await supabase.from("property_media").delete().eq("id", mediaId).eq("property_id", propertyId);
    if (dbError) throw dbError;

    try {
      const env = getRequestContext().env as any;
      if (env.R2_MEDIA_BUCKET) await env.R2_MEDIA_BUCKET.delete(fileName);
    } catch (r2Error) {
      console.error("R2 cleanup gagal setelah metadata dihapus:", r2Error);
    }

    revalidatePath(`/admin/properti/${propertyId}`);
    revalidatePath("/");
    return actionSuccess("Media berhasil dihapus.");
  } catch (error) {
    console.error("deleteMediaAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}
