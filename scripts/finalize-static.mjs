import assert from "node:assert/strict";
import { access, copyFile, cp, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import paths from "../src/generated/prerender-paths.json" with { type: "json" };

const output = "dist/client";
await rm(output, { recursive: true, force: true });
await rename("dist/public", output);
await rename("dist/static", join(output, "_static"));
await cp("dist/ssg", output, { recursive: true });
for (const path of paths) {
  const directory = join(output, decodeURIComponent(path));
  await access(join(directory, "index.html"));
  await access(join(directory, "index.rsc"));
}
await copyFile(join(output, "404/index.html"), join(output, "404.html"));
await writeFile(join(output, ".nojekyll"), "");
assert.ok(paths.length > 0, "Static paths cannot be empty");
console.log(`Exported ${paths.length} HTML and Flight pairs for GitHub Pages.`);
