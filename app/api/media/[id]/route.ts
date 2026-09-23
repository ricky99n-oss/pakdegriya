import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { propertyMedia } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { validateRequest } from "../../../../lib/auth";

// EDGE COMPATIBILITY: Wajib untuk API routes yang akan di-deploy ke Cloudflare Pages
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  const { id } = await params;

  // 1. Cari data gambar di database Postgres
  const mediaRecord = await db.select().from(propertyMedia).where(eq(propertyMedia.id, id));
  
  if (mediaRecord.length === 0) {
    return new NextResponse("Gambar tidak ditemukan", { status: 404 });
  }

  const media = mediaRecord[0];

  // 2. OTORISASI: Panorama dan Audio butuh verifikasi login (Keamanan)
  if (media.fileType === "panorama_private" || media.fileType === "audio_private") {
    const { user, session } = await validateRequest();
    
    // Jika tidak ada user atau sesi sudah expired, tolak akses
    if (!user || !session) {
      return new NextResponse("Akses ditolak. Anda harus login atau sesi Anda telah habis (1 Hari).", { status: 401 });
    }
  }

  // 3. BANGUN URL SUPABASE STORAGE
  // Kita mengalihkan URL request ke CDN Supabase agar beban server kita 0%
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    return new NextResponse("Kesalahan sistem: URL Supabase tidak ditemukan.", { status: 500 });
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/pakdegriya-media/${media.fileName}`;

  // 4. LAKUKAN REDIRECT KE CDN SUPABASE
  return NextResponse.redirect(publicUrl);
}