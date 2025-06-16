
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
        "*.cloudworkstations.dev", // Allow requests from any subdomain of cloudworkstations.dev
        // You might want to add http://localhost:YOUR_PREVIEW_PORT if you use a local proxy for Firebase Studio
    ]
  }
};

export default nextConfig;
