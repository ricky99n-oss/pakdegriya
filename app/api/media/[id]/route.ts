import { getRequestContext } from "@cloudflare/next-on-pages";
import { createClient } from "@supabase/supabase-js";

// Wajib untuk Cloudflare Pages
export const runtime = "edge";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // 1. Inisiasi Supabase murni (menghindari error cookie di Edge API)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 2. Ambil nama file fisik dari database
    const { data: media } = await supabase
      .from("property_media")
      .select("file_name, mime_type")
      .eq("id", id)
      .limit(1)
      .single();

    if (!media) {
      return new Response("Media tidak ditemukan di database", { status: 404 });
    }

    // 3. Akses Cloudflare R2
    const env = getRequestContext().env as any;
    const bucket = env.R2_MEDIA_BUCKET;

    if (!bucket) {
      return new Response("Sistem R2 belum dikonfigurasi", { status: 500 });
    }

    const object = await bucket.get(media.file_name);

    if (!object) {
      return new Response("File fisik tidak ditemukan di R2", { status: 404 });
    }

    // 4. RACIKAN HEADER SUPER CEPAT & ANTI BLANK HITAM
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    // KUNCI UTAMA 1: Mengizinkan WebGL membaca gambar untuk dirender menjadi bola 360 derajat (Mencegah Blank Hitam)
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    
    // KUNCI UTAMA 2: Memaksa Browser & CDN menyimpan cache selama 1 Tahun (Mencegah Web Lemot/Berat)
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    
    // Pastikan format gambar terbaca dengan benar
    headers.set("Content-Type", media.mime_type || "image/jpeg");

    // 5. Kirim gambar sebagai aliran data (Stream) agar RAM server tidak jebol
    return new Response(object.body, {
      headers,
    });

  } catch (error) {
    console.error("Gagal memuat media:", error);
    return new Response("Terjadi Kesalahan Server", { status: 500 });
  }
}