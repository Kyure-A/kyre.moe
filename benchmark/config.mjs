import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export default {
  buildRepetitions: 3,
  browserRepetitions: 5,
  buildTimeoutMs: 300000,
  observationWindowMs: 15000,
  outputDirectory: resolve(root, "benchmark", "results"),
  chromeExecutable:
    process.env.CHROME_EXECUTABLE ??
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined),
  viewport: { width: 1440, height: 900 },
  benchmarkHostname: "kyre-benchmark.test",
  profile: {
    name: "desktop-4x-40ms-1.6mbps",
    cpuSlowdown: 4,
    latencyMs: 40,
    downloadBytesPerSecond: 1600000 / 8,
    uploadBytesPerSecond: 750000 / 8,
  },
  routes: [
    { path: "/ja", lang: "ja", selector: "h1" },
    { path: "/ja/blog", lang: "ja", selector: "h1", text: "ブログ" },
    {
      path: "/ja/blog/sheldon-nix",
      lang: "ja",
      selector: "article.blog-content",
    },
    {
      path: "/en/blog/sheldon-nix",
      lang: "en",
      selector: "article.blog-content",
    },
  ],
  navigation: { from: "/ja/blog", to: "/ja/blog/sheldon-nix" },
  variants: [
    {
      id: "next",
      label: "Next.js",
      root:
        process.env.BENCHMARK_NEXT_ROOT ??
        resolve(homedir(), ".codex/worktrees/next-comparison/kyre.moe"),
      commands: [["@node", "node_modules/next/dist/bin/next", "build"]],
      output: "out",
      outputCleanup: ["out"],
      cacheCleanup: [".next", "tsconfig.tsbuildinfo"],
      cacheInspection: [".next/cache", "tsconfig.tsbuildinfo"],
      commonIndex: "src/generated/blog-index.json",
      notes:
        "Next native production build includes its normal TypeScript validation. Installed source uses .next/cache; the CLI cleans other .next outputs while preserving cache.",
    },
    {
      id: "tanstack",
      label: "TanStack Start",
      root:
        process.env.BENCHMARK_TANSTACK_ROOT ??
        resolve(homedir(), ".codex/worktrees/tanstack-comparison/kyre.moe"),
      commands: [
        ["@node", "node_modules/vite/bin/vite.js", "build"],
        ["@node", "scripts/finalize-static.mjs"],
      ],
      output: "dist/client",
      outputCleanup: ["dist"],
      cacheCleanup: [".tanstack", "node_modules/.vite"],
      cacheInspection: [".tanstack", "node_modules/.vite"],
      commonIndex: "src/generated/blog-index.json",
      notes:
        "Installed Router generator uses .tanstack/tmp. Vite defaults cacheDir to node_modules/.vite, primarily for dev dependency optimization; cache byte snapshots show whether production build actually creates it. Vite build does not run TypeScript validation.",
    },
    {
      id: "rshono",
      label: "rshono",
      root: process.env.BENCHMARK_RSHONO_ROOT ?? root,
      commands: [
        ["@node", "node_modules/@rshono/core/bin/rshono.mjs", "build"],
        ["@node", "scripts/finalize-static.mjs"],
      ],
      output: "dist/client",
      outputCleanup: ["dist"],
      cacheCleanup: [
        ".rshono",
        "node_modules/.cache/rspack",
        "node_modules/.cache/rsbuild",
      ],
      cacheInspection: [
        ".rshono",
        "node_modules/.cache/rspack",
        "node_modules/.cache/rsbuild",
      ],
      commonIndex: "src/generated/blog-index.json",
      notes:
        "rshono does not configure persistent cache; installed Rspack 2.2.7 production normalization defaults cache to false. Warm is a repeated production build with OS caches retained, not an incremental compiler-cache build. Cache directories are still inspected to expose any configuration change.",
    },
  ],
};
