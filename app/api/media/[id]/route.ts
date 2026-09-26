import { getRequestContext } from "@cloudflare/next-on-pages";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
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

    // KEMBALIKAN KE MODE STREAM (object.body) AGAR RAM SERVER TIDAK OVERLOAD
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Expose-Headers", "Content-Length, Accept-Ranges");
    headers.set("Content-Length", object.size.toString());
    headers.set("Content-Type", media.mime_type || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, { headers });

  } catch (error) {
    console.error("Gagal memuat media:", error);
    return new Response("Terjadi Kesalahan Server", { status: 500 });
  }
}