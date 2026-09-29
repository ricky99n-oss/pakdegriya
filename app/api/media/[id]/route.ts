import { getRequestContext } from "@cloudflare/next-on-pages";
import { getMediaRecord, hasMediaSession, type MediaRecord, type MediaAccessConfig } from "@/lib/media-access";

export const runtime = "edge";

type MediaObject = { size: number; httpEtag: string };
type MediaBucket = {
  head: (key: string) => Promise<MediaObject | null>;
  get: (key: string, options?: { range: { offset: number; length: number } }) => Promise<(MediaObject & { body: ReadableStream<Uint8Array> }) | null>;
};
type MediaEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  R2_MEDIA_BUCKET?: MediaBucket;
};

function corsHeaders() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type, If-None-Match");
  headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, ETag, X-Media-Size");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Cache-Control", "no-store");
  return headers;
}

function mediaHeaders(media: MediaRecord, contentLength?: number, etag?: string, preview = false) {
  const headers = corsHeaders();
  const isPublic = Boolean(media.is_public);
  headers.set("Content-Type", preview ? "image/jpeg" : media.mime_type || "application/octet-stream");
  headers.set("Accept-Ranges", "bytes");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set(
    "Cache-Control",
    isPublic ? "public, max-age=86400, stale-while-revalidate=604800" : "private, no-store, max-age=0"
  );
  headers.set("Vary", isPublic ? "Range" : "Cookie, Range");
  if (typeof contentLength === "number") {
    headers.set("Content-Length", String(contentLength));
    // Survives proxies that strip Content-Length or apply transport compression.
    headers.set("X-Media-Size", String(contentLength));
  }
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
  const env = getRequestContext().env as MediaEnv;
  const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment belum dikonfigurasi.");

  const config: MediaAccessConfig = { url, anonKey: key };
  const media = await getMediaRecord(id, config);
  return { media, bucket: env.R2_MEDIA_BUCKET, config };
}

async function authorized(media: MediaRecord, request: Request, config: MediaAccessConfig) {
  if (media.is_public) return true;
  return hasMediaSession(request, config);
}

function selectObject(media: MediaRecord, request: Request) {
  const wantsPreview = new URL(request.url).searchParams.get("preview") === "1";
  const previewName = wantsPreview ? media.preview_file_name : null;
  return {
    objectKey: previewName || media.file_name,
    preview: Boolean(previewName),
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function HEAD(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { media, bucket, config } = await mediaContext(id);
    if (!media) return new Response(null, { status: 404, headers: corsHeaders() });
    if (!(await authorized(media, request, config))) return new Response(null, { status: 401, headers: corsHeaders() });
    if (!bucket) return new Response(null, { status: 500, headers: corsHeaders() });

    const { objectKey, preview } = selectObject(media, request);
    const object = await bucket.head(objectKey);
    if (!object) return new Response(null, { status: 404, headers: corsHeaders() });
    return new Response(null, { status: 200, headers: mediaHeaders(media, object.size, object.httpEtag, preview) });
  } catch (error) {
    console.error("HEAD media gagal:", error);
    return new Response(null, { status: 500, headers: corsHeaders() });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { media, bucket, config } = await mediaContext(id);
    if (!media) return new Response("Media tidak ditemukan", { status: 404, headers: corsHeaders() });
    if (!(await authorized(media, request, config))) return new Response("Login diperlukan untuk media ini", { status: 401, headers: corsHeaders() });
    if (!bucket) return new Response("R2 bucket belum dikonfigurasi", { status: 500, headers: corsHeaders() });

    const { objectKey, preview } = selectObject(media, request);
    const rangeHeader = request.headers.get("Range");

    if (rangeHeader) {
      const head = await bucket.head(objectKey);
      if (!head) return new Response("File tidak ditemukan", { status: 404, headers: corsHeaders() });
      const range = parseRange(rangeHeader, head.size);
      if (!range) {
        const headers = corsHeaders();
        headers.set("Content-Range", `bytes */${head.size}`);
        return new Response(null, { status: 416, headers });
      }

      const object = await bucket.get(objectKey, { range: { offset: range.start, length: range.length } });
      if (!object) return new Response("File tidak ditemukan", { status: 404, headers: corsHeaders() });
      const headers = mediaHeaders(media, range.length, object.httpEtag || head.httpEtag, preview);
      headers.set("Content-Range", `bytes ${range.start}-${range.end}/${head.size}`);
      return new Response(object.body, { status: 206, headers });
    }

    const object = await bucket.get(objectKey);
    if (!object) return new Response("File tidak ditemukan", { status: 404, headers: corsHeaders() });

    const headers = mediaHeaders(media, object.size, object.httpEtag, preview);
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch && object.httpEtag && ifNoneMatch === object.httpEtag) {
      await object.body.cancel();
      return new Response(null, { status: 304, headers });
    }
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    console.error("GET media gagal:", error);
    return new Response("Terjadi Kesalahan Server", { status: 500, headers: corsHeaders() });
  }
}
