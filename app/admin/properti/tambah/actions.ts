"use server";

import { db } from "@/db";
import { properties } from "@/db/schema";
import { randomUUID } from "crypto";
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
    throw new Error("Kode, Judul, dan Slug wajib diisi!");
  }

  try {
    // Memasukkan data ke database Drizzle ORM
    await db.insert(properties).values({
      id: randomUUID(),
      code: code.trim(),
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      price: isNaN(price) ? 0 : price,
      generalLocation: generalLocation.trim(),
      
      // PERBAIKAN: Menambahkan 'as any' untuk mencegah TS Overload Error 
      // karena ketidakcocokan tipe String biasa dengan String Enum bawaan Drizzle
      transactionType: transactionType as any,
      propertyType: propertyType as any,
      publishStatus: "draft" as any, 
    });

    // Refresh cache halaman admin agar data baru langsung muncul
    revalidatePath("/admin/properti");
    revalidatePath("/");
    
  } catch (error: any) {
    console.error("Error DB Insert:", error);
    // Error ini biasanya terjadi jika SLUG atau KODE PROPERTI sudah ada yang pakai (Unique Constraint)
    throw new Error("Gagal menyimpan properti. Pastikan Kode Properti atau Slug URL belum digunakan oleh properti lain.");
  }
}