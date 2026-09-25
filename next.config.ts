import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. KUNCI UTAMA: Cegah Next.js merusak library postgres dengan memblokir bundling-nya
  serverExternalPackages: ["postgres"],
  
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
  turbopack: {},
};

export default nextConfig;