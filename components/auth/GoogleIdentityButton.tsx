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

function isMobileLikeBrowser() {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || window.matchMedia("(pointer: coarse)").matches;
}

function buildRedirectState(nextPath: string, turnstileToken: string) {
  return encodeURIComponent(JSON.stringify({
    next: nextPath || "/",
    turnstile: turnstileToken,
  }));
}

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
  const pendingRef = useRef(false);
  const tokenRef = useRef(turnstileToken);
  const nextRef = useRef(requestedNext);
  const onErrorRef = useRef(onError);
  const onTokenConsumedRef = useRef(onTokenConsumed);
  const lastRedirectStateRef = useRef("");

  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [redirectMode, setRedirectMode] = useState<boolean | null>(null);
  const [phoneState, setPhoneState] = useState<PhoneState>({ open: false, redirectTo: "/" });
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => { tokenRef.current = turnstileToken; }, [turnstileToken]);
  useEffect(() => { nextRef.current = requestedNext; }, [requestedNext]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onTokenConsumedRef.current = onTokenConsumed; }, [onTokenConsumed]);
  useEffect(() => { setRedirectMode(isMobileLikeBrowser()); }, []);

  const renderGoogleButton = () => {
    if (!containerRef.current || !window.google?.accounts?.id) return;

    const redirectState = redirectMode
      ? buildRedirectState(nextRef.current, tokenRef.current)
      : "";

    containerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: mode === "signup" ? "signup_with" : "signin_with",
      width: Math.min(420, containerRef.current.clientWidth || 420),
      logo_alignment: "left",
      ...(redirectMode ? { state: redirectState } : {}),
    });

    lastRedirectStateRef.current = redirectState;
  };

  useEffect(() => {
    if (
      redirectMode === null ||
      !scriptReady ||
      !clientId ||
      !containerRef.current ||
      !window.google?.accounts?.id ||
      initializedRef.current ||
      (redirectMode && !turnstileToken)
    ) return;

    const googleId = window.google.accounts.id;
    const loginUri = `${window.location.origin}/auth/google-redirect`;

    const config: Record<string, unknown> = {
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: redirectMode ? "redirect" : "popup",
    };

    if (redirectMode) {
      config.login_uri = loginUri;
    } else {
      config.callback = async (response: { credential?: string }) => {
        if (!response?.credential || pendingRef.current) return;

        const latestTurnstileToken = tokenRef.current;
        if (!latestTurnstileToken) {
          onErrorRef.current("Selesaikan verifikasi keamanan terlebih dahulu.");
          return;
        }

        pendingRef.current = true;
        setPending(true);
        onErrorRef.current("");

        try {
          const result = await googleIdTokenLoginAction(
            response.credential,
            latestTurnstileToken,
            nextRef.current || null
          );
          onTokenConsumedRef.current?.();

          if (!result.success || !result.redirectTo) {
            onErrorRef.current(result.error || "Login Google gagal. Silakan coba lagi.");
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
          onTokenConsumedRef.current?.();
          onErrorRef.current("Login Google gagal karena koneksi ke server terputus.");
        } finally {
          pendingRef.current = false;
          setPending(false);
        }
      };
    }

    googleId.initialize(config);
    initializedRef.current = true;
    renderGoogleButton();
  // renderGoogleButton sengaja tidak dimasukkan dependency; ia hanya memakai refs terbaru.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, mode, redirectMode, scriptReady, turnstileToken]);

  // Jika Turnstile mendapatkan token baru sebelum user menekan Google, cukup
  // render ulang tombol dengan state terbaru. GIS tidak perlu initialize ulang.
  useEffect(() => {
    if (!redirectMode || !initializedRef.current || !turnstileToken || !scriptReady) return;
    const nextState = buildRedirectState(requestedNext, turnstileToken);
    if (nextState === lastRedirectStateRef.current) return;
    renderGoogleButton();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectMode, requestedNext, scriptReady, turnstileToken]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
        Google Identity belum aktif. Tambahkan NEXT_PUBLIC_GOOGLE_CLIENT_ID di Cloudflare sebelum deploy.
      </div>
    );
  }

  const effectiveDisabled = disabled || pending || redirectMode === null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => onError("Library Google Identity gagal dimuat.")}
      />

      <div
        className={`relative min-h-[44px] w-full flex justify-center ${effectiveDisabled ? "opacity-50 pointer-events-none" : ""}`}
        aria-busy={pending}
      >
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
