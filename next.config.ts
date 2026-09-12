import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode standalone untuk kemudahan deploy ke cPanel yang sudah kita buat
  output: 'standalone',
  
  // Memberitahu Next.js bahwa Sharp adalah paket backend murni
  serverExternalPackages: ['sharp'],
  
  experimental: {
    serverActions: {
      // Menaikkan batas ukuran upload menjadi 50MB (default hanya 1MB)
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;