import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, parseArgs, saveJson } from "./lib.mjs";

const args = parseArgs();
if (args.help) {
  console.log(
    "node benchmark/snapshot-variants.mjs [--config config.mjs] [--output results-dir] [--variants next,tanstack,rshono] [--next-root dir] [--tanstack-root dir] [--rshono-root dir] [--playwright-module dir] [--chrome executable] [--dry-run]",
  );
  process.exit(0);
}
const config = await loadConfig(args);
const benchmarkRoot = dirname(fileURLToPath(import.meta.url));
const sourceDirectory = resolve(config.outputDirectory, "source");
if (args["dry-run"]) {
  console.log(
    JSON.stringify(
      {
        destination: sourceDirectory,
        variants: config.variants.map(({ id, root, output }) => ({
          id,
          root,
          output,
        })),
        index:
          "One disposable GIT_INDEX_FILE per variant; real index untouched",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const sha256 = (body) => createHash("sha256").update(body).digest("hex");
const comparePaths = (left, right) =>
  left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
const sourceDirectories = new Set([
  "app",
  "src",
  "scripts",
  "config",
  "patches",
  ".storybook",
  ".github",
  "benchmark",
  "test",
  "tests",
]);
const rootFiles = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".gitignore",
  ".gitattributes",
  ".npmrc",
  ".nvmrc",
  ".node-version",
  "biome.json",
  "biome.jsonc",
  "treefmt.toml",
  "flake.nix",
  "flake.lock",
  "devenv.nix",
  "devenv.yaml",
  "devenv.lock",
]);

// Only executable/configuration sources enter patches. Content and assets are
// regenerated from the user's article snapshot and fingerprinted separately.
const isSource = (path) => {
  const segments = path.split("/");
  if (
    segments.some((segment) =>
      /^(?:articles|artifacts|generated|node_modules|styled-system|results|out|dist|\.claude|\.codex|\.next|\.tanstack|\.rshono|\.cache)$/.test(
        segment,
      ),
    ) ||
    segments.some((segment) => /^README(?:\.|$)/i.test(segment)) ||
    /(?:^|\/)(?:routeTree\.gen\.ts|next-env\.d\.ts)$/.test(path) ||
    /(?:\.tsbuildinfo|\.log)$/.test(path)
  ) {
    return false;
  }
  if (path === "public/favicon.ico") return true;
  if (segments.length > 1) return sourceDirectories.has(segments[0]);
  return (
    rootFiles.has(path) ||
    /^(?:.+\.config\.[cm]?[jt]s|tsconfig(?:\.[^.]+)?\.json)$/.test(path)
  );
};

const git = (root, indexFile, command, input) =>
  new Promise((done, reject) => {
    const child = spawn("git", command, {
      cwd: root,
      env: {
        ...process.env,
        GIT_INDEX_FILE: indexFile,
        GIT_OPTIONAL_LOCKS: "0",
        GIT_LITERAL_PATHSPECS: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
    });
    const output = [];
    const errors = [];
    child.stdout.on("data", (chunk) => output.push(chunk));
    child.stderr.on("data", (chunk) => errors.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `git ${command[0]} failed in ${root}: ${Buffer.concat(errors).toString("utf8").trim()}`,
          ),
        );
      } else done(Buffer.concat(output));
    });
    child.stdin.on("error", (error) => {
      if (error.code !== "EPIPE") reject(error);
    });
    child.stdin.end(input);
  });

const fingerprint = (files) => {
  const sorted = files.toSorted(comparePaths);
  return { sha256: sha256(JSON.stringify(sorted)), files: sorted };
};

async function fingerprintDirectory(directory) {
  const files = [];
  async function visit(path = "") {
    const entries = await readdir(join(directory, path), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      const relativePath = path ? `${path}/${entry.name}` : entry.name;
      const fullPath = join(directory, relativePath);
      if (entry.isDirectory()) await visit(relativePath);
      else if (entry.isFile()) {
        const body = await readFile(fullPath);
        files.push({
          path: relativePath,
          bytes: body.length,
          sha256: sha256(body),
        });
      } else if (entry.isSymbolicLink()) {
        const target = await readlink(fullPath);
        files.push({
          path: relativePath,
          type: "symlink",
          target,
          sha256: sha256(target),
        });
      }
    }
  }
  await visit();
  return fingerprint(files);
}

// Hash indexed blobs, rather than reading the live files again: the manifest
// describes exactly the immutable source snapshot used for the saved patch.
async function fingerprintIndex(root, indexFile) {
  const listing = await git(root, indexFile, ["ls-files", "--stage", "-z"]);
  const sources = listing
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((entry) => {
      const tab = entry.indexOf("\t");
      const [mode, blob, stage] = entry.slice(0, tab).split(" ");
      return { path: entry.slice(tab + 1), mode, blob, stage };
    })
    .filter((entry) => isSource(entry.path));
  if (sources.some((entry) => entry.stage !== "0")) {
    throw new Error(`Unmerged source entries in ${root}`);
  }
  if (!sources.length) throw new Error(`No source files found in ${root}`);
  const bodies = await git(
    root,
    indexFile,
    ["cat-file", "--batch"],
    sources.map((entry) => `${entry.blob}\n`).join(""),
  );
  let offset = 0;
  const files = [];
  for (const source of sources) {
    const headerEnd = bodies.indexOf(10, offset);
    const [blob, type, size] = bodies
      .subarray(offset, headerEnd)
      .toString("utf8")
      .split(" ");
    const bytes = Number(size);
    if (
      headerEnd < offset ||
      blob !== source.blob ||
      type !== "blob" ||
      !Number.isSafeInteger(bytes) ||
      bytes < 0 ||
      headerEnd + bytes + 2 > bodies.length
    ) {
      throw new Error(`Invalid indexed blob for ${source.path}`);
    }
    offset = headerEnd + 1;
    const body = bodies.subarray(offset, offset + bytes);
    files.push({
      path: source.path,
      mode: source.mode,
      bytes,
      sha256: sha256(body),
    });
    offset += bytes + 1;
  }
  return fingerprint(files);
}

