"use server";
import { db } from "@/db"; // MENGGUNAKAN ALIAS
import { properties, propertyMedia } from "@/db/schema"; // MENGGUNAKAN ALIAS
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createProperty(formData: FormData) {
  // Mengambil data dari form
  const code = formData.get("code") as string;
  const slug = formData.get("slug") as string;
  const title = formData.get("title") as string;
  const price = Number(formData.get("price")); 
  const transactionType = formData.get("transactionType") as "jual" | "sewa_bulan" | "sewa_tahun";
  const propertyType = formData.get("propertyType") as "rumah" | "tanah" | "villa" | "ruko" | "apartemen";
  const generalLocation = formData.get("generalLocation") as string;

  // Insert ke database menggunakan fungsi crypto global (bebas crash)
  await db.insert(properties).values({
    id: globalThis.crypto.randomUUID(),
    code,
    slug,
    title,
    price,
    transactionType,
    propertyType,
    generalLocation,
    publishStatus: "draft", 
    availabilityStatus: "available",
  });

  // Kembali ke halaman daftar properti
  redirect("/admin/properti");
}

export async function togglePublishStatus(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const currentStatus = formData.get("currentStatus") as string;
  const newStatus = currentStatus === "published" ? "draft" : "published";

  await db.update(properties)
    .set({ publishStatus: newStatus })
    .where(eq(properties.id, propertyId));

  revalidatePath(`/`);
  revalidatePath(`/admin/properti`);
  revalidatePath(`/admin/properti/${propertyId}`);
}

export async function updatePropertyAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  
  await db.update(properties).set({
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    price: Number(formData.get("price")),
    generalLocation: formData.get("generalLocation") as string,
    publicSummary: formData.get("publicSummary") as string,
    transactionType: formData.get("transactionType") as "jual" | "sewa_bulan" | "sewa_tahun",
    propertyType: formData.get("propertyType") as "rumah" | "tanah" | "villa" | "ruko" | "apartemen",
  }).where(eq(properties.id, propertyId));

  revalidatePath(`/`);
  revalidatePath(`/admin/properti`);
  revalidatePath(`/admin/properti/${propertyId}`);
}

export async function hapusPropertiAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  
  // 1. Hapus catatan media di DB
  await db.delete(propertyMedia).where(eq(propertyMedia.propertyId, propertyId));
  
  // 2. Hapus data propertinya
  await db.delete(properties).where(eq(properties.id, propertyId));
  
  revalidatePath("/admin/properti");
  revalidatePath("/");
}