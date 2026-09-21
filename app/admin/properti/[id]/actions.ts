"use server";
import { db } from "@/db";
import { propertyMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

// === FUNGSI UPLOAD BANYAK FILE (BULK) ===
export async function uploadMediaAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const fileType = formData.get("fileType") as "cover_public" | "gallery_private" | "panorama_private" | "audio_private" | "intro_planet_public";
  
  // Tangkap SEMUA file yang diunggah
  const files = formData.getAll("file") as File[];

  if (files.length === 0 || files[0].size === 0) {
    throw new Error("File kosong atau tidak valid");
  }

  const storageDir = path.join(process.cwd(), "storage");
  await fs.mkdir(storageDir, { recursive: true });

  // Loop setiap file dan simpan
  for (const file of files) {
    if (file.size === 0) continue;

    const fileId = globalThis.crypto.randomUUID();
    const originalBuffer = Buffer.from(await file.arrayBuffer());
    
    // Tanpa Sharp untuk keamanan server cPanel
    const fileExt = file.name.substring(file.name.lastIndexOf("."));
    const finalFileName = `${fileId}${fileExt}`;
    const finalMimeType = file.type;

    const filePath = path.join(storageDir, finalFileName);
    await fs.writeFile(filePath, originalBuffer);

    await db.insert(propertyMedia).values({
      id: fileId,
      propertyId,
      fileType,
      fileName: finalFileName,
      mimeType: finalMimeType,
    });
  }

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