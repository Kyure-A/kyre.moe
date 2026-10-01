# kyre.moe framework comparison

This harness compares the actual Next.js, TanStack Start, and rshono static applications. It keeps preparation separate from native framework build time and serves every output with one common static server. Framework marketing/bare-app benchmarks are not mixed into these measurements.

Use the same Node executable for all commands. The initial machine has Node 26.5.0, macOS arm64, and an existing Google Chrome 154 installation. Keep other build processes stopped during measurement. Dependency installation and source changes must finish first.

## Shared inputs

The root-owned `prepare-common.mjs` prepares Panda CSS, Org exports, blog images, rendered blog JSON, OGP assets, and production WebP images. It measures the shared preparation separately, writes `results/common.json`, and copies identical generated content/public assets into the comparison roots. Run it before native builds. Inspect its `--help` for its sync options.

Each variant must use the same React version, published routes, article HTML, fonts/CSS, images, metadata, and application UI. `builds.json` and browser JSON record the SHA-256 of `src/generated/blog-index.json` and installed package versions. `common.json` records complete generated/public fingerprints. Investigate differing fingerprints or failed page assertions before comparing speed.

Fonts are emitted as separate resources in every variant. Next already does this; Vite's font-only `assetsInlineLimit` override and rshono's font-only `asset/resource` rule prevent unused KaTeX/subset fonts from entering the initial CSS. Other asset defaults remain intact. The rshono default embedded about 105 KiB of compressed font data in CSS; that preliminary diagnostic is preserved separately and excluded from the final comparison. This compares the configured application implementations, rather than untouched framework defaults.

## Build measurements

The defaults use this checkout for the adopted rshono implementation and `~/.codex/worktrees/{next,tanstack}-comparison/kyre.moe` for the other variants. Roots can be overridden without editing tracked files:

```sh
node benchmark/measure-builds.mjs --dry-run \
  --next-root /path/to/next --tanstack-root /path/to/tanstack --rshono-root /path/to/rshono

node benchmark/measure-builds.mjs \
  --next-root /path/to/next --tanstack-root /path/to/tanstack --rshono-root /path/to/rshono
```

The default is three cold and three warm samples per variant, run serially with rotating variant order. Only explicit framework output/cache paths are deleted, using checked `fs.rm` calls. The script rejects project-root deletions, unrecognized paths, and symlinks. Commands use argument arrays without a shell; `@node` resolves to the harness's Node executable. `--dry-run` prints the exact command and cleanup plan without building or deleting anything.

Cold means installed dependencies and OS filesystem cache are retained, while configured framework caches and previous build output are removed before each sample. Warm means output is removed and existing framework caches are retained from that variant's prior successful build. It does not mean an already-running compiler or server. Next's `.next/cache` includes Turbopack/TypeScript state; the Router generator uses `.tanstack/tmp`; Vite's `node_modules/.vite` is usually a dev optimization cache. Confirm rshono/Rspack's installed cache configuration before measuring. Cache existence, bytes, and file counts before and after each run expose absent/unused caches.

Only the native production build and required static finalizer are timed. Next's normal TypeScript validation stays part of its native build; Vite's build does not type-check. The result is native app build wall time, not equal-work pure compiler performance. Output-size inspection and gzip calculations happen after the timer stops. A failed build saves partial results and its log, then stops.

## Browser measurements

`benchmark/package.json` pins `playwright-core` 1.62.1. For portable local setup, run the repository's pnpm 9 environment in `benchmark/`; this adds no global tools and does not download a browser:

```sh
nix develop -c sh -c 'cd benchmark && pnpm install'
```

Alternatively use the already-bundled Playwright module directory supplied by Codex workspace dependencies:

```sh
export PLAYWRIGHT_MODULE_PATH=/absolute/path/to/bundled/node_modules
```

Use an existing Chrome executable. On macOS the harness defaults to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; use `--chrome /path/to/chrome` or `CHROME_EXECUTABLE` on another machine. It launches an isolated headless browser and never opens or uses the user's regular Chrome profile.

```sh
node benchmark/measure-browser.mjs --dry-run
node benchmark/measure-browser.mjs --chrome /path/to/chrome
node benchmark/report.mjs
node benchmark/report-ja.mjs
```

The primary profile uses 1440×900, CPU slowdown 4×, 40 ms network latency, 1.6 Mbps download, 0.75 Mbps upload, dark theme, normal motion, locale ja-JP, and time zone Asia/Tokyo. Five repetitions per route use fresh contexts and disabled HTTP caches. The default finite observation window is 15 seconds; override it with `--window-ms`. Four routes cover Home, the Japanese blog index, and Japanese/English versions of the same article. The original app's localhost image fallback changes PNG/WebP behavior, so all variants use `kyre-benchmark.test` with a Chrome host-resolver mapping to 127.0.0.1.

