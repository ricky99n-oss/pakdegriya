"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin, adminActionErrorMessage } from "@/lib/admin-auth";
import { actionError, actionSuccess, type AdminActionResult } from "@/lib/admin-action";

export async function createPropertyAction(formData: FormData): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const code = String(formData.get("code") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const slug = String(formData.get("slug") || "").trim().toLowerCase();
    const price = Number(formData.get("price"));
    const generalLocation = String(formData.get("generalLocation") || "").trim();
    const transactionType = String(formData.get("transactionType") || "");
    const propertyType = String(formData.get("propertyType") || "");

    if (!title || !slug || !code || !generalLocation || !Number.isFinite(price) || price < 0) {
      return actionError("Kode, judul, slug, lokasi, dan harga wajib valid.");
    }

    const { error } = await getSupabase().from("properties").insert({
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
