"use server";

import { readPropertyFlags, isMissingPropertyFlags, propertyFlagsSetupMessage } from "@/lib/property-flags";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, adminActionErrorMessage } from "@/lib/admin-auth";
import { actionError, actionSuccess, type AdminActionResult } from "@/lib/admin-action";

export async function createPropertyAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const code = String(formData.get("code") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const slug = String(formData.get("slug") || "").trim().toLowerCase();
    const rawPrice = String(formData.get("price") ?? "").trim();
    const price = Number(rawPrice);
    const flags = readPropertyFlags(formData);
    const generalLocation = String(formData.get("generalLocation") || "").trim();
    const transactionType = String(formData.get("transactionType") || "");
    const propertyType = String(formData.get("propertyType") || "");

    if (!title || !slug || !code || !generalLocation || !rawPrice || !Number.isFinite(price) || price < 0 || price > Number.MAX_SAFE_INTEGER) {
      return actionError("Kode, judul, slug, lokasi, dan harga wajib valid.");
    }

    if (!["jual", "sewa_bulan", "sewa_tahun"].includes(transactionType)
      || !["rumah", "tanah", "villa", "ruko", "apartemen"].includes(propertyType)) return actionError("Tipe transaksi atau properti tidak valid.");

    const { error } = await getSupabaseAdmin().from("properties").insert({
      ...flags,
      id: crypto.randomUUID(),
      code,
      title,
      slug,
      price,
      general_location: generalLocation,
      transaction_type: transactionType,
      property_type: propertyType,
      publish_status: "draft",
      availability_status: "available",
      bedrooms: 0,
      bathrooms: 0,
      land_area: 0,
      building_area: 0,
      public_summary: "",
    });
    if (error) {
      if (isMissingPropertyFlags(error)) return actionError(propertyFlagsSetupMessage);
      if (error.code === "23505") return actionError("Kode properti atau slug URL sudah dipakai. Gunakan nilai lain.");
      throw error;
    }

    revalidatePath("/admin/properti");
    revalidatePath("/");
    return actionSuccess("Properti berhasil dibuat sebagai draft.", "/admin/properti");
  } catch (error) {
    console.error("createPropertyAction:", error);
    return actionError(adminActionErrorMessage(error));
  }
}
