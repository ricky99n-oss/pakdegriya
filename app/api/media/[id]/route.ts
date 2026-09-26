import { getRequestContext } from "@cloudflare/next-on-pages";
import { createClient } from "@supabase/supabase-js";
import { validateRequest } from "@/lib/auth";

export const runtime = "edge";

const PUBLIC_MEDIA_TYPES = new Set(["cover_public", "intro_planet_public"]);

function corsHeaders() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type, If-None-Match");
  headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, ETag");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

function mediaHeaders(media: any, contentLength?: number, etag?: string) {
  const headers = corsHeaders();
  const isPublic = PUBLIC_MEDIA_TYPES.has(media.file_type);
  headers.set("Content-Type", media.mime_type || "application/octet-stream");
  headers.set("Accept-Ranges", "bytes");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", isPublic ? "public, max-age=86400, stale-while-revalidate=604800" : "private, no-store, max-age=0");
  headers.set("Vary", isPublic ? "Range" : "Cookie, Range");
  if (typeof contentLength === "number") headers.set("Content-Length", String(contentLength));
  if (etag) headers.set("ETag", etag);
  return headers;
}

type ParsedRange = { start: number; end: number; length: number };
function parseRange(value: string, total: number): ParsedRange | null {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  if (!match) return null;
  const [, startRaw, endRaw] = match;
  if (!startRaw && endRaw) {
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    const length = Math.min(suffix, total);
    return { start: total - length, end: total - 1, length };
  }
  if (!startRaw) return null;
  const start = Number(startRaw);
  if (!Number.isFinite(start) || start < 0 || start >= total) return null;
  let end = endRaw ? Number(endRaw) : total - 1;
  if (!Number.isFinite(end) || end < start) return null;
  end = Math.min(end, total - 1);
  return { start, end, length: end - start + 1 };
}

async function mediaContext(id: string) {
  const env = getRequestContext().env as any;
  const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment belum dikonfigurasi.");

  const { data: media, error } = await createClient(url, key)
    .from("property_media")
    .select("file_name, mime_type, file_type, property_id")
    .eq("id", id)
    .limit(1)
    .single();
  if (error || !media) return { media: null, bucket: null };
  return { media, bucket: env.R2_MEDIA_BUCKET };
}

async function authorized(media: any) {
  if (PUBLIC_MEDIA_TYPES.has(media.file_type)) return true;
  const { user } = await validateRequest();
  return Boolean(user);
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function HEAD(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { media, bucket } = await mediaContext(id);
    if (!media) return new Response(null, { status: 404, headers: corsHeaders() });
    if (!(await authorized(media))) return new Response(null, { status: 401, headers: corsHeaders() });
    if (!bucket) return new Response(null, { status: 500, headers: corsHeaders() });
    const object = await bucket.head(media.file_name);
    if (!object) return new Response(null, { status: 404, headers: corsHeaders() });
    return new Response(null, { status: 200, headers: mediaHeaders(media, object.size, object.httpEtag) });
  } catch (error) {
    console.error("HEAD media gagal:", error);
    return new Response(null, { status: 500, headers: corsHeaders() });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { media, bucket } = await mediaContext(id);
    if (!media) return new Response("Media tidak ditemukan", { status: 404, headers: corsHeaders() });
    if (!(await authorized(media))) return new Response("Login diperlukan untuk media ini", { status: 401, headers: corsHeaders() });
    if (!bucket) return new Response("R2 bucket belum dikonfigurasi", { status: 500, headers: corsHeaders() });

    const rangeHeader = request.headers.get("Range");
    if (rangeHeader) {
      const head = await bucket.head(media.file_name);
      if (!head) return new Response("File tidak ditemukan", { status: 404, headers: corsHeaders() });
      const range = parseRange(rangeHeader, head.size);
      if (!range) {
        const headers = corsHeaders();
        headers.set("Content-Range", `bytes */${head.size}`);
        return new Response(null, { status: 416, headers });
      }
      const object = await bucket.get(media.file_name, { range: { offset: range.start, length: range.length } });
      if (!object) return new Response("File tidak ditemukan", { status: 404, headers: corsHeaders() });
      const headers = mediaHeaders(media, range.length, object.httpEtag || head.httpEtag);
      headers.set("Content-Range", `bytes ${range.start}-${range.end}/${head.size}`);
      return new Response(object.body, { status: 206, headers });
    }

    const object = await bucket.get(media.file_name);
    if (!object) return new Response("File tidak ditemukan", { status: 404, headers: corsHeaders() });
    const headers = mediaHeaders(media, object.size, object.httpEtag);
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch && object.httpEtag && ifNoneMatch === object.httpEtag) return new Response(null, { status: 304, headers });
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    console.error("GET media gagal:", error);
    return new Response("Terjadi Kesalahan Server", { status: 500, headers: corsHeaders() });
  }
}
