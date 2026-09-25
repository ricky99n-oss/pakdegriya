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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "node:util/types": false,
      };
    }
    return config;
  },
  turbopack: {}, // <-- Tambahkan baris ini untuk mengatasi error Turbopack Next.js 16
};

export default nextConfig;