"use server";

import { db } from "@/db";
import { properties } from "@/db/schema";
import { revalidatePath } from "next/cache";

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
    // Memasukkan data ke database Drizzle ORM Postgres
    await db.insert(properties).values({
      // EDGE COMPATIBILITY: Gunakan crypto global, bukan import dari "crypto" Node.js
      id: crypto.randomUUID(),
      code: code.trim(),
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      price: isNaN(price) ? 0 : price,
      generalLocation: generalLocation.trim(),
      transactionType: transactionType as any,
      propertyType: propertyType as any,
      publishStatus: "draft" as any, 
      
      // Nilai default
      bedrooms: 0,
      bathrooms: 0,
      landArea: 0,
      buildingArea: 0,
      publicSummary: "",
    });

    // Refresh cache
    revalidatePath("/admin/properti");
    revalidatePath("/");
    
    return { success: true };
    
  } catch (error: any) {
    console.error("Error DB Insert:", error);
    
    // Pukul rata semua error database di sini untuk menghindari kebocoran kode SQL ke UI
    return { 
      error: `Gagal menyimpan! Kode Properti "${code}" atau Slug URL "${slug}" kemungkinan besar SUDAH TERPAKAI di dalam database. Silakan gunakan kode lain.` 
    };
  }
}