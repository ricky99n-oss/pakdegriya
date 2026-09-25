import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// EDGE COMPATIBILITY: Wajib untuk API routes yang akan di-deploy ke Cloudflare Pages
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    // 1. Cari data gambar di database via REST API Supabase (bebas error TCP Edge)
    const { data: media, error } = await supabase
      .from("property_media")
      .select("file_type, file_name")
      .eq("id", id)
      .single();
    
    if (error || !media) {
      return new NextResponse("Gambar tidak ditemukan", { status: 404 });
    }

    // 2. OTORISASI: Panorama dan Audio butuh verifikasi login (Keamanan)
    if (media.file_type === "panorama_private" || media.file_type === "audio_private") {
      const { user } = await validateRequest();
      
      // Jika tidak ada user (belum login / token invalid), tolak akses
      if (!user) {
        return new NextResponse("Akses ditolak. Anda harus login untuk melihat media privat ini.", { status: 401 });
      }
    }

    // 3. BANGUN URL SUPABASE STORAGE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return new NextResponse("Kesalahan sistem: URL Supabase tidak ditemukan.", { status: 500 });
    }

    // Mengalihkan URL request ke CDN Supabase agar beban server kita 0%
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/pakdegriya-media/${media.file_name}`;

    // 4. LAKUKAN REDIRECT KE CDN SUPABASE
    return NextResponse.redirect(publicUrl);
  } catch (err) {
    console.error("Error API Media:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}