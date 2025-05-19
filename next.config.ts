
import type { NextConfig } from 'next';
// import type { Configuration as WebpackConfiguration } from 'webpack'; // Optional: For stronger typing of 'config'

const nextConfig: NextConfig = {
  /* config options here */
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
  webpack: (config: any /* type it as WebpackConfiguration if you have webpack types installed */) => {
    // Ensure externals is an array (Next.js usually initializes it as one)
    if (!Array.isArray(config.externals)) {
        config.externals = [];
    }
    
    config.externals.push({
      '@prisma/client': '@prisma/client',
    });
    
    return config;
  },
};

export default nextConfig;
