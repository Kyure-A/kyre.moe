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
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // budoux's "browser" field maps win.js -> win-browser.js which
      // references the global `window`. On the server we replace it
      // with the Node.js/JSDOM-based win.js.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /budoux[/\\](?:dist|module)[/\\]win-browser\.js$/,
          (resource: { request: string }) => {
            resource.request = resource.request.replace(
              /win-browser\.js$/,
              "win.js",
            );
          },
        ),
      );
    }
    return config;
  },
};

export default nextConfig;
