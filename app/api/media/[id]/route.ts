import { getRequestContext } from "@cloudflare/next-on-pages";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

function createCorsHeaders() {
  const headers = new Headers();

  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Range, Content-Type, If-None-Match"
  );
  headers.set(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, Accept-Ranges, ETag"
  );
  headers.set("Access-Control-Max-Age", "86400");

  return headers;
}

function createMediaHeaders(
  mimeType: string | null | undefined,
  contentLength?: number,
  etag?: string
) {
  const headers = createCorsHeaders();

  headers.set("Content-Type", mimeType || "image/jpeg");
  headers.set("Accept-Ranges", "bytes");

  // Jangan immutable permanen.
  // Kalau gambar pada media ID yang sama berubah,
  // browser masih bisa mengambil versi baru.
  headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=604800"
  );

  headers.set("Vary", "Range");

  if (typeof contentLength === "number") {
    headers.set("Content-Length", contentLength.toString());
  }

  if (etag) {
    headers.set("ETag", etag);
  }

  return headers;
}

type ParsedRange = {
  start: number;
  end: number;
  length: number;
};

function parseRange(
  rangeHeader: string,
  totalSize: number
): ParsedRange | null {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());

  if (!match) {
    return null;
  }

  const startRaw = match[1];
  const endRaw = match[2];

  // bytes=-500
  if (!startRaw && endRaw) {
    const suffixLength = Number(endRaw);

    if (
      !Number.isFinite(suffixLength) ||
      suffixLength <= 0
    ) {
      return null;
    }

    const length = Math.min(suffixLength, totalSize);
    const start = totalSize - length;
    const end = totalSize - 1;

    return {
      start,
      end,
      length,
    };
  }

  // bytes=500-
  // bytes=500-999
  if (startRaw) {
    const start = Number(startRaw);

    if (
      !Number.isFinite(start) ||
      start < 0 ||
      start >= totalSize
    ) {
      return null;
    }

    let end =
      endRaw !== ""
        ? Number(endRaw)
        : totalSize - 1;

    if (
      !Number.isFinite(end) ||
      end < start
    ) {
      return null;
    }

    end = Math.min(end, totalSize - 1);

    return {
      start,
      end,
      length: end - start + 1,
    };
  }

  return null;
}

async function getMediaRecord(id: string) {
  const env = getRequestContext().env as any;

  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Environment Supabase belum dikonfigurasi."
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseKey
  );

  const { data: media, error } = await supabase
    .from("property_media")
    .select("file_name, mime_type")
    .eq("id", id)
    .limit(1)
    .single();

  if (error || !media) {
    return {
      media: null,
      bucket: null,
    };
  }

  const bucket = env.R2_MEDIA_BUCKET;

  return {
    media,
    bucket,
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(),
  });
}

export async function HEAD(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await params;

  try {
    const { media, bucket } =
      await getMediaRecord(id);

    if (!media) {
      return new Response(null, {
        status: 404,
        headers: createCorsHeaders(),
      });
    }

    if (!bucket) {
      return new Response(null, {
        status: 500,
        headers: createCorsHeaders(),
      });
    }

    const object = await bucket.head(
      media.file_name
    );

    if (!object) {
      return new Response(null, {
        status: 404,
        headers: createCorsHeaders(),
      });
    }

    const headers = createMediaHeaders(
      media.mime_type,
      object.size,
      object.httpEtag
    );

    return new Response(null, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(
      "HEAD media gagal:",
      error
    );

    return new Response(null, {
      status: 500,
      headers: createCorsHeaders(),
    });
  }
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await params;

  try {
    const { media, bucket } =
      await getMediaRecord(id);

    if (!media) {
      return new Response(
        "Media tidak ditemukan",
        {
          status: 404,
          headers: createCorsHeaders(),
        }
      );
    }

    if (!bucket) {
      return new Response(
        "R2 Error: Bucket belum di-binding",
        {
          status: 500,
          headers: createCorsHeaders(),
        }
      );
    }

    /*
     * PENTING:
     *
     * Parameter ?buffer=true dari kode versi lama
     * sengaja TIDAK digunakan lagi.
     *
     * Jangan pernah object.arrayBuffer()
     * untuk file panorama besar di Worker.
     *
     * File langsung di-stream dari R2
     * menuju browser.
     */

    const rangeHeader =
      request.headers.get("Range");

    /*
     * REQUEST RANGE
     *
     * Mendukung:
     * bytes=0-999
     * bytes=1000-
     * bytes=-500
     */
    if (rangeHeader) {
      const headObject = await bucket.head(
        media.file_name
      );

      if (!headObject) {
        return new Response(
          "File fisik tidak ditemukan di R2",
          {
            status: 404,
            headers: createCorsHeaders(),
          }
        );
      }

      const parsedRange = parseRange(
        rangeHeader,
        headObject.size
      );

      if (!parsedRange) {
        const headers =
          createCorsHeaders();

        headers.set(
          "Content-Range",
          `bytes */${headObject.size}`
        );

        return new Response(null, {
          status: 416,
          headers,
        });
      }

      const {
        start,
        end,
        length,
      } = parsedRange;

      const object = await bucket.get(
        media.file_name,
        {
          range: {
            offset: start,
            length,
          },
        }
      );

      if (!object) {
        return new Response(
          "File fisik tidak ditemukan di R2",
          {
            status: 404,
            headers: createCorsHeaders(),
          }
        );
      }

      const headers = createMediaHeaders(
        media.mime_type,
        length,
        object.httpEtag ||
          headObject.httpEtag
      );

      headers.set(
        "Content-Range",
        `bytes ${start}-${end}/${headObject.size}`
      );

      return new Response(
        object.body,
        {
          status: 206,
          headers,
        }
      );
    }

    /*
     * REQUEST NORMAL
     *
     * Tidak ada arrayBuffer().
     * Tidak ada Blob di Worker.
     *
     * R2 -> stream -> browser.
     */
    const object = await bucket.get(
      media.file_name
    );

    if (!object) {
      return new Response(
        "File fisik tidak ditemukan di R2",
        {
          status: 404,
          headers: createCorsHeaders(),
        }
      );
    }

    const headers = createMediaHeaders(
      media.mime_type,
      object.size,
      object.httpEtag
    );

    /*
     * Support ETag / browser cache.
     */
    const ifNoneMatch =
      request.headers.get("If-None-Match");

    if (
      ifNoneMatch &&
      object.httpEtag &&
      ifNoneMatch === object.httpEtag
    ) {
      return new Response(null, {
        status: 304,
        headers,
      });
    }

    return new Response(
      object.body,
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error(
      "Gagal memuat media:",
      error
    );

    return new Response(
      "Terjadi Kesalahan Server",
      {
        status: 500,
        headers: createCorsHeaders(),
      }
    );
  }
}