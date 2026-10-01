import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve } from "node:path";

const root = resolve("dist/client");
const port = Number(process.env.PORT ?? 4173);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
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
  ".wasm": "application/wasm",
};

const fileExists = async (path) =>
  (await stat(path).catch(() => null))?.isFile();

createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    let file = resolve(root, `.${pathname}`);
    const relativePath = relative(root, file);
    if (
      relativePath === ".." ||
      relativePath.startsWith("../") ||
      isAbsolute(relativePath)
    ) {
      response.writeHead(400);
      response.end();
      return;
    }
    if (!(await fileExists(file))) file = resolve(file, "index.html");
    const found = await fileExists(file);
    if (!found) file = resolve(root, "404.html");
    const body = await readFile(file);
    response.writeHead(found ? 200 : 404, {
      "Content-Type": mimeTypes[extname(file)] ?? "application/octet-stream",
      "Content-Length": body.length,
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(400);
    response.end("Unable to serve this request.");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static site: http://localhost:${port}`);
});
