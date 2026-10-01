import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import defaults from "./config.mjs";

export const parseArgs = () => {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const key = process.argv[i];
    if (!key.startsWith("--")) throw new Error(`Expected --option, got ${key}`);
    if (
      [
        "--help",
        "--dry-run",
        "--screenshots",
        "--native",
        "--skip-navigation",
      ].includes(key)
    )
      args[key.slice(2)] = true;
    else {
      const value = process.argv[++i];
      if (!value || value.startsWith("--"))
        throw new Error(`Missing value for ${key}`);
      args[key.slice(2)] = value;
    }
  }
  return args;
};

export const loadConfig = async (args) => {
  const override = args.config
    ? (await import(pathToFileURL(resolve(args.config)).href)).default
    : {};
  const config = {
    ...defaults,
    ...override,
    profile: { ...defaults.profile, ...override.profile },
  };
  config.variants = config.variants.map((variant) => ({
    ...variant,
    root: resolve(args[`${variant.id}-root`] ?? variant.root),
  }));
  if (args.variants)
    config.variants = config.variants.filter((variant) =>
      args.variants.split(",").includes(variant.id),
    );
  if (!config.variants.length)
    throw new Error("No benchmark variants selected.");
  config.outputDirectory = resolve(args.output ?? config.outputDirectory);
  if (args.repetitions) {
    const repetitions = Number(args.repetitions);
    if (!Number.isInteger(repetitions) || repetitions < 1)
      throw new Error("repetitions must be a positive integer");
    config.buildRepetitions = repetitions;
    config.browserRepetitions = repetitions;
  }
  if (args.chrome) config.chromeExecutable = resolve(args.chrome);
  if (args["window-ms"]) config.observationWindowMs = Number(args["window-ms"]);
  if (
    !Number.isFinite(config.observationWindowMs) ||
    config.observationWindowMs < 1000
  )
    throw new Error("observationWindowMs must be at least 1000");
  if (args.native)
    config.profile = {
      name: "desktop-native-local",
      cpuSlowdown: 1,
      latencyMs: 0,
      downloadBytesPerSecond: -1,
      uploadBytesPerSecond: -1,
    };
  return config;
};

export const saveJson = async (filePath, value) => {
  await mkdir(dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  const { rename } = await import("node:fs/promises");
  await rename(temporary, filePath);
};

export const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    },
  );
  const files = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(entryPath)));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files;
};

export const pathStats = async (filePath) => {
  const info = await stat(filePath).catch(() => null);
  if (!info) return { exists: false, bytes: 0, files: 0 };
  if (info.isFile()) return { exists: true, bytes: info.size, files: 1 };
  let bytes = 0;
  const files = await listFiles(filePath);
  for (const file of files) bytes += (await stat(file)).size;
  return { exists: true, bytes, files: files.length };
};

export const inspectCaches = async (variant) => {
  const cache = {};
  for (const cachePath of variant.cacheInspection ?? [])
    cache[cachePath] = await pathStats(resolve(variant.root, cachePath));
  return cache;
};

export const safeCleanup = async (variant, paths) => {
  const root = await realpath(variant.root);
  if (!(await stat(resolve(root, "package.json"))).isFile())
    throw new Error(`No project package.json: ${root}`);
  const allowed =
    /^(?:\.next|out|dist|\.tanstack|\.rshono|\.vite|\.rsbuild|\.rspack|tsconfig\.tsbuildinfo|node_modules\/\.vite|node_modules\/\.cache\/(?:rspack|rsbuild|rshono)(?:\/[^.][^/]*)*)$/;
  for (const ownedPath of paths) {
    if (!allowed.test(ownedPath))
      throw new Error(
        `Refusing to remove unrecognized output/cache path: ${ownedPath}`,
      );
    const target = resolve(root, ownedPath);
    const withinRoot = relative(root, target);
    if (!withinRoot || withinRoot.startsWith("..") || isAbsolute(withinRoot))
      throw new Error(`Unsafe cleanup target: ${target}`);
    const info = await lstat(target).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (info?.isSymbolicLink())
      throw new Error(`Refusing symlink cleanup target: ${target}`);
    const existingParent = await realpath(dirname(target)).catch(() => null);
    if (existingParent && relative(root, existingParent).startsWith(".."))
      throw new Error(`Cleanup parent escapes project: ${target}`);
    await rm(target, { recursive: true, force: true });
  }
};

