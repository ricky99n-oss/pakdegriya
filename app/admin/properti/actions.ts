"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
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

export async function togglePublishStatus(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") || "");
    const currentStatus = String(formData.get("currentStatus") || "draft");
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const { error } = await getSupabase().from("properties").update({ publish_status: newStatus }).eq("id", propertyId);
    if (error) throw error;
    revalidateProperty(propertyId);
    return actionSuccess(newStatus === "published" ? "Properti berhasil diterbitkan." : "Properti dikembalikan ke draft.");
  } catch (error) {
    console.error("togglePublishStatus:", error);
    return actionError(adminActionErrorMessage(error));
  }
}

export async function updatePropertyAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") || "");
    const title = String(formData.get("title") || "").trim();
    const slug = String(formData.get("slug") || "").trim().toLowerCase();
    const price = Number(formData.get("price"));
    if (!propertyId || !title || !slug || !Number.isFinite(price)) return actionError("Data properti tidak valid.");

    const { error } = await getSupabase().from("properties").update({
      title,
      slug,
      price,
      general_location: String(formData.get("generalLocation") || "").trim(),
      public_summary: String(formData.get("publicSummary") || "").slice(0, 5000),
      transaction_type: String(formData.get("transactionType") || ""),
      property_type: String(formData.get("propertyType") || ""),
      bedrooms: Math.max(0, Number(formData.get("bedrooms") || 0)),
      bathrooms: Math.max(0, Number(formData.get("bathrooms") || 0)),
      land_area: Math.max(0, Number(formData.get("landArea") || 0)),
      building_area: Math.max(0, Number(formData.get("buildingArea") || 0)),
      updated_at: new Date().toISOString(),
    }).eq("id", propertyId);
    if (error) throw error;
    revalidateProperty(propertyId);
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
