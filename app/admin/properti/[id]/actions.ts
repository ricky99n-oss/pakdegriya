"use server";

import { db } from "@/db";
import { propertyMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase"; 

// === FUNGSI UPLOAD BANYAK FILE (BULK) KE SUPABASE ===
export async function uploadMediaAction(formData: FormData) {
  const propertyId = formData.get("propertyId") as string;
  const fileType = formData.get("fileType") as "cover_public" | "gallery_private" | "panorama_private" | "audio_private" | "intro_planet_public";
  
  // Tangkap SEMUA file yang diunggah
  const files = formData.getAll("file") as File[];

  if (files.length === 0 || files[0].size === 0) {
    throw new Error("File kosong atau tidak valid");
  }

  // Loop setiap file dan simpan ke Supabase Storage
  for (const file of files) {
    if (file.size === 0) continue;

    // EDGE COMPATIBILITY: Gunakan crypto global
    const fileId = crypto.randomUUID();
    const fileExt = file.name.substring(file.name.lastIndexOf("."));
    const finalFileName = `${fileId}${fileExt}`;
    const finalMimeType = file.type;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload ke Bucket Supabase bernama 'pakdegriya-media'
    const { error: uploadError } = await supabase.storage
      .from('pakdegriya-media')
      .upload(finalFileName, buffer, {
        contentType: finalMimeType,
        upsert: false
      });

    if (uploadError) {
      console.error("Gagal Upload ke Supabase:", uploadError);
      throw new Error(`Gagal mengunggah file: ${uploadError.message}`);
    }

    // Catat ke Database Postgres
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

  // 1. Hapus dari Database Postgres
  await db.delete(propertyMedia).where(eq(propertyMedia.id, mediaId));

  // 2. Hapus file fisik dari Supabase Storage
  const { error: deleteError } = await supabase.storage
    .from('pakdegriya-media')
    .remove([fileName]);

  if (deleteError) {
    console.error("Gagal menghapus file dari Supabase:", deleteError);
  }

  revalidatePath(`/admin/properti/${propertyId}`);
  revalidatePath(`/`);
}