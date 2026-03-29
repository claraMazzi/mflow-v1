import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

/**
 * Diagram image URLs are absolute (e.g. https://api…/api/uploads/:id).
 * next/image proxies them via /_next/image; hosts must be allowlisted or optimization returns 400.
 */
function apiUploadRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    { protocol: "https", hostname: "api.mflow.tech", pathname: "/api/uploads/**" },
    { protocol: "http", hostname: "localhost", pathname: "/api/uploads/**" },
    { protocol: "http", hostname: "127.0.0.1", pathname: "/api/uploads/**" },
  ];

  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) {
    try {
      const u = new URL(fromEnv);
      const protocol = u.protocol === "https:" ? "https" : "http";
      const entry: RemotePattern = {
        protocol,
        hostname: u.hostname,
        pathname: "/api/uploads/**",
        ...(u.port ? { port: u.port } : {}),
      };
      const isDupe = patterns.some(
        (p) =>
          p.protocol === entry.protocol &&
          p.hostname === entry.hostname &&
          (p.port ?? "") === (entry.port ?? "")
      );
      if (!isDupe) {
        patterns.push(entry);
      }
    } catch {
      /* invalid NEXT_PUBLIC_API_URL */
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  images: {
    remotePatterns: [
      ...apiUploadRemotePatterns(),
      {
        protocol: "http",
        hostname: "www.plantuml.com",
        pathname: "/plantuml/**",
      },
      {
        protocol: "https",
        hostname: "www.plantuml.com",
        pathname: "/plantuml/**",
      },
      { protocol: "http", hostname: "planttext.com", pathname: "/**" },
      { protocol: "https", hostname: "planttext.com", pathname: "/**" },
    ],
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
