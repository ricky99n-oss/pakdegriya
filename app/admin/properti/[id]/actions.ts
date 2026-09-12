"use server";

import { db } from "../../../../db";
import { propertyMedia, properties } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

// === FUNGSI UPLOAD MEDIA (DENGAN PENGECUALIAN PANORAMA) ===
export async function uploadMediaAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const fileType = formData.get("fileType") as "cover_public" | "gallery_private" | "floorplan_private" | "panorama_private";
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    throw new Error("File kosong atau tidak valid");
  }

  const fileId = crypto.randomUUID();
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  
  let finalBuffer: Buffer;
  let finalFileName: string;
  let finalMimeType: string;

  if (fileType === "panorama_private") {
    // KHUSUS PANORAMA: Jangan dikompres, jangan di-resize. Simpan file aslinya!
    finalBuffer = originalBuffer;
    
    // Pertahankan ekstensi asli (misal .jpg atau .png)
    const fileExt = file.name.substring(file.name.lastIndexOf("."));
    finalFileName = `${fileId}${fileExt}`;
    finalMimeType = file.type;
  } else {
    // GALERI & COVER: Tetap dikompres menjadi .webp agar web tetap super cepat
    finalBuffer = await sharp(originalBuffer)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
      
    finalFileName = `${fileId}.webp`;
    finalMimeType = "image/webp";
  }

  const storageDir = path.join(process.cwd(), "storage");
  await fs.mkdir(storageDir, { recursive: true });

  const filePath = path.join(storageDir, finalFileName);
  await fs.writeFile(filePath, finalBuffer);

  await db.insert(propertyMedia).values({
    id: fileId,
    propertyId,
    fileType,
    fileName: finalFileName,
    mimeType: finalMimeType,
  });

  revalidatePath(`/admin/properti/${propertyId}`);
}

// === FUNGSI STATUS PUBLISH ===
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

// === FUNGSI UPDATE DATA PROPERTI ===
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

// === FUNGSI HAPUS MEDIA ===
export async function deleteMediaAction(formData: FormData) {
  const mediaId = formData.get("mediaId") as string;
  const propertyId = formData.get("propertyId") as string;
  const fileName = formData.get("fileName") as string;

  // 1. Hapus catatan dari database
  await db.delete(propertyMedia).where(eq(propertyMedia.id, mediaId));

  // 2. Hapus file fisik dari folder storage agar server tidak penuh
  try {
    const filePath = path.join(process.cwd(), "storage", fileName);
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Gagal menghapus file fisik (mungkin sudah terhapus):", error);
  }

  revalidatePath(`/admin/properti/${propertyId}`);
  revalidatePath(`/`);
}