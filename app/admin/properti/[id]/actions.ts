"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, adminActionErrorMessage } from "@/lib/admin-auth";
import { actionError, actionSuccess, type AdminActionResult } from "@/lib/admin-action";

function revalidatePropertyMedia(propertyId: string) {
  revalidatePath(`/admin/properti/${propertyId}`);
  revalidatePath(`/admin/properti/${propertyId}/tour`);
  revalidatePath("/");
}

export async function updateMediaVisibilityAction(
  formData: FormData
): Promise<AdminActionResult> {
  try {
    await requireAdmin();

    const mediaId = String(formData.get("mediaId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    const makePublic = String(formData.get("makePublic") || "") === "true";

    if (!mediaId || !propertyId) return actionError("Data media tidak valid.");

    const { data, error } = await getSupabaseAdmin()
      .from("property_media")
      .update({ is_public: makePublic })
      .eq("id", mediaId)
      .eq("property_id", propertyId)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(`Status media gagal diperbarui: ${error.message}`);
    if (!data) return actionError("Media tidak ditemukan.");

    revalidatePropertyMedia(propertyId);
    return actionSuccess(
      makePublic
        ? "Media sekarang dapat diakses publik."
        : "Media sekarang hanya dapat diakses member yang login."
    );
  } catch (error) {
    console.error("updateMediaVisibilityAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function deleteMediaAction(
  formData: FormData
): Promise<AdminActionResult> {
  try {
    await requireAdmin();

    const mediaId = String(formData.get("mediaId") || "");
    const propertyId = String(formData.get("propertyId") || "");
    if (!mediaId || !propertyId) return actionError("Data media tidak valid.");

    const admin = getSupabaseAdmin();
    const { data: record, error: lookupError } = await admin
      .from("property_media")
      .select("id,file_name,preview_file_name")
      .eq("id", mediaId)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (lookupError) throw new Error(`Media gagal dibaca: ${lookupError.message}`);
    if (!record) return actionError("Media tidak ditemukan atau sudah dihapus.");

    const { error: dbError } = await admin
      .from("property_media")
      .delete()
      .eq("id", mediaId)
      .eq("property_id", propertyId);

    if (dbError) throw new Error(`Metadata media gagal dihapus: ${dbError.message}`);

    try {
      const env = getRequestContext().env as any;
      const bucket = env.R2_MEDIA_BUCKET;
      if (bucket) {
        await bucket.delete(record.file_name);
        if (record.preview_file_name) await bucket.delete(record.preview_file_name);
      }
    } catch (r2Error) {
      // Metadata sudah hilang sehingga file tidak lagi dapat diakses aplikasi.
      // Log orphan R2 agar dapat dibersihkan kemudian tanpa membuat UI gagal.
      console.error("R2 cleanup gagal setelah metadata dihapus:", r2Error);
    }

    revalidatePropertyMedia(propertyId);
    return actionSuccess("Media berhasil dihapus.");
  } catch (error) {
    console.error("deleteMediaAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}
