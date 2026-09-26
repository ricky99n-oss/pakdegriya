"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export async function createPropertyAction(formData: FormData) {
  const code = formData.get("code") as string;
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const price = Number(formData.get("price"));
  const generalLocation = formData.get("generalLocation") as string;
  const transactionType = formData.get("transactionType") as string;
  const propertyType = formData.get("propertyType") as string;

  // Validasi dasar
  if (!title || !slug || !code) {
    return { error: "Kode, Judul, dan Slug wajib diisi!" };
  }

  try {
    const supabase = getSupabase();

    // Memasukkan data via REST API Supabase (Drizzle dihapus)
    const { error } = await supabase.from("properties").insert({
      id: crypto.randomUUID(),
      code: code.trim(),
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      price: isNaN(price) ? 0 : price,
      general_location: generalLocation.trim(),
      transaction_type: transactionType,
      property_type: propertyType,
      publish_status: "draft", 
      bedrooms: 0,
      bathrooms: 0,
      land_area: 0,
      building_area: 0,
      public_summary: "",
    });

    if (error) throw error;

    // Refresh cache
    revalidatePath("/admin/properti");
    revalidatePath("/");
    
    return { success: true };
    
  } catch (error: any) {
    console.error("Error DB Insert:", error);
    
    // Pukul rata semua error database
    return { 
      error: `Gagal menyimpan! Kode Properti "${code}" atau Slug URL "${slug}" kemungkinan besar SUDAH TERPAKAI di dalam database. Silakan gunakan kode lain.` 
    };
  }
}