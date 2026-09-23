"use client";

// DEKLARASI MUTLAK UNTUK CLOUDFLARE PAGES
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
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>Terjadi Kesalahan Sistem Fatal</h2>
          <p style={{ marginBottom: "24px", color: "#666" }}>Sistem gagal memuat halaman ini.</p>
          <button
            onClick={() => reset()}
            style={{ padding: "12px 24px", backgroundColor: "#D6A34A", color: "#281C15", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}
          >
            Coba Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}