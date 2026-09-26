"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { googleIdTokenLoginAction } from "@/app/auth/actions";
import PhoneCompletionModal from "./PhoneCompletionModal";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

type Props = {
  turnstileToken: string;
  requestedNext?: string;
  mode?: "login" | "signup";
  disabled?: boolean;
  onError: (message: string) => void;
  onTokenConsumed?: () => void;
};

type PhoneState = {
  open: boolean;
  redirectTo: string;
  userName?: string;
};

export default function GoogleIdentityButton({
  turnstileToken,
  requestedNext = "",
  mode = "login",
  disabled = false,
  onError,
  onTokenConsumed,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [phoneState, setPhoneState] = useState<PhoneState>({ open: false, redirectTo: "/" });
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!scriptReady || !clientId || !containerRef.current || !window.google?.accounts?.id || initializedRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: "popup",
      callback: async (response: { credential?: string }) => {
        if (!response?.credential || pending) return;
        if (!turnstileToken) {
          onError("Selesaikan verifikasi keamanan terlebih dahulu.");
          return;
        }

        setPending(true);
        onError("");
        try {
          const result = await googleIdTokenLoginAction(response.credential, turnstileToken, requestedNext || null);
          onTokenConsumed?.();

          if (!result.success || !result.redirectTo) {
            onError(result.error || "Login Google gagal. Silakan coba lagi.");
            return;
          }

          if (result.requiresPhone) {
            setPhoneState({
              open: true,
              redirectTo: result.redirectTo,
              userName: result.userName,
            });
            return;
          }

          window.location.replace(result.redirectTo);
        } catch (error) {
          console.error("Google identity login failed:", error);
          onTokenConsumed?.();
          onError("Login Google gagal karena koneksi ke server terputus.");
        } finally {
          setPending(false);
        }
      },
    });

    containerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: mode === "signup" ? "signup_with" : "signin_with",
      width: Math.min(420, containerRef.current.clientWidth || 420),
      logo_alignment: "left",
    });
    initializedRef.current = true;
  }, [clientId, mode, onError, onTokenConsumed, pending, requestedNext, scriptReady, turnstileToken]);

  useEffect(() => {
    // Credential callback harus selalu membaca token Turnstile terbaru.
    if (initializedRef.current && scriptReady) {
      initializedRef.current = false;
      setScriptReady(false);
      queueMicrotask(() => setScriptReady(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnstileToken]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
        Google Identity belum aktif. Tambahkan NEXT_PUBLIC_GOOGLE_CLIENT_ID di Cloudflare sebelum deploy.
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => onError("Library Google Identity gagal dimuat.")}
      />

      <div className={`relative min-h-[44px] w-full flex justify-center ${disabled ? "opacity-50 pointer-events-none" : ""}`} aria-busy={pending}>
        <div ref={containerRef} className="w-full flex justify-center" />
        {pending && (
          <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#4A2F1B] border border-gray-200">
            <Loader2 size={18} className="animate-spin text-[#D6A34A]" /> Mengamankan login Google...
          </div>
        )}
      </div>

      <PhoneCompletionModal
        open={phoneState.open}
        redirectTo={phoneState.redirectTo}
        userName={phoneState.userName}
      />
    </>
  );
}
