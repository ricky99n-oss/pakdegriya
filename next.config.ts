import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // TAMBAHAN: Security Headers untuk memperbaiki nilai F ke A
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { 
            key: "Content-Security-Policy", 
            // Mengizinkan resource dari domain sendiri, Supabase, dan Cloudflare Analytics
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co;" 
          }
        ],
      },
    ];
  },
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "node:util/types": false,
      };

      // KUNCI UTAMA: Jika Next.js memaksa kompilasi Edge, 
      // paksa Webpack untuk membiarkan modul jaringan lolos tanpa dibajak.
      if (nextRuntime === "edge") {
        if (!Array.isArray(config.externals)) {
          config.externals = config.externals ? [config.externals] : [];
        }
        config.externals.push("net", "tls", "node:net", "node:tls");
      }
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;