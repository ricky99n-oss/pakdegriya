"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, RefreshCw } from "lucide-react";
import { queueMediaThumbnail } from "@/lib/media-thumbnail";

export default function MediaThumbnail({ src, alt }: { src: string; alt: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    let started = false;
    const load = () => {
      if (started) return;
      started = true;
      void queueMediaThumbnail(src, controller.signal).then((url) => {
        objectUrl = url;
        if (controller.signal.aborted) { URL.revokeObjectURL(url); return; }
        setLoaded(url);
      }).catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Gambar gagal dimuat.");
      });
    };
    const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer?.disconnect(); load(); }
    }, { rootMargin: "150px" }) : null;
    if (observer && container.current) observer.observe(container.current);
    else load();
    return () => {
      observer?.disconnect();
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, attempt]);

  return (
    <div ref={container} className="w-full h-full" aria-busy={!loaded && !error}>
      {loaded ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={loaded} alt={alt} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center text-gray-500" role="status">
          <ImageIcon size={28} />
          <p className="text-xs">{error || "Memuat pratinjau..."}</p>
          {error && <button type="button" onClick={() => { setError(null); setAttempt((value) => value + 1); }} className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1 text-xs font-bold"><RefreshCw size={12} /> Coba lagi</button>}
        </div>
      )}
    </div>
  );
}
