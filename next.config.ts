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
  // 1. ALIAS UNTUK WEBPACK
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        net: "node:net",
        tls: "node:tls",
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "node:util/types": false,
      };
    }
    return config;
  },
  // 2. ALIAS UNTUK TURBOPACK (Default Next.js 16)
  turbopack: {
    resolveAlias: {
      net: "node:net",
      tls: "node:tls",
    },
  },
};

export default nextConfig;