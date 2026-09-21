import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { propertyMedia } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { validateRequest } from "../../../../lib/auth";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  const { id } = await params;

  // 1. Cari data gambar di database
  const mediaRecord = await db.select().from(propertyMedia).where(eq(propertyMedia.id, id));
  
  if (mediaRecord.length === 0) {
    return new NextResponse("Gambar tidak ditemukan", { status: 404 });
  }

  const media = mediaRecord[0];

  // 2. PERBAIKAN OTORISASI: Cover dan Galeri SEKARANG DIBUKA UNTUK PUBLIK!
  // Yang dikunci (wajib login) hanyalah Panorama 360 dan Audio.
  if (media.fileType === "panorama_private" || media.fileType === "audio_private") {
    const { user } = await validateRequest();
    
    if (!user) {
      return new NextResponse("Akses ditolak. Anda harus login untuk melihat fitur ini.", { status: 401 });
    }
  }

  // 3. Mengambil file fisik dari folder /storage
  const filePath = path.join(process.cwd(), "storage", media.fileName);

  try {
    const fileBuffer = await fs.readFile(filePath);
    
    // 4. Kirim gambar ke browser dengan manajemen cache yang tepat
    const headers = new Headers();
    headers.set("Content-Type", media.mimeType);
    
    if (media.fileType === "panorama_private" || media.fileType === "audio_private") {
      headers.set("Cache-Control", "private, no-store, max-age=0");
    } else {
      headers.set("Cache-Control", "public, max-age=31536000, immutable"); // Galeri & Cover di-cache agar server ringan
    }

    return new NextResponse(fileBuffer, { headers, status: 200 });
  } catch (error) {
    console.error("File fisik hilang:", error);
    return new NextResponse("File fisik tidak ditemukan di server", { status: 404 });
  }
}