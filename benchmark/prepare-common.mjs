import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const destinations = [];
for (let index = 0; index < args.length; index++) {
  if (args[index] !== "--copy-to" || !args[index + 1]) {
    throw new Error(
      "Usage: node benchmark/prepare-common.mjs [--copy-to PATH]...",
    );
  }
  destinations.push(resolve(args[++index]));
}
const resultsDirectory = join(root, "benchmark", "results");
await mkdir(resultsDirectory, { recursive: true });

async function run(command, commandArgs) {
  const started = performance.now();
  const child = spawn(command, commandArgs, {
    cwd: root,
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });
  const exitCode = await new Promise((done, reject) => {
    child.once("error", reject);
    child.once("exit", done);
  });
  if (exitCode !== 0)
    throw new Error(`${command} exited ${exitCode}\n${output}`);
  return { milliseconds: performance.now() - started, output };
}

const pipeline = [
  ["panda", join(root, "node_modules", ".bin", "panda"), ["codegen"]],
  ["org", process.execPath, ["scripts/export-org.mjs"]],
  ["images", process.execPath, ["scripts/copy-blog-images.mjs"]],
  [
    "content",
    join(root, "node_modules", ".bin", "tsx"),
    ["scripts/prepare-content.ts"],
  ],
];
const measurements = [];
// Only invalidate the two caches owned by the common generator. Dependencies,
// source articles, existing generated data and OS filesystem caches stay intact.
for (const path of [
  ".org-export-cache.json",
  "src/generated/.og-image-cache.json",
]) {
  await rm(join(root, path)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}
for (const mode of ["uncached", "cached"]) {
  const started = performance.now();
  const steps = {};
  let log = "";
  for (const [name, command, commandArgs] of pipeline) {
    const result = await run(command, commandArgs);
    steps[name] = result.milliseconds;
    log += `${name}: ${result.milliseconds.toFixed(1)} ms\n${result.output}\n`;
  }
  const milliseconds = performance.now() - started;
  measurements.push({ mode, milliseconds, steps });
  await writeFile(join(resultsDirectory, `common-${mode}.log`), log);
  console.log(
    `Common preparation (${mode}): ${(milliseconds / 1000).toFixed(2)} s`,
  );
}

async function digestDirectory(directory) {
  const hash = createHash("sha256");
  let files = 0;
  let bytes = 0;
  async function visit(relative = "") {
    const entries = await readdir(join(directory, relative), {
      withFileTypes: true,
    });
    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name, "en"),
    )) {
      const name = join(relative, entry.name);
      if (entry.isDirectory()) await visit(name);
      else if (entry.isFile()) {
        const data = await readFile(join(directory, name));
        hash.update(name).update("\0").update(data);
        files++;
        bytes += data.length;
      }
    }
  }
  await visit();
  return { sha256: hash.digest("hex"), files, bytes };
}
const inputs = {};
for (const directory of ["src/generated", "public"]) {
  inputs[directory] = await digestDirectory(join(root, directory));
  for (const destination of destinations) {
    if (destination === root)
      throw new Error(
        "A comparison destination must differ from the source workspace",
      );
    await cp(join(root, directory), join(destination, directory), {
      recursive: true,
    });
    const copied = await digestDirectory(join(destination, directory));
    if (copied.sha256 !== inputs[directory].sha256) {
      throw new Error(
        `Snapshot differs after copy: ${destination}/${directory}`,
      );
    }
  }
}
const index = JSON.parse(
  await readFile(join(root, "src/generated/blog-index.json"), "utf8"),
);
const paths = JSON.parse(
  await readFile(join(root, "src/generated/prerender-paths.json"), "utf8"),
);
await writeFile(
  join(resultsDirectory, "common.json"),
  `${JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      node: process.version,
      measurements,
      inputs,
      posts: index.posts.length,
      publicPages: paths.filter((path) => path !== "/404").length,
      destinations,
      notes:
        "One uncached and one cached preparation run; network link previews and avatars are fetched here, outside the framework comparison. Hero WebP assets follow the Pages CI settings and are prepared before these timings.",
    },
    null,
    2,
  )}\n`,
);
