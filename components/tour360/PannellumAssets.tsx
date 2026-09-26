"use client";

import { useEffect } from "react";
import Script from "next/script";

const PANNELLUM_JS = "/vendor/pannellum/pannellum.js";
const PANNELLUM_CSS = "/vendor/pannellum/pannellum.css";

type Props = {
  onReady: () => void;
  onError: (message: string) => void;
};

export default function PannellumAssets({ onReady, onError }: Props) {
  useEffect(() => {
    if (window.pannellum?.viewer) onReady();
  }, [onReady]);

  return (
    <>
      <link rel="stylesheet" href={PANNELLUM_CSS} />
      <Script
        id="pakdegriya-pannellum-local"
        src={PANNELLUM_JS}
        strategy="afterInteractive"
        onLoad={() => {
          if (window.pannellum?.viewer) onReady();
          else onError("Pannellum termuat, tetapi window.pannellum tidak tersedia.");
        }}
        onReady={() => {
          if (window.pannellum?.viewer) onReady();
        }}
        onError={() =>
          onError(
            "File Pannellum lokal tidak ditemukan. Pastikan /public/vendor/pannellum/pannellum.js sudah ada."
          )
        }
      />
    </>
  );
}
