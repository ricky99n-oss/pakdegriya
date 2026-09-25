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