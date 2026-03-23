import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  images: {
    domains: ['localhost', '127.0.0.1', 'planttext.com', 'www.plantuml.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide buffer polyfill for browser environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
      };
    }
    return config;
  },
};

export default nextConfig;
