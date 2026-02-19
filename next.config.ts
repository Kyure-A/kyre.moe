import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  serverExternalPackages: ["budoux", "markdown-it-budoux"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.squarespace-cdn.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // budoux uses a "browser" field to map win.js -> win-browser.js,
      // which references `window`. Disable browser field resolution
      // on the server to use the Node.js/JSDOM version instead.
      config.resolve = {
        ...config.resolve,
        aliasFields: (config.resolve?.aliasFields ?? []).filter(
          (field: string) => field !== "browser",
        ),
      };
    }
    return config;
  },
};

export default nextConfig;
