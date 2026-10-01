import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { listFiles } from "./lib.mjs";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".rsc": "text/x-component; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
};

export const createStaticServer = async ({ root, port = 0 }) => {
  const absoluteRoot = resolve(root);
  const assets = new Map();
  for (const filePath of await listFiles(absoluteRoot)) {
    const body = await readFile(filePath);
    const extension = extname(filePath);
    const textAsset = [
      ".html",
      ".css",
      ".js",
      ".mjs",
      ".json",
      ".rsc",
      ".xml",
      ".txt",
      ".svg",
    ].includes(extension);
    assets.set(`/${relative(absoluteRoot, filePath).split("\\").join("/")}`, {
      body,
      compressed: textAsset ? gzipSync(body, { level: 6 }) : null,
      contentType: mimeTypes[extension] ?? "application/octet-stream",
    });
  }
  if (!assets.size)
    throw new Error(`No built static assets at ${absoluteRoot}`);
  const server = createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(request.url, "http://benchmark.invalid").pathname,
      );
    } catch {
      response.writeHead(400);
      response.end();
      return;
    }
    const normalizedPath = pathname === "/" ? "" : pathname.replace(/\/$/, "");
    const keys = [
      pathname,
      `${normalizedPath}.html`,
      `${normalizedPath}/index.html`,
    ];
    const matchedKey = keys.find((key) => assets.has(key));
    const asset = assets.get(matchedKey ?? "/404.html");
    if (!asset) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const compressed =
      asset.compressed &&
      /\bgzip\b/.test(request.headers["accept-encoding"] ?? "");
    const body = compressed ? asset.compressed : asset.body;
    response.writeHead(matchedKey ? 200 : 404, {
      "Content-Type": asset.contentType,
      "Content-Length": body.length,
      "Cache-Control": "public, max-age=3600",
      "Timing-Allow-Origin": "*",
      Vary: "Accept-Encoding",
      ...(compressed ? { "Content-Encoding": "gzip" } : {}),
    });
    response.end(request.method === "HEAD" ? undefined : body);
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolveListen);
  });
  return {
    port: server.address().port,
    fileCount: assets.size,
    close: () =>
      new Promise((resolveClose, reject) =>
        server.close((error) => (error ? reject(error) : resolveClose())),
      ),
  };
};
