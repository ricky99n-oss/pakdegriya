"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase"; 
import { getRequestContext } from "@cloudflare/next-on-pages";

// === FUNGSI UPLOAD (LANGSUNG KE CLOUDFLARE R2) ===
export async function uploadMediaAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const propertyId = formData.get("propertyId") as string;
    const fileType = formData.get("fileType") as string;
    
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0 || files[0].size === 0) {
      return { error: "File kosong atau tidak valid" };
    }

    // Akses Binding R2 Cloudflare
    const env = getRequestContext().env as any;
    const bucket = env.R2_MEDIA_BUCKET;

    if (!bucket) {
      return { error: "Sistem R2 Storage belum dikonfigurasi di Cloudflare Pages." };
    }

    const supabase = getSupabase();

    // Loop setiap file dan simpan
    for (const file of files) {
      if (file.size === 0) continue;

      const fileId = crypto.randomUUID();
      const fileExt = file.name.substring(file.name.lastIndexOf("."));
      const finalFileName = `${fileId}${fileExt}`;
      const finalMimeType = file.type;

      // 1. UPLOAD KE CLOUDFLARE R2 MENGGUNAKAN STREAMING
      // Menggunakan file.stream() mencegah Out of Memory (OOM) pada file panorama 360 yang masif
      await bucket.put(finalFileName, file.stream(), {
        httpMetadata: { contentType: finalMimeType }
      });

      // 2. CATAT METADATA KE POSTGRES (SUPABASE REST)
      const { error: dbError } = await supabase.from("property_media").insert({
        id: fileId,
        property_id: propertyId,
        file_type: fileType,
        file_name: finalFileName,
        mime_type: finalMimeType,
      });

      if (dbError) {
        console.error("Gagal mencatat metadata ke database:", dbError);
        // Jika gagal catat DB, hapus lagi dari R2 agar tidak ada file yatim
        await bucket.delete(finalFileName); 
        return { error: "Gagal mencatat file ke database." };
      }
    }

    revalidatePath(`/admin/properti/${propertyId}`);
    return { success: true };

  } catch (error: any) {
    console.error("Kesalahan Upload R2:", error);
    return { error: "Terjadi kesalahan server. File mungkin terlalu besar atau konfigurasi Cloudflare salah." };
  }
}

// === FUNGSI HAPUS (DARI R2 & DATABASE) ===
export async function deleteMediaAction(formData: FormData) {
  try {
    const mediaId = formData.get("mediaId") as string;
    const propertyId = formData.get("propertyId") as string;
    const fileName = formData.get("fileName") as string;

    const supabase = getSupabase();

    // 1. Hapus dari Database Postgres via REST
    const { error: dbError } = await supabase
      .from("property_media")
      .delete()
      .eq("id", mediaId);

    if (dbError) throw dbError;

    // 2. Hapus file fisik dari Cloudflare R2 Storage
    try {
      const env = getRequestContext().env as any;
      const bucket = env.R2_MEDIA_BUCKET;
      if (bucket) {
        await bucket.delete(fileName);
      }
    } catch (r2Error) {
      console.error("Gagal menghapus file fisik di R2, mengabaikan...", r2Error);
    }

    revalidatePath(`/admin/properti/${propertyId}`);
    revalidatePath(`/`);
  } catch (error) {
    console.error("Kesalahan saat menghapus media:", error);
  }
}