import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { loadConfig, median, parseArgs } from "./lib.mjs";

const args = parseArgs();
if (args.help) {
  console.log(
    "node benchmark/report.mjs [--config config.mjs] [--output results-dir] [--report report.md]",
  );
  process.exit(0);
}
const config = await loadConfig(args);
const readOptional = async (name) => {
  try {
    return JSON.parse(
      await readFile(resolve(config.outputDirectory, name), "utf8"),
    );
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};
const common = await readOptional("common.json");
const builds = await readOptional("builds.json");
const browser = await readOptional("browser.json");
const native = await readOptional("browser-native.json");
if (!common && !builds && !browser && !native)
  throw new Error(`No measurements in ${config.outputDirectory}`);
const format = (number, digits = 1) =>
  number === null || !Number.isFinite(number) ? "—" : number.toFixed(digits);
const kib = (number) => format(number === null ? null : number / 1024, 1);
const cell = (value) =>
  String(value ?? "—")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
const lines = [
  "# kyre.moe framework measurements",
  "",
  "Measurements use this site's production pages, animations, blog content, and static assets. They are not a minimal framework benchmark. No published framework marketing numbers are included.",
  "",
  "Fonts are separate resources in all three implementations: Next's existing behavior, a font-only Vite assetsInlineLimit override, and a font-only rshono asset/resource rule. Unused font subsets are therefore not eagerly embedded in CSS. These are configured application implementations; the preliminary rshono font-inlining diagnostic is excluded and preserved separately.",
  "",
  "![Measured medians and observed ranges](comparison.png)",
  "",
];
const environment =
  browser?.environment ?? builds?.environment ?? native?.environment;
if (environment)
  lines.push(
    `Recorded at ${environment.recordedAt}. Node ${environment.nodeVersion}; ${environment.platform}/${environment.architecture}; ${environment.cpuModel}; ${environment.logicalCpuCount} logical CPUs; ${format(environment.memoryBytes / 1024 ** 3, 0)} GiB RAM.${environment.chromeVersion ? ` Chrome ${environment.chromeVersion}, Playwright ${environment.playwrightVersion}.` : ""}`,
    "",
  );

const variants =
  builds?.variants ?? browser?.variants ?? native?.variants ?? [];
lines.push(
  "## Variants and common inputs",
  "",
  "| Variant | Installed framework / app React dependency | Common blog index SHA-256 |",
  "| --- | --- | --- |",
);
for (const variant of variants) {
  const framework =
    variant.id === "next"
      ? variant.versions.next
      : variant.id === "tanstack"
        ? variant.versions["@tanstack/react-start"]
        : variant.versions["@rshono/core"];
  lines.push(
    `| ${cell(variant.label)} | ${cell(framework)} / React ${cell(variant.versions.react)} | ${cell(variant.commonInputHash)} |`,
  );
}
const hashes = variants
  .map((variant) => variant.commonInputHash)
  .filter(Boolean);
if (hashes.length && new Set(hashes).size !== 1)
  lines.push(
    "",
    "**Common blog index hashes differ. Resolve the content mismatch before treating these variants as directly comparable.**",
  );
for (const variant of variants)
  if (variant.notes) lines.push("", `- ${variant.label}: ${variant.notes}`);
lines.push(
  "",
  "App package dependencies react/react-dom are 19.3.0 in every checkout, while each framework keeps its native runtime. Next App Router uses Next's bundled React 19.3.0-canary-cbb046ab-20260731 (verified in installed compiled React and compiler aliases); this does not claim identical internal React runtimes. rshono 1.0.0-rc.23 uses react-server-dom-rspack 0.1.0. Its upstream dev/test dependencies use React 19.2.8; 19.3.0 is within its peer range and passed this site's build/browser checks, but differs from that upstream test version.",
  "",
  "rshono's static host adapter maps same-origin RSC navigation fetches to the generated index.rsc files. Both HTML and Flight output are published, including 404 fallback. Next publishes its native static RSC files; TanStack uses its native prerendered HTML and client routes. These implementation choices are included in the measured browser payload/navigation behavior.",
);

if (common) {
  lines.push(
    "",
    "## Shared preparation",
    "",
    "Content and asset generation run before the native framework measurements. Their time is shown separately, not charged to only one framework.",
    "",
    "| Mode | Total (s) | Panda (s) | Org (s) | Images (s) | Content / OGP (s) |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const measurement of common.measurements ?? [])
    lines.push(
      `| ${cell(measurement.mode)} | ${format(measurement.milliseconds / 1000)} | ${format(measurement.steps.panda / 1000)} | ${format(measurement.steps.org / 1000)} | ${format(measurement.steps.images / 1000)} | ${format(measurement.steps.content / 1000)} |`,
    );
  lines.push(
    "",
    `Common preparation Node: ${cell(common.node)}. Published posts: ${cell(common.posts)}; public pages: ${cell(common.publicPages)}. Input fingerprints and sync destinations are recorded in [common.json](common.json).`,
  );
}

if (builds) {
  lines.push(
    "",
    "## Native production build wall time",
    "",
    "| Variant | Cache | Valid samples | Median (s) | Min–max (s) | HTML files | All output JS gzip (KiB) | All output CSS gzip (KiB) |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const variant of builds.variants)
    for (const mode of ["cold", "warm"]) {
      const all = builds.samples.filter(
        (sample) => sample.variant === variant.id && sample.mode === mode,
      );
      const samples = all.filter((sample) => sample.success);
      const durations = samples.map((sample) => sample.elapsedMs / 1000);
      const output = samples.at(-1)?.output;
      lines.push(
        `| ${cell(variant.label)} | ${mode} | ${samples.length}/${builds.config.buildRepetitions} | ${format(median(durations))} | ${durations.length ? `${format(Math.min(...durations))}–${format(Math.max(...durations))}` : "—"} | ${cell(output?.htmlFiles)} | ${kib(output?.jsGzipBytes ?? null)} | ${kib(output?.cssGzipBytes ?? null)} |`,
      );
    }
  lines.push(
    "",
    builds.environment.coldDefinition,
    "",
    builds.environment.warmDefinition,
    "",
    "Samples run serially, rotating variant order for each repetition. Dependencies, source files, prepared assets, and OS filesystem caches remain installed. Setup, cleanup, compression-size analysis, and dependency installation are outside the timed region.",
    "",
    "This table measures each native production build command plus its required static finalizer. Next.js includes its normal TypeScript validation; Vite does not. These are useful app build wall times, not a claim of equal pure compiler work. All-output bundle sizes include chunks that a particular page might never load.",
    "",
    "Persistent cache existence/bytes before and after every sample, exact commands, exit codes, and raw build logs are in [builds.json](builds.json). A missing or unused persistent cache means the warm result does not represent an incremental compiler-cache speedup.",
  );
  if (!builds.complete) lines.push("", "**Build run is incomplete.**");
}

for (const [name, data] of [
  ["Primary browser profile", browser],
  ["Native local browser profile", native],
]) {
  if (!data) continue;
  const { profile } = data.config;
  lines.push(
    "",
    `## ${name}`,
    "",
    `${profile.name}: viewport ${data.config.viewport.width}×${data.config.viewport.height}, CPU slowdown ${profile.cpuSlowdown}×, latency ${profile.latencyMs} ms, download ${profile.downloadBytesPerSecond < 0 ? "unlimited" : `${format((profile.downloadBytesPerSecond * 8) / 1000000)} Mbps`}. Observation window ${data.config.observationWindowMs / 1000} seconds. Normal motion, dark theme, locale ja-JP, time zone Asia/Tokyo.`,
    "",
    "| Variant | Route | Valid samples | FCP (ms) | LCP (ms) | CLS | Blocking proxy (ms) | Long tasks (ms) | JS gzip (KiB) | JS decoded (KiB) | CSS gzip (KiB) |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const route of data.config.routes)
    for (const variant of data.variants) {
      const all = data.samples.filter(
        (sample) =>
          sample.route === route.path && sample.variant === variant.id,
      );
      const samples = all.filter((sample) => sample.success);
      const m = (key) => median(samples.map((sample) => sample.metrics[key]));
      lines.push(
        `| ${cell(variant.label)} | ${cell(route.path)} | ${samples.length}/${data.config.browserRepetitions} | ${format(m("fcpMs"), 0)} | ${format(m("lcpMs"), 0)} | ${format(m("cls"), 3)} | ${format(m("blockingTimeProxyMs"), 0)} | ${format(m("longTaskMs"), 0)} | ${kib(m("jsEncodedBytes"))} | ${kib(m("jsDecodedBytes"))} | ${kib(m("cssEncodedBytes"))} |`,
      );
    }
  lines.push(
    "",
    "### Initial payload within the observation window",
    "",
    "| Variant | Route | Valid samples | HTML gzip (KiB) | Main-frame encoded bodies (KiB) | Fonts (KiB) | Images (KiB) | Completed requests |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const route of data.config.routes)
    for (const variant of data.variants) {
      const samples = data.samples.filter(
        (sample) =>
          sample.success &&
          sample.route === route.path &&
          sample.variant === variant.id,
      );
      const m = (key) => median(samples.map((sample) => sample.metrics[key]));
      lines.push(
        `| ${cell(variant.label)} | ${cell(route.path)} | ${samples.length}/${data.config.browserRepetitions} | ${kib(m("documentEncodedBytes"))} | ${kib(m("totalEncodedBytes"))} | ${kib(m("fontEncodedBytes"))} | ${kib(m("imageEncodedBytes"))} | ${format(m("resourceCount"), 0)} |`,
      );
    }
  lines.push(
    "",
    "Every page measurement uses a fresh isolated browser context, disabled browser HTTP cache, blocked service workers, and the same memory-backed static HTTP server. Text assets use gzip level 6 and identical cache headers. The host kyre-benchmark.test maps to 127.0.0.1 so the app follows its production WebP path rather than its localhost PNG fallback. No framework-specific server or RSC header special case runs during browser measurements.",
    "",
    "External embeds/avatars/scripts are blocked for every variant. Browser exceptions, console errors, blocked URLs, HTTP failures, main-frame content/language assertions, subframe timing snapshots, LCP candidates, and resource timing are retained in raw JSON. Non-document, non-navigation net::ERR_ABORTED requests are retained as cancelledRequests rather than treated as errors: frameworks normally cancel speculative/prefetch requests. Document/navigation aborts remain failures, and goto/content assertions independently catch failed main navigation. Metrics are medians of valid samples only; absent or late LCP is an invalid/censored sample, never zero. Rows with missing samples must be investigated before ranking frameworks.",
    "",
    "Payload sizes are Resource Timing encoded/decoded bodies for same-origin HTTP transfers completed inside the finite window; values exclude response headers. HTML includes inline RSC/JSON/bootstrap data, so JS gzip alone is not the full initial payload. Total encoded bodies includes the main HTML document and main-frame-observed completed same-origin resources, including RSC, JS, CSS, fonts, and images; external blocked requests are excluded. Subframes are logged separately rather than automatically aggregated; all measured samples have zero subframes. Completed request count includes the document. Images/fonts may already be compressed and are shown as encoded bytes rather than described as gzip. Per-request CDP wire bytes and pending counts are raw diagnostics sampled before cleanup (after assertions/screenshots), rather than exact cutoff snapshots; the reported payload metrics filter responseEnd to the observation window. An unfinished document makes the sample censored. LCP is the last observed candidate within the window, not necessarily a final user-session Core Web Vital. CLS uses the largest five-second session window with a one-second gap rule.",
    "",
    "Blocking proxy sums max(long-task overlap minus 50 ms, 0) after FCP until the observation cutoff. It is a finite-window diagnostic, not Lighthouse TBT or field INP. Home includes WebGL and animated effects: GPU/driver/headless timing and animation can dominate its results, so interpret the blog routes alongside Home.",
  );
  if (data.navigationSamples.length) {
    lines.push(
      "",
      "### Blog index → article DOM ready navigation latency",
      "",
      "| Variant | Valid samples | Median DOM ready latency plus 2 frames (ms) | Min–max (ms) | Soft / hard navigations |",
      "| --- | ---: | ---: | ---: | --- |",
    );
    for (const variant of data.variants) {
      const samples = data.navigationSamples.filter(
        (sample) => sample.variant === variant.id && sample.success,
      );
      lines.push(
        `| ${cell(variant.label)} | ${samples.length}/${data.config.browserRepetitions} | ${format(median(samples.map((sample) => sample.elapsedMs)), 0)} | ${samples.length ? `${format(Math.min(...samples.map((sample) => sample.elapsedMs)), 0)}–${format(Math.max(...samples.map((sample) => sample.elapsedMs)), 0)}` : "—"} | ${samples.filter((sample) => sample.navigationType === "soft").length} / ${samples.filter((sample) => sample.navigationType === "hard").length} |`,
      );
    }
    lines.push(
      "",
      "Navigation timing begins in a capture-phase click handler using the browser's performance.timeOrigin + performance.now(), retained in sessionStorage across hard reloads. It ends on a browser timestamp after the destination URL and nonempty article are present plus two animation frames. Playwright actionability/scrolling time is excluded. This measures DOM ready navigation latency; it does not guarantee visible content while opacity/view transitions are still animating, and does not measure INP. timeOrigin changes classify document reloads as hard navigation. Framework prefetch behavior remains enabled and therefore contributes to the app's initial resource budgets and click timing.",
    );
  }
  const invalid = data.samples.filter((sample) => !sample.success);
  const failedNav = data.navigationSamples.filter((sample) => !sample.success);
  if (invalid.length || failedNav.length) {
    lines.push(
      "",
      `**Invalid page samples: ${invalid.length}; invalid navigation samples: ${failedNav.length}.**`,
    );
    for (const sample of [...invalid, ...failedNav])
      lines.push(
        `- ${sample.variant} ${sample.route ?? `${sample.from} → ${sample.to}`} #${sample.repetition}: ${cell(sample.error ?? sample.unexpectedConsoleErrors?.[0] ?? sample.pageErrors?.[0] ?? JSON.stringify(sample.badResponses))}`,
      );
  }
  if (!data.complete) lines.push("", "**Browser run is incomplete.**");
}

lines.push(
  "",
  "## Reproduction and raw data",
  "",
  "See [benchmark README](../README.md) for the portable commands and config overrides. Stop unrelated builds/servers and repeat on the same power/thermal state. Samples are local lab observations, not a statistical confidence interval or a promise about another computer, device, or network.",
  "",
  `Raw data: ${[
    common && "[shared preparation](common.json)",
    builds && "[builds](builds.json)",
    browser && "[primary browser](browser.json)",
    native && "[native browser](browser-native.json)",
    "[logs](logs/)",
  ]
    .filter(Boolean)
    .join(", ")}.`,
  "",
  "Source patches and source/output fingerprints: [manifest](source/manifest.json), [Next](source/next.patch), [TanStack](source/tanstack.patch), [rshono](source/rshono.patch). Patches preserve each implementation relative to its recorded Git base; user article sources are excluded. Preliminary diagnostics are kept in separate diagnostic folders and are excluded from every table above.",
  "",
);
const reportPath = resolve(
  args.report ?? resolve(config.outputDirectory, "report.md"),
);
await writeFile(reportPath, `${lines.join("\n")}\n`);
console.log(`Saved ${relative(process.cwd(), reportPath)}`);
