// Browser-only loading: validate a complete transfer before handing it to an
// image decoder. A truncated stream must not become a half-rendered thumbnail.
class MediaLoadError extends Error {
  constructor(message: string, readonly retryable: boolean) { super(message); }
}

export async function loadMediaThumbnail(src: string, signal: AbortSignal): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let objectUrl: string | undefined;
    try {
      signal.throwIfAborted();
      const url = attempt ? `${src}${src.includes("?") ? "&" : "?"}retry=1` : src;
      const response = await fetch(url, { credentials: "same-origin", cache: "no-store", signal });
      if (!response.ok) {
        const message = response.status === 401 ? "Sesi berakhir. Silakan masuk kembali." : `Gambar gagal dimuat (HTTP ${response.status}).`;
        throw new MediaLoadError(message, response.status >= 500);
      }
      if (response.status !== 200 || !response.headers.get("content-type")?.startsWith("image/")) {
        throw new MediaLoadError("Server tidak mengirim file gambar lengkap.", true);
      }
      const blob = await response.blob();
      const expected = response.headers.get("x-media-size") || (!response.headers.has("content-encoding") ? response.headers.get("content-length") : null);
      if (!blob.size || (expected !== null && blob.size !== Number(expected))) {
        throw new MediaLoadError("Transfer gambar terputus. Silakan coba lagi.", true);
      }
      signal.throwIfAborted();
      objectUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      signal.throwIfAborted();
      return objectUrl;
    } catch (error) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      signal.throwIfAborted();
      if (error instanceof MediaLoadError && !error.retryable) throw error;
      if (attempt === 1) throw new Error("Gambar belum dapat dimuat utuh. Coba lagi; jika tetap gagal, periksa atau unggah ulang file sumber.");
    }
  }
  throw new Error("Gambar gagal dimuat.");
}

// Limit image transfers across the entire media list, including retries.
let active = 0;
const waiting: Array<() => void> = [];

export function queueMediaThumbnail(src: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      const index = waiting.indexOf(start);
      if (index >= 0) waiting.splice(index, 1);
      reject(signal.reason);
    };
    const start = () => {
      signal.removeEventListener("abort", abort);
      if (signal.aborted) { reject(signal.reason); return; }
      active++;
      loadMediaThumbnail(src, signal).then(resolve, reject).finally(() => {
        active--;
        waiting.shift()?.();
      });
    };
    if (signal.aborted) { reject(signal.reason); return; }
    if (active < 2) start();
    else { waiting.push(start); signal.addEventListener("abort", abort, { once: true }); }
  });
}
