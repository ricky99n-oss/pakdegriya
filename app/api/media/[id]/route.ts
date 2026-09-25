import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getRequestContext } from "@cloudflare/next-on-pages";

// EDGE COMPATIBILITY
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    // 1. Cek meta-data file di tabel Supabase
    const { data: media, error } = await supabase
      .from("property_media")
      .select("file_type, file_name")
      .eq("id", id)
      .single();
    
    if (error || !media) {
      return new NextResponse("Gambar tidak ditemukan di database", { status: 404 });
    }

    // 2. OTORISASI (Keamanan Media Private)
    if (media.file_type === "panorama_private" || media.file_type === "audio_private" || media.file_type === "floorplan_private") {
      const { user } = await validateRequest();
      if (!user) {
        return new NextResponse("Akses ditolak. Silakan login.", { status: 401 });
      }
    }

    // 3. AMBIL OBJEK DARI CLOUDFLARE R2
    // Menggunakan binding R2 yang dipasang di dashboard
    const env = getRequestContext().env as any;
    const bucket = env.R2_MEDIA_BUCKET;

    if (!bucket) {
      return new NextResponse("Sistem Error: R2 Bucket Binding tidak ditemukan", { status: 500 });
    }

    // Ambil file fisik berdasarkan nama file (misal: "fasad 1.jpg")
    const object = await bucket.get(media.file_name);

    if (object === null) {
      return new NextResponse("File fisik tidak ditemukan di R2", { status: 404 });
    }

    // 4. STREAMING FILE KE BROWSER
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // Kirim langsung sebagai stream tanpa membebani memori server
    return new NextResponse(object.body, {
      headers,
    });

  } catch (err) {
    console.error("Error API Media R2:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}