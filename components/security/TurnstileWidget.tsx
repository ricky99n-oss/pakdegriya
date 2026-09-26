"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string) => void;
  onExpire?: () => void;
  resetKey?: number;
};

export default function TurnstileWidget({ onToken, onExpire, resetKey = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const [ready, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    if (!ready || !siteKey || !containerRef.current || !window.turnstile || widgetId.current) return;

    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      size: "flexible",
      callback: (token: string) => onTokenRef.current(token),
      "expired-callback": () => {
        onTokenRef.current("");
        onExpireRef.current?.();
      },
      "error-callback": () => onTokenRef.current(""),
    });

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [ready, siteKey]);

  useEffect(() => {
    if (!resetKey || !widgetId.current || !window.turnstile) return;
    window.turnstile.reset(widgetId.current);
    onTokenRef.current("");
  }, [resetKey]);

  if (!siteKey) {
    return <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">Turnstile belum aktif. Tambahkan NEXT_PUBLIC_TURNSTILE_SITE_KEY dan TURNSTILE_SECRET_KEY di Cloudflare.</p>;
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
