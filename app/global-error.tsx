"use client";

// DEKLARASI MUTLAK UNTUK MENIMPA NODE.JS BAWAAN NEXT.JS
export const runtime = "edge";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF7E8", fontFamily: "sans-serif", color: "#281C15" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "#D6A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "bold", marginBottom: "24px" }}>P</div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>Terjadi Kesalahan Sistem</h2>
          <p style={{ marginBottom: "24px", color: "#666" }}>Sistem gagal memuat halaman ini. Jangan khawatir, silakan coba lagi.</p>
          <button
            onClick={() => reset()}
            style={{ padding: "12px 24px", backgroundColor: "#D6A34A", color: "#281C15", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      </body>
    </html>
  );
}