The common server reads/precompresses static assets before measurement, uses gzip level 6 and identical cache headers, and supports both `path/index.html` and Next's `path.html`. `.rsc` files are served as ordinary static resources; there is no custom RSC negotiation or framework server. All external requests are blocked uniformly and retained in raw logs.

FCP, the last LCP candidate within the window, CLS session maximum, long-task duration/count, a blocking-time proxy, initial completed JS/CSS encoded/decoded body bytes, main HTML encoded/decoded bytes, total encoded same-origin payload, font/image encoded bytes, request count, browser exceptions, console errors, HTTP failures, and content/language assertions are saved. HTML includes inline RSC/JSON/bootstrap data; JS bytes alone do not describe initial payload. Total payload and request count include the main document and main-frame-observed completed same-origin HTTP resources, excluding external blocked requests. Subframes are logged separately rather than automatically added to the primary totals; the measured pages have none. A missing/late LCP or unfinished document is an invalid/censored sample, never a zero. Raw pending-request diagnostics are sampled before cleanup; budget totals filter completion times to the observation window. The blocking proxy is not Lighthouse TBT/field INP. Home's WebGL/animation depends on GPU/driver/headless behavior, which is recorded when Chrome exposes it.

The additional blog-index → article test clicks an actual link after index loading. A capture-phase click handler saves `performance.timeOrigin + performance.now()` in sessionStorage so the start survives a hard reload; the end timestamp is taken in the browser after URL/content availability plus two animation frames. Playwright actionability/scroll time is excluded. A change in `performance.timeOrigin` classifies a hard navigation. Framework prefetch remains enabled. This is DOM ready navigation latency, not visual readiness or INP; opacity/view transitions may still be active.

`--screenshots` saves first-round screenshots after metric collection. `--native` runs an optional unthrottled local profile into `browser-native.json`. `--skip-navigation` disables the interaction test. `--repetitions`, `--variants`, `--output`, and variant-root flags work in both runners. The report shows medians only for valid samples, counts failures, and links all raw data.

## Custom configuration and outputs

For another checkout layout, CLI, cache path, route, viewport, or network profile, create a local `.mjs` configuration with a default-exported object and pass `--config /path/to/config.mjs` to every runner/report. Top-level keys override `benchmark/config.mjs`; `profile` merges fields. Replacing `variants` requires complete variant objects with `id`, `label`, `root`, `commands`, `output`, `outputCleanup`, `cacheCleanup`, `cacheInspection`, and `commonIndex`. Unsupported cleanup paths are refused instead of silently removed.

```js
import base from '/path/to/kyre.moe/benchmark/config.mjs'
export default {
  ...base,
  observationWindowMs: 15000,
  variants: base.variants.map(variant => ({
    ...variant,
    root: `/your/checkouts/${variant.id}`,
  })),
}
```

Results go to `benchmark/results/` by default: `common.json`, `builds.json`, `browser.json`, optional `browser-native.json`, `report.md`, and `logs/`. JSON is saved atomically after each sample, so interrupted runs retain finished samples and remain marked incomplete. Raw build logs and per-page/per-navigation JSON explain outliers or failures. Repeated runs replace the current output files; use `--output benchmark/results/<run-name>` to preserve multiple runs.

After a complete valid run, generate the plot with Python, Matplotlib and NumPy, using a temporary Nix environment if those libraries are absent:

```sh
nix-shell -p 'python3.withPackages (ps: [ ps.matplotlib ps.numpy ])' \
  --run 'python3 benchmark/plot-results.py'

node benchmark/snapshot-variants.mjs --dry-run
node benchmark/snapshot-variants.mjs
```

`summary-ja.md` gives the Japanese interpretation; `comparison.png`/`comparison.svg` show medians and observed min–max ranges. The snapshot script creates binary source patches and a per-file SHA-256 manifest under `results/source/`, using disposable Git indexes. It leaves the actual indexes, branches and HEADs unchanged. User article sources, generated content, build output and caches are excluded from patches; input/output fingerprints are recorded separately. Apply each patch to its recorded base revision and supply the same article/public snapshot to reproduce that implementation.

Browser SIGINT/SIGTERM closes its owned Chrome instance, saves partial results with interruption metadata, and shuts down the common static servers before exiting with 130/143. Non-document/non-navigation `net::ERR_ABORTED` subresources are recorded in `cancelledRequests`: speculative/prefetch cancellation is normal and does not invalidate an otherwise working page. Document/navigation aborts and other internal resource failures remain errors; content/navigation assertions independently validate successful page delivery.

Method references: [Playwright isolated contexts and init scripts](https://playwright.dev/docs/api/class-browsercontext), [Playwright CDP sessions](https://playwright.dev/docs/api/class-cdpsession), [Chrome headless](https://developer.chrome.com/docs/automation-and-testing/headless), and [LCP API](https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint).
