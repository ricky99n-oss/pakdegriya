"use server";

import { db } from "@/db";
import { propertyMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase"; 

// === FUNGSI UPLOAD ===
export async function uploadMediaAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const propertyId = formData.get("propertyId") as string;
    const fileType = formData.get("fileType") as string;
    
    // Tangkap SEMUA file yang diunggah
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0 || files[0].size === 0) {
      return { error: "File kosong atau tidak valid" };
    }

    // Loop setiap file dan simpan ke Supabase Storage
    for (const file of files) {
      if (file.size === 0) continue;

      const fileId = crypto.randomUUID();
      const fileExt = file.name.substring(file.name.lastIndexOf("."));
      const finalFileName = `${fileId}${fileExt}`;
      const finalMimeType = file.type;

      // Melempar objek 'file' secara langsung ke Supabase (Aman dari OOM)
      const { error: uploadError } = await supabase.storage
        .from('pakdegriya-media')
        .upload(finalFileName, file, {
          contentType: finalMimeType,
          upsert: false
        });

      if (uploadError) {
        console.error("Gagal Upload ke Supabase:", uploadError);
        return { error: `Gagal mengunggah file: ${uploadError.message}` };
      }

      // Catat ke Database Postgres
      await db.insert(propertyMedia).values({
        id: fileId,
        propertyId,
        fileType: fileType as any,
        fileName: finalFileName,
        mimeType: finalMimeType,
      });
    }

    revalidatePath(`/admin/properti/${propertyId}`);
    return { success: true };

  } catch (error: any) {
    console.error("Kesalahan Server Action:", error);
    return { error: "Terjadi kesalahan server. File mungkin terlalu besar atau format tidak didukung." };
  }
}

// === FUNGSI HAPUS ===
export async function deleteMediaAction(formData: FormData) {
  try {
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
  } catch (error) {
    console.error("Kesalahan saat menghapus:", error);
  }
}