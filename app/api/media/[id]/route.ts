import { getRequestContext } from "@cloudflare/next-on-pages";
import { createClient } from "@supabase/supabase-js";

// Wajib untuk Cloudflare Pages Edge Runtime
export const runtime = "edge";

// Menjawab "Pemeriksaan Keamanan CORS" dari mesin WebGL 360°
export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "*");
  headers.set("Access-Control-Max-Age", "86400"); // Cache izin selama 24 jam
  
  return new Response(null, { status: 204, headers });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Mengambil env dengan cara paling aman di Cloudflare Edge
    const env = getRequestContext().env as any;
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Ambil data metadata dari database
    const { data: media } = await supabase
      .from("property_media")
      .select("file_name, mime_type")
      .eq("id", id)
      .limit(1)
      .single();

    if (!media) {
      return new Response("Media tidak ditemukan", { status: 404 });
    }

    const bucket = env.R2_MEDIA_BUCKET;
    if (!bucket) {
      return new Response("R2 Error: Bucket belum di-binding", { status: 500 });
    }

    // Mengambil file fisik dari Cloudflare R2
    const object = await bucket.get(media.file_name);

    if (!object) {
      return new Response("File fisik tidak ditemukan", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    // Header Izin Keamanan WebGL
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    
    // Header Cache untuk mempercepat loading
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Content-Type", media.mime_type || "image/jpeg");

    // === KUNCI PERBAIKAN: Mencegah Layar Loading Hitam di Editor ===
    // Memberitahu Pannellum ukuran asli file agar persentase loading bisa berjalan
    headers.set("Content-Length", object.size.toString());
    
    // Mengizinkan Browser memuat gambar secara parsial (potongan)
    headers.set("Accept-Ranges", "bytes");

    return new Response(object.body, { headers });

  } catch (error) {
    console.error("Gagal memuat media:", error);
    return new Response("Terjadi Kesalahan Server", { status: 500 });
  }
}