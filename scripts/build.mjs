import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

try {
  await rm("dist", { recursive: true, force: true });
  await build();
  await build({ build: { ssr: "src/server.tsx" } });
  const { createApp } = await import(
    pathToFileURL(join(process.cwd(), "dist/server/server.js"))
  );
  const manifest = JSON.parse(
    await readFile("dist/client/.vite/manifest.json", "utf8"),
  );
  const entry = manifest["src/app/client.tsx"];
  const assets = {
    script: `/${entry.file}`,
    styles: (entry.css ?? []).map((file) => `/${file}`),
  };
  const app = createApp(assets);
  const paths = JSON.parse(
    await readFile("src/generated/prerender-paths.json", "utf8"),
  );
  if (!paths.length) throw new Error("Static paths cannot be empty");
  for (const path of paths) {
    const response = await app.request(`https://kyre.moe${path}`);
    if (!response.ok)
      throw new Error(`${path}: prerender failed (${response.status})`);
    const output = join("dist/client", decodeURIComponent(path), "index.html");
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `<!doctype html>${await response.text()}`);
  }
  await copyFile("dist/client/404/index.html", "dist/client/404.html");
  await writeFile("dist/client/.nojekyll", "");
  await copyFile(
    "src/shared/icons/LICENSE-icons.md",
    "dist/client/assets/icon-licenses.txt",
  );
  await rm("dist/client/.vite", { recursive: true });
  console.log(`Exported ${paths.length} Hono JSX pages for GitHub Pages.`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
