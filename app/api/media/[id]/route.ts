import { getRequestContext } from "@cloudflare/next-on-pages";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "*");
  headers.set("Access-Control-Max-Age", "86400"); 
  return new Response(null, { status: 204, headers });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const url = new URL(request.url);
    // SAKLAR PINTAR: Mengecek apakah ini permintaan dari mesin 360
    const forceBuffer = url.searchParams.get("buffer") === "true";

    const env = getRequestContext().env as any;
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data: media } = await supabase.from("property_media").select("file_name, mime_type").eq("id", id).limit(1).single();
    if (!media) return new Response("Media tidak ditemukan", { status: 404 });

    const bucket = env.R2_MEDIA_BUCKET;
    if (!bucket) return new Response("R2 Error: Bucket belum di-binding", { status: 500 });

    const object = await bucket.get(media.file_name);
    if (!object) return new Response("File fisik tidak ditemukan di R2", { status: 404 });

    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Expose-Headers", "Content-Length, Accept-Ranges");
    headers.set("Content-Type", media.mime_type || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Accept-Ranges", "bytes");

    if (forceBuffer) {
      // MODE 1 (PANNELLUM 360): Dimuat utuh ke RAM agar nilai persentase loading jalan.
      // Aman dari Error 1102 karena hanya 1 gambar yang diproses pada satu waktu.
      const buffer = await object.arrayBuffer();
      headers.set("Content-Length", buffer.byteLength.toString());
      return new Response(buffer, { headers });
    } else {
      // MODE 2 (THUMBNAIL): Streaming langsung. Hemat memori server.
      headers.set("Content-Length", object.size.toString());
      return new Response(object.body, { headers });
    }

  } catch (error) {
    console.error("Gagal memuat media:", error);
    return new Response("Terjadi Kesalahan Server", { status: 500 });
  }
}