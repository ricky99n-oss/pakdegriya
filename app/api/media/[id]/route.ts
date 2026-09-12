import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { propertyMedia } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { validateRequest } from "../../../../lib/auth";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Menggunakan Promise sesuai standar Next.js 15+
) {
  const { id } = await params;

  // 1. Cari data gambar di database
  const mediaRecord = await db.select().from(propertyMedia).where(eq(propertyMedia.id, id));
  
  if (mediaRecord.length === 0) {
    return new NextResponse("Gambar tidak ditemukan", { status: 404 });
  }

  const media = mediaRecord[0];

  // 2. Pemeriksaan Hak Akses (OTORISASI)
  // Jika file BUKAN cover publik, maka wajib login
  if (media.fileType !== "cover_public") {
    const { user } = await validateRequest();
    
    // Jika tidak ada session (belum login), tolak aksesnya!
    if (!user) {
      return new NextResponse("Akses ditolak. Anda harus login untuk melihat gambar ini.", { status: 401 });
    }
    // Catatan: Akses antar peran (member vs admin) bisa diperketat lagi di sini nanti
  }

  // 3. Mengambil file fisik dari folder /storage
  // process.cwd() menunjuk ke root proyek kita
  const filePath = path.join(process.cwd(), "storage", media.fileName);

  try {
    const fileBuffer = await fs.readFile(filePath);
    
    // 4. Kirim gambar ke browser dengan header yang melarang caching untuk file privat
    const headers = new Headers();
    headers.set("Content-Type", media.mimeType);
    
    if (media.fileType !== "cover_public") {
      headers.set("Cache-Control", "private, no-store, max-age=0");
    } else {
      headers.set("Cache-Control", "public, max-age=31536000"); // Cover publik boleh dicache
    }

    return new NextResponse(fileBuffer, { headers, status: 200 });
  } catch (error) {
    console.error("File fisik hilang:", error);
    return new NextResponse("File fisik tidak ditemukan di server", { status: 404 });
  }
}