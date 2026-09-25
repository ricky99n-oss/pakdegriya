import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // HAPUS output standalone dan external packages (sharp) 
  // karena tidak digunakan/didukung di Edge Runtime Cloudflare

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Wajib: Mengizinkan Next.js memuat gambar dari Supabase
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Pertahankan untuk upload panorama yang besar
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
};

export default nextConfig;