export const inspectOutput = async (variant) => {
  const root = resolve(variant.root, variant.output);
  const files = await listFiles(root);
  const result = {
    bytes: 0,
    files: files.length,
    htmlFiles: 0,
    jsBytes: 0,
    jsGzipBytes: 0,
    cssBytes: 0,
    cssGzipBytes: 0,
  };
  for (const file of files) {
    const bytes = await readFile(file);
    result.bytes += bytes.length;
    if (file.endsWith(".html")) result.htmlFiles++;
    for (const extension of ["js", "css"])
      if (file.endsWith(`.${extension}`)) {
        result[`${extension}Bytes`] += bytes.length;
        result[`${extension}GzipBytes`] += gzipSync(bytes, { level: 6 }).length;
      }
  }
  return result;
};

export const environment = () => ({
  recordedAt: new Date().toISOString(),
  nodeVersion: process.version,
  nodeExecutable: process.execPath,
  platform: process.platform,
  architecture: process.arch,
  osRelease: os.release(),
  cpuModel: os.cpus()[0]?.model,
  logicalCpuCount: os.cpus().length,
  memoryBytes: os.totalmem(),
  coldDefinition:
    "Installed dependencies and OS file cache retained; configured framework persistent caches and previous outputs removed before each sample.",
  warmDefinition:
    "Previous static outputs removed; configured framework persistent caches retained from the previous successful build of the same variant. No dev server or build process is reused.",
});

export const variantMetadata = async (variant) => {
  const require = createRequire(resolve(variant.root, "package.json"));
  const versions = {};
  for (const name of [
    "react",
    "react-dom",
    "next",
    "@tanstack/react-start",
    "@tanstack/react-router",
    "@rshono/core",
    "vite",
    "@rspack/core",
    "react-server-dom-rspack",
  ]) {
    try {
      versions[name] = require(`${name}/package.json`).version;
    } catch {
      /* Optional framework package. */
    }
  }
  try {
    const coreRequire = createRequire(
      require.resolve("@rshono/core/package.json"),
    );
    for (const name of ["@rspack/core", "react-server-dom-rspack"]) {
      try {
        versions[name] = coreRequire(`${name}/package.json`).version;
      } catch {
        /* Optional transitive package. */
      }
    }
  } catch {
    /* This variant does not install rshono. */
  }
  const indexPath = resolve(
    variant.root,
    variant.commonIndex ?? "src/generated/blog-index.json",
  );
  const commonInputHash = await readFile(indexPath)
    .then((body) => createHash("sha256").update(body).digest("hex"))
    .catch(() => null);
  const git = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: variant.root,
    encoding: "utf8",
  });
  return {
    ...variant,
    versions,
    commonInputHash,
    gitHead: git.status === 0 ? git.stdout.trim() : null,
  };
};

export const validateCommonInputs = (variants) => {
  if (variants.some((variant) => !variant.commonInputHash))
    throw new Error(
      "Missing common blog index. Run shared preparation/sync before measuring.",
    );
  if (new Set(variants.map((variant) => variant.commonInputHash)).size !== 1)
    throw new Error(
      "Common blog index hashes differ. Sync identical generated inputs before measuring.",
    );
  if (
    variants.some((variant) => !variant.versions.react) ||
    new Set(variants.map((variant) => variant.versions.react)).size !== 1
  )
    throw new Error(
      "Installed React versions are missing/different. Align variants before measuring.",
    );
};

export const isCancelledSubresource = (request) =>
  request.failure?.errorText === "net::ERR_ABORTED" &&
  request.resourceType !== "document" &&
  !request.isNavigationRequest;

export const runCommand = (command, root, log, timeoutMs) =>
  new Promise((resolveCommand, reject) => {
    const executable = command[0] === "@node" ? process.execPath : command[0];
    const started = performance.now();
    log.write(`\n$ ${command.join(" ")}\n`);
    const child = spawn(executable, command.slice(1), {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      env: {
        ...process.env,
        CI: "1",
        NEXT_TELEMETRY_DISABLED: "1",
        NO_COLOR: "1",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.once("error", reject);
    child.once("close", (exitCode, signal) =>
      resolveCommand({
        command,
        elapsedMs: performance.now() - started,
        exitCode,
        signal,
      }),
    );
  });

export const createLog = async (filePath) => {
  await mkdir(dirname(filePath), { recursive: true });
  return createWriteStream(filePath);
};

export const median = (values) => {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!finite.length) return null;
  const middle = Math.floor(finite.length / 2);
  return finite.length % 2
    ? finite[middle]
    : (finite[middle - 1] + finite[middle]) / 2;
};

export const rotate = (values, round) =>
  values.map((_value, index) => values[(index + round) % values.length]);