async function fingerprintCode(names) {
  const files = [];
  for (const path of names) {
    const body = await readFile(join(benchmarkRoot, path));
    files.push({ path, bytes: body.length, sha256: sha256(body) });
  }
  return fingerprint(files);
}

await mkdir(sourceDirectory, { recursive: true });
const variants = [];
for (const variant of config.variants) {
  if (!/^[a-z0-9_-]+$/.test(variant.id)) {
    throw new Error(`Invalid variant identifier: ${variant.id}`);
  }
  const temporary = await mkdtemp(join(tmpdir(), "kyre-benchmark-index-"));
  const indexFile = join(temporary, "index");
  try {
    await git(variant.root, indexFile, ["read-tree", "HEAD"]);
    const baseHead = (await git(variant.root, indexFile, ["rev-parse", "HEAD"]))
      .toString("utf8")
      .trim();
    const branch = (
      await git(variant.root, indexFile, ["branch", "--show-current"])
    )
      .toString("utf8")
      .trim();
    const candidates = (
      await git(variant.root, indexFile, [
        "ls-files",
        "--cached",
        "--others",
        "--exclude-standard",
        "-z",
      ])
    )
      .toString("utf8")
      .split("\0")
      .filter((path) => path && isSource(path));
    if (candidates.length) {
      await git(
        variant.root,
        indexFile,
        ["add", "-A", "--pathspec-from-file=-", "--pathspec-file-nul"],
        `${candidates.join("\0")}\0`,
      );
    }
    const patch = await git(variant.root, indexFile, [
      "diff",
      "--cached",
      "--binary",
      "--full-index",
      "--no-ext-diff",
      "--no-textconv",
      "--no-color",
      "--no-relative",
      "--src-prefix=a/",
      "--dst-prefix=b/",
      baseHead,
      "--",
    ]);
    const patchName = `${variant.id}.patch`;
    await writeFile(join(sourceDirectory, patchName), patch);
    variants.push({
      id: variant.id,
      root: variant.root,
      baseHead,
      branch: branch || null,
      patch: { path: patchName, bytes: patch.length, sha256: sha256(patch) },
      source: await fingerprintIndex(variant.root, indexFile),
      commonInputs: {
        generated: await fingerprintDirectory(
          join(variant.root, "src/generated"),
        ),
        public: await fingerprintDirectory(join(variant.root, "public")),
      },
      finalOutput: {
        directory: variant.output,
        ...(await fingerprintDirectory(join(variant.root, variant.output))),
      },
    });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

const manifest = {
  capturedAt: new Date().toISOString(),
  fingerprintDefinition:
    "SHA-256 of JSON.stringify(path-sorted file records); each file record includes its raw-byte SHA-256. Indexed source records also include Git mode. Symlinks record their target without following it.",
  replay:
    "Check out each baseHead, apply its binary patch with git apply --index, supply the same separately preserved user article snapshot, install the frozen dependencies, run common preparation/sync, then execute the recorded build commands. The repository's real index, branch and HEAD are never changed by this script.",
  outputNote:
    "Output fingerprints identify the measured artifacts. Framework-generated build IDs and externally fetched preview data may differ on a later rebuild; use the common input fingerprints to detect such differences.",
  patchExclusions:
    "User articles, README files, .claude/.codex/artifacts, generated code/data, styled-system, build outputs and caches. Public assets are regenerated/copied; public/favicon.ico is the sole public asset allowed in source patches.",
  environment: {
    NODE_OPTIONS: process.env.NODE_OPTIONS ?? null,
    chromeExecutable: config.chromeExecutable ?? null,
    playwrightModulePath:
      args["playwright-module"] ?? process.env.PLAYWRIGHT_MODULE_PATH ?? null,
  },
  measurementCode: await fingerprintCode([
    "config.mjs",
    "lib.mjs",
    "measure-builds.mjs",
    "measure-browser.mjs",
    "prepare-common.mjs",
    "static-server.mjs",
    "package.json",
  ]),
  postprocessCode: await fingerprintCode([
    "report.mjs",
    "report-ja.mjs",
    "plot-results.py",
  ]),
  snapshotCode: await fingerprintCode(["snapshot-variants.mjs"]),
  configOverride: args.config
    ? {
        path: resolve(args.config),
        sha256: sha256(await readFile(resolve(args.config))),
      }
    : null,
  variants,
};
await saveJson(join(sourceDirectory, "manifest.json"), manifest);
console.log(
  `Saved ${variants.length} source patches and ${sourceDirectory}/manifest.json`,
);
