import { getRequestContext } from "@cloudflare/next-on-pages";
import { createClient } from "@supabase/supabase-js";

// Wajib untuk Cloudflare Pages
export const runtime = "edge";

// FUNGSI BARU: Menjawab "Pemeriksaan Keamanan CORS" dari mesin WebGL 360°
export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
  headers.set("Access-Control-Max-Age", "86400"); // Cache izin selama 24 jam
  
  return new Response(null, { status: 204, headers });
}

// FUNGSI UTAMA: Mengirim file gambar
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: media } = await supabase
      .from("property_media")
      .select("file_name, mime_type")
      .eq("id", id)
      .limit(1)
      .single();

    if (!media) {
      return new Response("Media tidak ditemukan", { status: 404 });
    }

    const env = getRequestContext().env as any;
    const bucket = env.R2_MEDIA_BUCKET;

    if (!bucket) {
      return new Response("R2 Error", { status: 500 });
    }

    // Mengambil file dari Cloudflare R2
    const object = await bucket.get(media.file_name);

    if (!object) {
      return new Response("File fisik tidak ditemukan", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    // Header Wajib agar WebGL bisa membungkus gambar jadi 360 derajat
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    
    // Memaksa Cache 1 Tahun agar loading di HP pengunjung sangat cepat
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Content-Type", media.mime_type || "image/jpeg");

    return new Response(object.body, { headers });

  } catch (error) {
    console.error("Gagal memuat media:", error);
    return new Response("Terjadi Kesalahan Server", { status: 500 });
  }
}