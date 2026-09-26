"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, X } from "lucide-react";
import type { AdminActionResult } from "@/lib/admin-action";

type Props = {
  action: (formData: FormData) => Promise<AdminActionResult>;
  children: React.ReactNode;
  className?: string;
  confirmMessage?: string;
  onSuccess?: () => void;
  refreshOnSuccess?: boolean;
};

export default function ActionForm({
  action,
  children,
  className,
  confirmMessage,
  onSuccess,
  refreshOnSuccess = true,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AdminActionResult | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setPending(true);
    setResult(null);
    try {
      const response = await action(new FormData(event.currentTarget));
      setResult(response);

      if (response.success) {
        onSuccess?.();
        if (response.redirectTo) router.push(response.redirectTo);
        else if (refreshOnSuccess) router.refresh();
      }
    } catch (error) {
      console.error("Admin action failed:", error);
      setResult({ success: false, error: "Koneksi ke server gagal. Silakan coba lagi." });
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} className={className} aria-busy={pending}>
        <fieldset disabled={pending} className="contents">
          {children}
        </fieldset>
        {pending && (
          <div className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-white rounded-2xl px-6 py-5 shadow-2xl border border-[#D6A34A]/30 flex items-center gap-3 text-[#4A2F1B] font-bold">
              <Loader2 className="animate-spin text-[#D6A34A]" size={22} /> Memproses perubahan...
            </div>
          </div>
        )}
      </form>

      {result && (
        <div className="fixed inset-x-0 top-5 z-[9999] flex justify-center px-4 pointer-events-none">
          <div className={`pointer-events-auto max-w-md w-full rounded-2xl shadow-2xl border p-4 flex gap-3 ${result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
            {result.success ? <CheckCircle2 className="shrink-0 mt-0.5" size={21} /> : <XCircle className="shrink-0 mt-0.5" size={21} />}
            <div className="flex-1">
              <p className="font-black text-sm">{result.success ? "Berhasil" : "Gagal"}</p>
              <p className="text-xs mt-1 leading-relaxed">{result.message || result.error || "Operasi selesai."}</p>
            </div>
            <button type="button" onClick={() => setResult(null)} className="self-start opacity-60 hover:opacity-100" aria-label="Tutup notifikasi">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
