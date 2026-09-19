"use server";

// 1. Gunakan jalur relatif agar 100% terbaca
import { db } from "../../../../db";
import { propertyMedia, properties } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto"; 
// HAPUS import sharp dari sini untuk mencegah crash di cPanel

export async function uploadMediaAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const fileType = formData.get("fileType") as "cover_public" | "gallery_private" | "panorama_private" | "audio_private" | "intro_planet_public";
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    throw new Error("File kosong atau tidak valid");
  }

  const fileId = crypto.randomUUID();
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  
  // Karena kita membuang sharp untuk menghindari error 500, kita simpan file apa adanya.
  const fileExt = file.name.substring(file.name.lastIndexOf("."));
  const finalFileName = `${fileId}${fileExt}`;
  const finalMimeType = file.type;

  const storageDir = path.join(process.cwd(), "storage");
  await fs.mkdir(storageDir, { recursive: true });

  const filePath = path.join(storageDir, finalFileName);
  await fs.writeFile(filePath, originalBuffer);

  await db.insert(propertyMedia).values({
    id: fileId,
    propertyId,
    fileType,
    fileName: finalFileName,
    mimeType: finalMimeType,
  });

  revalidatePath(`/admin/properti/${propertyId}`);
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

export async function deleteMediaAction(formData: FormData) {
  const mediaId = formData.get("mediaId") as string;
  const propertyId = formData.get("propertyId") as string;
  const fileName = formData.get("fileName") as string;

  await db.delete(propertyMedia).where(eq(propertyMedia.id, mediaId));

  try {
    const filePath = path.join(process.cwd(), "storage", fileName);
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Gagal menghapus file fisik:", error);
  }

  revalidatePath(`/admin/properti/${propertyId}`);
  revalidatePath(`/`);
}