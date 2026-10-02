"use server";

import { readPropertyFlags, isMissingPropertyFlags, propertyFlagsSetupMessage } from "@/lib/property-flags";
import { revalidatePath } from "next/cache";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, adminActionErrorMessage } from "@/lib/admin-auth";
import { actionError, actionSuccess, type AdminActionResult } from "@/lib/admin-action";

function revalidateProperty(propertyId?: string) {
  revalidatePath("/");
  revalidatePath("/admin/properti");
  if (propertyId) revalidatePath(`/admin/properti/${propertyId}`);
}

export async function createProperty(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const code = String(formData.get("code") || "").trim();
    const slug = String(formData.get("slug") || "").trim().toLowerCase();
    const title = String(formData.get("title") || "").trim();
    const price = Number(formData.get("price"));
    const transactionType = String(formData.get("transactionType") || "");
    const propertyType = String(formData.get("propertyType") || "");
    const generalLocation = String(formData.get("generalLocation") || "").trim();
    if (!code || !slug || !title || !generalLocation || !Number.isFinite(price)) return actionError("Data properti belum lengkap atau tidak valid.");

    const { error } = await getSupabase().from("properties").insert({
      id: crypto.randomUUID(), code, slug, title, price,
      transaction_type: transactionType, property_type: propertyType,
      general_location: generalLocation, publish_status: "draft", availability_status: "available",
    });
    if (error) throw error;
    revalidateProperty();
    return actionSuccess("Properti berhasil dibuat.", "/admin/properti");
  } catch (error) {
    console.error("createProperty:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function setPropertyPublishStatusAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") || "");
    // Send the desired state explicitly so repeating a request cannot toggle it back.
    const newStatus = String(formData.get("publishStatus") || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)
      || !["draft", "published"].includes(newStatus)) {
      return actionError("ID properti atau status publikasi tidak valid.");
    }
    // Lucia admin sessions do not authenticate the anonymous Supabase client.
    // Check the admin first, then confirm that the privileged update changed a row.
    const { data, error } = await getSupabaseAdmin().from("properties").update({
      publish_status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", propertyId).select("id").maybeSingle();
    if (error) {
      console.error("setPropertyPublishStatusAction database:", error);
      return actionError("Status publikasi gagal disimpan ke database. Silakan coba lagi.");
    }
    if (!data) return actionError("Properti tidak ditemukan atau sudah dihapus. Muat ulang daftar properti.");
    try {
      revalidateProperty(propertyId);
      revalidatePath("/admin/dashboard");
      revalidatePath("/properti/[slug]", "layout");
    } catch (error) {
      console.error("Publish status saved, but cache revalidation failed:", error);
      return actionSuccess("Status publikasi tersimpan. Muat ulang halaman untuk melihat data terbaru.");
    }
    return actionSuccess(newStatus === "published" ? "Properti berhasil diterbitkan." : "Properti dikembalikan ke draft.");
  } catch (error) {
    console.error("setPropertyPublishStatusAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function updatePropertyAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") || "");
    const title = String(formData.get("title") || "").trim();
    const slug = String(formData.get("slug") || "").trim().toLowerCase();
    const flags = readPropertyFlags(formData);
    const rawPrice = String(formData.get("price") ?? "").trim();
    const price = Number(rawPrice);
    const generalLocation = String(formData.get("generalLocation") || "").trim();
    const transactionType = String(formData.get("transactionType") || "");
    const propertyType = String(formData.get("propertyType") || "");
    const bedrooms = Number(formData.get("bedrooms") || 0);
    const bathrooms = Number(formData.get("bathrooms") || 0);
    const landArea = Number(formData.get("landArea") || 0);
    const buildingArea = Number(formData.get("buildingArea") || 0);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)
      || !title || title.length > 255 || !slug || slug.length > 255
      || !generalLocation || generalLocation.length > 255) return actionError("Data properti tidak valid.");
    if (!rawPrice || !Number.isFinite(price) || price < 0 || price > Number.MAX_SAFE_INTEGER) {
      return actionError("Harga harus berupa angka yang valid dan tidak boleh negatif.");
    }
    if (!["jual", "sewa_bulan", "sewa_tahun"].includes(transactionType)
      || !["rumah", "tanah", "villa", "ruko", "apartemen"].includes(propertyType)) {
      return actionError("Tipe transaksi atau jenis properti tidak valid.");
    }
    if (![bedrooms, bathrooms].every((value) => Number.isInteger(value) && value >= 0 && value <= 2147483647)
      || ![landArea, buildingArea].every((value) => Number.isFinite(value) && value >= 0)) {
      return actionError("Jumlah kamar dan luas properti harus berupa angka yang valid dan tidak boleh negatif.");
    }

    // Only use the privileged client after requireAdmin. The anonymous client
    // can be blocked by RLS or report success while updating zero rows.
    const { data, error } = await getSupabaseAdmin().from("properties").update({
      ...flags,
      title,
      slug,
      price,
      general_location: generalLocation,
      public_summary: String(formData.get("publicSummary") || "").slice(0, 5000),
      transaction_type: transactionType,
      property_type: propertyType,
      bedrooms,
      bathrooms,
      land_area: landArea,
      building_area: buildingArea,
      updated_at: new Date().toISOString(),
    }).eq("id", propertyId).select("id").maybeSingle();
    if (error) {
      console.error("updatePropertyAction database:", error);
      if (isMissingPropertyFlags(error)) return actionError(propertyFlagsSetupMessage);
      return actionError(error.code === "23505"
        ? "Slug URL sudah digunakan properti lain. Gunakan slug yang berbeda."
        : "Perubahan properti gagal disimpan ke database. Silakan coba lagi.");
    }
    if (!data) return actionError("Properti tidak ditemukan atau sudah dihapus. Muat ulang daftar properti.");
    try {
      revalidateProperty(propertyId);
      revalidatePath("/properti/[slug]", "page");
    } catch (error) {
      // A cache failure must not turn an already committed save into a failure.
      console.error("Property saved, but cache revalidation failed:", error);
      return actionSuccess("Perubahan tersimpan. Muat ulang halaman untuk melihat data terbaru.");
    }
    return actionSuccess("Perubahan properti berhasil disimpan.");
  } catch (error) {
    console.error("updatePropertyAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function hapusPropertiAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") || "");
    if (!propertyId) return actionError("ID properti tidak valid.");
    const supabase = getSupabase();

    // Relasi scenes / hotspots menggunakan ON DELETE CASCADE. Media dihapus eksplisit
    // agar constraint lama yang belum cascade tetap aman.
    const { error: mediaError } = await supabase.from("property_media").delete().eq("property_id", propertyId);
    if (mediaError) throw mediaError;
    const { error } = await supabase.from("properties").delete().eq("id", propertyId);
    if (error) throw error;

    revalidateProperty();
    return actionSuccess("Properti berhasil dihapus.");
  } catch (error) {
    console.error("hapusPropertiAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}
