"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { requireAdmin, adminActionErrorMessage } from "@/lib/admin-auth";
import { actionError, actionSuccess, type AdminActionResult } from "@/lib/admin-action";

const FILE_RULES: Record<string, { prefixes: string[]; maxBytes: number; defaultPublic: boolean }> = {
  cover_public: { prefixes: ["image/"], maxBytes: 15 * 1024 * 1024, defaultPublic: true },
  gallery_private: { prefixes: ["image/"], maxBytes: 15 * 1024 * 1024, defaultPublic: false },
  floorplan_private: { prefixes: ["image/", "application/pdf"], maxBytes: 20 * 1024 * 1024, defaultPublic: false },
  panorama_private: { prefixes: ["image/"], maxBytes: 45 * 1024 * 1024, defaultPublic: false },
  intro_planet_public: { prefixes: ["image/"], maxBytes: 15 * 1024 * 1024, defaultPublic: true },
  audio_private: { prefixes: ["audio/"], maxBytes: 20 * 1024 * 1024, defaultPublic: false },
};

function validMime(file: File, prefixes: string[]) {
  return prefixes.some((prefix) => (prefix.endsWith("/") ? file.type.startsWith(prefix) : file.type === prefix));
}

function revalidatePropertyMedia(propertyId: string) {
  revalidatePath(`/admin/properti/${propertyId}`);
  revalidatePath(`/admin/properti/${propertyId}/tour`);
  revalidatePath("/");
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

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const fileId = crypto.randomUUID();
      const safeExt = (file.name.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] || "").toLowerCase();
      const finalFileName = `${fileId}${safeExt}`;
      let previewFileName: string | null = null;

      const previewEntry = formData.get(`preview_${index}`);
      const preview = previewEntry instanceof File && previewEntry.size > 0 ? previewEntry : null;
      if (preview) {
        if (!preview.type.startsWith("image/") || preview.size > 3 * 1024 * 1024) {
          return actionError(`Preview untuk ${file.name} tidak valid.`);
        }
        previewFileName = `${fileId}-preview.jpg`;
      }

      await bucket.put(finalFileName, file.stream(), {
        httpMetadata: { contentType: file.type || "application/octet-stream" },
        customMetadata: { propertyId, fileType },
      });

      if (preview && previewFileName) {
        await bucket.put(previewFileName, preview.stream(), {
          httpMetadata: { contentType: "image/jpeg" },
          customMetadata: { propertyId, fileType, variant: "preview" },
        });
      }

      const { error: dbError } = await supabase.from("property_media").insert({
        id: fileId,
        property_id: propertyId,
        file_type: fileType,
        file_name: finalFileName,
        preview_file_name: previewFileName,
        mime_type: file.type || "application/octet-stream",
        is_public: rule.defaultPublic,
      });

      if (dbError) {
        await bucket.delete(finalFileName);
        if (previewFileName) await bucket.delete(previewFileName);
        throw dbError;
      }
    }

    revalidatePropertyMedia(propertyId);
    return actionSuccess(`${files.length} media berhasil diunggah.`);
  } catch (error) {
    console.error("uploadMediaAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function updateMediaVisibilityAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const mediaId = String(formData.get("mediaId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const makePublic = String(formData.get("makePublic") || "") === "true";
    if (!mediaId || !propertyId) return actionError("Data media tidak valid.");

    const { error } = await getSupabase()
      .from("property_media")
      .update({ is_public: makePublic })
      .eq("id", mediaId)
      .eq("property_id", propertyId);
    if (error) throw error;

    revalidatePropertyMedia(propertyId);
    return actionSuccess(makePublic ? "Media sekarang dapat diakses publik." : "Media sekarang hanya dapat diakses member yang login.");
  } catch (error) {
    console.error("updateMediaVisibilityAction:", error);
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
    const { data: record } = await supabase
      .from("property_media")
      .select("preview_file_name")
      .eq("id", mediaId)
      .eq("property_id", propertyId)
      .limit(1)
      .maybeSingle();

    const { error: dbError } = await supabase
      .from("property_media")
      .delete()
      .eq("id", mediaId)
      .eq("property_id", propertyId);
    if (dbError) throw dbError;

    try {
      const env = getRequestContext().env as any;
      if (env.R2_MEDIA_BUCKET) {
        await env.R2_MEDIA_BUCKET.delete(fileName);
        if (record?.preview_file_name) await env.R2_MEDIA_BUCKET.delete(record.preview_file_name);
      }
    } catch (r2Error) {
      console.error("R2 cleanup gagal setelah metadata dihapus:", r2Error);
    }

    revalidatePropertyMedia(propertyId);
    return actionSuccess("Media berhasil dihapus.");
  } catch (error) {
    console.error("deleteMediaAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}
