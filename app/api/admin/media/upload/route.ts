import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "edge";

const FILE_RULES: Record<
  string,
  { prefixes: string[]; maxBytes: number; defaultPublic: boolean }
> = {
  cover_public: { prefixes: ["image/"], maxBytes: 15 * 1024 * 1024, defaultPublic: true },
  gallery_private: { prefixes: ["image/"], maxBytes: 15 * 1024 * 1024, defaultPublic: false },
  floorplan_private: {
    prefixes: ["image/", "application/pdf"],
    maxBytes: 20 * 1024 * 1024,
    defaultPublic: false,
  },
  panorama_private: { prefixes: ["image/"], maxBytes: 45 * 1024 * 1024, defaultPublic: false },
  intro_planet_public: { prefixes: ["image/"], maxBytes: 15 * 1024 * 1024, defaultPublic: true },
  audio_private: { prefixes: ["audio/"], maxBytes: 20 * 1024 * 1024, defaultPublic: false },
};

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function validMime(mime: string, prefixes: string[]) {
  return prefixes.some((prefix) =>
    prefix.endsWith("/") ? mime.startsWith(prefix) : mime === prefix
  );
}

function safeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function safeExtension(name: string) {
  return (name.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] || "").toLowerCase();
}

function requestSize(request: NextRequest) {
  const custom = Number(request.headers.get("x-file-size") || 0);
  const standard = Number(request.headers.get("content-length") || 0);
  return Number.isFinite(custom) && custom > 0 ? custom : standard;
}

export async function POST(request: NextRequest) {
  let bucket: any = null;
  let cleanupPreviewName: string | null = null;
  let cleanupMasterName: string | null = null;

  try {
    await requireAdmin();

    const origin = request.headers.get("origin");
    if (origin && new URL(origin).origin !== new URL(request.url).origin) {
      return json({ success: false, error: "Origin request tidak valid." }, 403);
    }

    const url = new URL(request.url);
    const propertyId = url.searchParams.get("propertyId") || "";
    const fileType = url.searchParams.get("fileType") || "";
    const fileId = url.searchParams.get("fileId") || "";
    const originalName = url.searchParams.get("originalName") || "";
    const variant = url.searchParams.get("variant") || "master";
    const previewUploaded = url.searchParams.get("previewUploaded") === "1";
    const rule = FILE_RULES[fileType];

    if (!propertyId || !rule || !safeUuid(fileId)) {
      return json({ success: false, error: "Parameter upload media tidak valid." }, 400);
    }

    if (!request.body) {
      return json({ success: false, error: "File upload tidak ditemukan." }, 400);
    }

    const env = getRequestContext().env as any;
    bucket = env.R2_MEDIA_BUCKET;
    if (!bucket) {
      return json({ success: false, error: "R2 Storage belum dikonfigurasi." }, 500);
    }

    const mime = request.headers.get("content-type") || "application/octet-stream";
    const size = requestSize(request);

    if (variant === "preview") {
      if (fileType !== "panorama_private" || !mime.startsWith("image/")) {
        return json({ success: false, error: "Preview panorama tidak valid." }, 400);
      }
      if (size <= 0 || size > 3 * 1024 * 1024) {
        return json({ success: false, error: "Preview panorama maksimal 3 MB." }, 413);
      }

      const previewName = `${fileId}-preview.jpg`;
      cleanupPreviewName = previewName;
      await bucket.put(previewName, request.body, {
        httpMetadata: { contentType: "image/jpeg" },
        customMetadata: { propertyId, fileType, variant: "preview" },
      });

      cleanupPreviewName = null;
      return json({ success: true, fileName: previewName });
    }

    if (variant !== "master") {
      return json({ success: false, error: "Variant upload tidak dikenal." }, 400);
    }

    if (!validMime(mime, rule.prefixes)) {
      return json({ success: false, error: "Tipe file tidak diizinkan untuk kategori ini." }, 415);
    }
    if (size <= 0 || size > rule.maxBytes) {
      return json(
        {
          success: false,
          error: `Ukuran file maksimal ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`,
        },
        413
      );
    }

    const finalFileName = `${fileId}${safeExtension(originalName)}`;
    const previewFileName = previewUploaded ? `${fileId}-preview.jpg` : null;
    cleanupMasterName = finalFileName;
    cleanupPreviewName = previewFileName;

    await bucket.put(finalFileName, request.body, {
      httpMetadata: { contentType: mime },
      customMetadata: { propertyId, fileType },
    });

    const { error: dbError } = await getSupabaseAdmin().from("property_media").insert({
      id: fileId,
      property_id: propertyId,
      file_type: fileType,
      file_name: finalFileName,
      preview_file_name: previewFileName,
      mime_type: mime,
      is_public: rule.defaultPublic,
    });

    if (dbError) throw new Error(`Metadata media gagal disimpan: ${dbError.message}`);

    cleanupMasterName = null;
    cleanupPreviewName = null;
    return json({ success: true, mediaId: fileId, fileName: finalFileName });
  } catch (error) {
    console.error("Streaming media upload gagal:", {
      message: error instanceof Error ? error.message : String(error),
    });

    try {
      if (bucket && cleanupMasterName) await bucket.delete(cleanupMasterName);
      if (bucket && cleanupPreviewName) await bucket.delete(cleanupPreviewName);
    } catch (cleanupError) {
      console.error("Cleanup upload gagal:", cleanupError);
    }

    const unauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return json(
      {
        success: false,
        error: unauthorized
          ? "Sesi admin tidak valid. Silakan login kembali."
          : "Upload gagal diproses. Silakan coba lagi.",
      },
      unauthorized ? 401 : 500
    );
  }
}
