import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig(({ isSsrBuild }) => ({
  appType: "custom",
  plugins: [
    {
      name: "hono-client-runtime",
      enforce: "pre",
      resolveId(source, importer, options) {
        if (this.environment.name !== "client") return;
        const replacement = new Map([
          ["hono/jsx", "hono/jsx/dom"],
          ["hono/jsx/jsx-runtime", "hono/jsx/dom/jsx-runtime"],
          ["hono/jsx/jsx-dev-runtime", "hono/jsx/dom/jsx-dev-runtime"],
        ]).get(source);
        if (replacement)
          return this.resolve(replacement, importer, {
            ...options,
            skipSelf: true,
          });
      },
    },
    {
      name: "hono-development-pages",
      configureServer(server) {
        return () =>
          server.middlewares.use(async (request, response, next) => {
            if (
              request.method !== "GET" ||
              !request.headers.accept?.includes("text/html")
            ) {
              next();
              return;
            }
            try {
              const { default: app } =
                await server.ssrLoadModule("/src/server.tsx");
              const result = await app.request(
                new URL(request.url ?? "/", "http://localhost").href,
              );
              const html = await server.transformIndexHtml(
                request.url ?? "/",
                `<!doctype html>${await result.text()}`,
              );
              response.writeHead(result.status, {
                "Content-Type": "text/html; charset=utf-8",
              });
              response.end(html);
            } catch (error) {
              next(error);
            }
          });
      },
    },
  ],
  resolve: {
    alias: [
      { find: "@", replacement: `${root}src` },
      { find: "styled-system", replacement: `${root}styled-system` },
    ],
  },
  build: {
    outDir: isSsrBuild ? "dist/server" : "dist/client",
    emptyOutDir: true,
    copyPublicDir: !isSsrBuild,
    manifest: !isSsrBuild,
    assetsInlineLimit: (path) =>
      /\.(woff2?|ttf|otf)$/i.test(path) ? false : undefined,
    rollupOptions: {
      input: isSsrBuild ? "src/server.tsx" : "src/app/client.tsx",
    },
  },
}));
