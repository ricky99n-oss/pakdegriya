import { getRequestContext } from "@cloudflare/next-on-pages";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const corsHeaders = () => {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type");
  headers.set(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, Accept-Ranges, ETag"
  );
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const env = getRequestContext().env as any;
    const supabaseUrl =
      env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response("Supabase belum dikonfigurasi", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: media, error } = await supabase
      .from("property_media")
      .select("file_name, mime_type")
      .eq("id", id)
      .limit(1)
      .single();

    if (error || !media) {
      return new Response("Media tidak ditemukan", { status: 404 });
    }

    const bucket = env.R2_MEDIA_BUCKET;
    if (!bucket) {
      return new Response("R2 Error: Bucket belum di-binding", { status: 500 });
    }

    const rangeHeader = request.headers.get("Range");
    let object: any;
    let status = 200;

    if (rangeHeader) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader.trim());

      if (!match) {
        return new Response("Range tidak valid", {
          status: 416,
          headers: corsHeaders(),
        });
      }

      const start = Number(match[1]);
      const requestedEnd = match[2] ? Number(match[2]) : undefined;

      const head = await bucket.head(media.file_name);
      if (!head) {
        return new Response("File fisik tidak ditemukan di R2", { status: 404 });
      }

      if (start >= head.size) {
        const headers = corsHeaders();
        headers.set("Content-Range", `bytes */${head.size}`);
        return new Response(null, { status: 416, headers });
      }

      const end = Math.min(requestedEnd ?? head.size - 1, head.size - 1);
      const length = end - start + 1;

      object = await bucket.get(media.file_name, {
        range: { offset: start, length },
      });
      status = 206;

      if (!object) {
        return new Response("File fisik tidak ditemukan di R2", { status: 404 });
      }

      const headers = corsHeaders();
      headers.set("Content-Type", media.mime_type || "image/jpeg");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Accept-Ranges", "bytes");
      headers.set("Content-Length", String(length));
      headers.set("Content-Range", `bytes ${start}-${end}/${head.size}`);
      if (object.httpEtag) headers.set("ETag", object.httpEtag);

      return new Response(object.body, { status, headers });
    }

    object = await bucket.get(media.file_name);

    if (!object) {
      return new Response("File fisik tidak ditemukan di R2", { status: 404 });
    }

    const headers = corsHeaders();
    headers.set("Content-Type", media.mime_type || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Length", String(object.size));
    if (object.httpEtag) headers.set("ETag", object.httpEtag);

    // Jangan ubah panorama menjadi arrayBuffer. High-resolution 360 bisa sangat
    // besar dan buffering di Worker dapat memicu memory limit / blank viewer.
    // Streaming body R2 langsung ke browser jauh lebih aman.
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    console.error("Gagal memuat media:", error);
    return new Response("Terjadi Kesalahan Server", {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
