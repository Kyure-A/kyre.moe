import { createRequire } from "node:module";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import {
  environment,
  isCancelledSubresource,
  loadConfig,
  parseArgs,
  rotate,
  saveJson,
  validateCommonInputs,
  variantMetadata,
} from "./lib.mjs";
import { createStaticServer } from "./static-server.mjs";

const args = parseArgs();
if (args.help) {
  console.log(
    "node benchmark/measure-browser.mjs [--config config.mjs] [--variants next,tanstack,rshono] [--repetitions 5] [--output dir] [--chrome executable] [--playwright-module dir] [--window-ms 15000] [--native] [--screenshots] [--skip-navigation] [--dry-run]",
  );
  process.exit(0);
}
const config = await loadConfig(args);
if (args["dry-run"]) {
  console.log(
    JSON.stringify(
      {
        variants: config.variants.map(({ id, root, output }) => ({
          id,
          root,
          output,
        })),
        routes: config.routes,
        profile: config.profile,
        repetitions: config.browserRepetitions,
        observationWindowMs: config.observationWindowMs,
        hostname: config.benchmarkHostname,
        navigation: config.navigation,
        chrome: config.chromeExecutable,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const modulePath =
  args["playwright-module"] ?? process.env.PLAYWRIGHT_MODULE_PATH;
const require = modulePath
  ? createRequire(pathToFileURL(resolve(modulePath, "package.json")))
  : createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const playwrightVersion = require("playwright-core/package.json").version;

function instrumentPage() {
  performance.setResourceTimingBufferSize(5000);
  const entries = { lcp: [], cls: [], longtasks: [] };
  const observers = [];
  for (const [type, key] of [
    ["largest-contentful-paint", "lcp"],
    ["layout-shift", "cls"],
    ["longtask", "longtasks"],
  ]) {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        entries[key].push({
          startTime: entry.startTime,
          duration: entry.duration,
          value: entry.value,
          hadRecentInput: entry.hadRecentInput,
          size: entry.size,
          url: entry.url,
          element: entry.element
            ? `${entry.element.tagName.toLowerCase()}${entry.element.id ? `#${entry.element.id}` : ""}`
            : null,
        });
    });
    observer.observe({ type, buffered: true });
    observers.push(observer);
  }
  window.__benchmarkRead = (windowMs) => {
    const paints = performance
      .getEntriesByType("paint")
      .map((entry) => ({ name: entry.name, startTime: entry.startTime }));
    const fcp =
      paints.find((entry) => entry.name === "first-contentful-paint")
        ?.startTime ?? null;
    const candidates = entries.lcp.filter(
      (entry) => entry.startTime <= windowMs,
    );
    const longtasks = entries.longtasks.filter(
      (entry) => entry.startTime <= windowMs,
    );
    const shifts = entries.cls.filter(
      (entry) => !entry.hadRecentInput && entry.startTime <= windowMs,
    );
    let largestSession = 0;
    let sessionTotal = 0;
    let sessionStart = null;
    let previousShift = 0;
    for (const shift of shifts) {
      if (
        sessionStart === null ||
        shift.startTime - previousShift >= 1000 ||
        shift.startTime - sessionStart >= 5000
      ) {
        sessionTotal = 0;
        sessionStart = shift.startTime;
      }
      sessionTotal += shift.value;
      largestSession = Math.max(largestSession, sessionTotal);
      previousShift = shift.startTime;
    }
    const resources = performance
      .getEntriesByType("resource")
      .filter(
        (entry) => entry.startTime <= windowMs && entry.responseEnd <= windowMs,
      )
      .map((entry) => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        startTime: entry.startTime,
        duration: entry.duration,
        responseEnd: entry.responseEnd,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        responseStatus: entry.responseStatus,
      }));
    const completedSameOriginResources = resources.filter((entry) => {
      const url = new URL(entry.name);
      return (
        url.origin === location.origin &&
        ["http:", "https:"].includes(url.protocol) &&
        entry.responseEnd > 0 &&
        (entry.responseStatus === undefined || entry.responseStatus > 0)
      );
    });
    const totalBytes = (extension, field) =>
      completedSameOriginResources
        .filter((entry) => new URL(entry.name).pathname.endsWith(extension))
        .reduce((total, entry) => total + entry[field], 0);
    const navigation = performance
      .getEntriesByType("navigation")
      .map((entry) => ({
        responseStart: entry.responseStart,
        responseEnd: entry.responseEnd,
        domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
        loadEventEnd: entry.loadEventEnd,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
      }));
    const documentCompletedByCutoff = Boolean(
      navigation[0]?.responseEnd > 0 && navigation[0].responseEnd <= windowMs,
    );
    const documentEncodedBytes = documentCompletedByCutoff
      ? navigation[0].encodedBodySize
      : null;
    const documentDecodedBytes = documentCompletedByCutoff
      ? navigation[0].decodedBodySize
      : null;
    const categoryEncodedBytes = (extensions) =>
      extensions.reduce(
        (total, extension) => total + totalBytes(extension, "encodedBodySize"),
        0,
      );
    return {
      url: location.href,
      timeOrigin: performance.timeOrigin,
      sampledAtMs: performance.now(),
      supportedEntryTypes: PerformanceObserver.supportedEntryTypes,
      fcpMs: fcp !== null && fcp <= windowMs ? fcp : null,
      lcpMs: candidates.at(-1)?.startTime ?? null,
      lcpCandidate: candidates.at(-1) ?? null,
      cls: largestSession,
      longTaskCount: longtasks.length,
      longTaskMs: longtasks.reduce(
        (total, entry) =>
          total +
          Math.min(entry.duration, Math.max(0, windowMs - entry.startTime)),
        0,
      ),
      blockingTimeProxyMs:
        fcp === null
          ? null
          : longtasks.reduce(
              (total, entry) =>
                total +
                Math.max(
                  0,
                  Math.min(entry.startTime + entry.duration, windowMs) -
                    Math.max(entry.startTime, fcp) -
                    50,
                ),
              0,
            ),
      jsEncodedBytes:
        totalBytes(".js", "encodedBodySize") +
        totalBytes(".mjs", "encodedBodySize"),
      jsDecodedBytes:
        totalBytes(".js", "decodedBodySize") +
        totalBytes(".mjs", "decodedBodySize"),
      cssEncodedBytes: totalBytes(".css", "encodedBodySize"),
      cssDecodedBytes: totalBytes(".css", "decodedBodySize"),
      documentCompletedByCutoff,
      documentEncodedBytes,
      documentDecodedBytes,
      totalEncodedBytes:
        documentEncodedBytes === null
          ? null
          : documentEncodedBytes +
            completedSameOriginResources.reduce(
              (total, entry) => total + entry.encodedBodySize,
              0,
            ),
      fontEncodedBytes: categoryEncodedBytes([
        ".woff",
        ".woff2",
        ".ttf",
        ".otf",
      ]),
      imageEncodedBytes: categoryEncodedBytes([
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".gif",
        ".avif",
        ".svg",
        ".ico",
      ]),
      resourceCount:
        completedSameOriginResources.length + Number(documentCompletedByCutoff),
      resources,
      longtasks,
      lcpCandidates: candidates,
      layoutShifts: shifts,
      navigation,
    };
  };
}

const variants = [];
for (const variant of config.variants)
  variants.push(await variantMetadata(variant));
validateCommonInputs(variants);
const browser = await chromium.launch({
  headless: true,
  executablePath: config.chromeExecutable,
  args: [
    `--host-resolver-rules=MAP ${config.benchmarkHostname} 127.0.0.1`,
    "--no-proxy-server",
  ],
});
const result = {
  environment: {
    ...environment(),
    chromeVersion: browser.version(),
    playwrightVersion,
  },
  config,
  variants,
  samples: [],
  navigationSamples: [],
  complete: false,
};
try {
  const browserSession = await browser.newBrowserCDPSession();
  const { gpu } = await browserSession.send("SystemInfo.getInfo");
  result.environment.gpu = {
    devices: gpu.devices,
    featureStatus: gpu.featureStatus,
  };
  await browserSession.detach();
} catch (error) {
  result.environment.gpuInfoError = String(error);
}
const resultPath = resolve(
  config.outputDirectory,
  args.native ? "browser-native.json" : "browser.json",
);
const servers = new Map();
let interrupted = false;
const requestStop = (signal) => {
  if (interrupted) return;
  interrupted = true;
  result.complete = false;
  result.interruption = { signal, requestedAt: new Date().toISOString() };
  process.exitCode = signal === "SIGINT" ? 130 : 143;
  console.log(
    `Stopping browser measurement after ${signal}; preserving partial results.`,
  );
  void browser.close().catch(() => {});
};
const stopOnInterrupt = () => requestStop("SIGINT");
const stopOnTerminate = () => requestStop("SIGTERM");
process.on("SIGINT", stopOnInterrupt);
process.on("SIGTERM", stopOnTerminate);

const createMeasuredPage = async () => {
  const context = await browser.newContext({
    viewport: config.viewport,
    deviceScaleFactor: 1,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    colorScheme: "dark",
    reducedMotion: "no-preference",
    serviceWorkers: "block",
  });
  const blockedRequests = [];
  await context.route("**/*", (route) => {
    const requestUrl = new URL(route.request().url());
    if (
      ["http:", "https:"].includes(requestUrl.protocol) &&
      requestUrl.hostname !== config.benchmarkHostname
    ) {
      blockedRequests.push(requestUrl.href);
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  await context.addInitScript(instrumentPage);
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const internalFailedRequests = [];
  const cancelledRequests = [];
  const badResponses = [];
  const network = new Map();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) =>
    pageErrors.push(String(error.stack ?? error)),
  );
  page.on("requestfailed", (request) => {
    if (new URL(request.url()).hostname === config.benchmarkHostname) {
      const details = {
        url: request.url(),
        failure: request.failure(),
        resourceType: request.resourceType(),
        isNavigationRequest: request.isNavigationRequest(),
      };
      if (isCancelledSubresource(details)) cancelledRequests.push(details);
      else internalFailedRequests.push(details);
    }
  });
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      new URL(response.url()).hostname === config.benchmarkHostname
    )
      badResponses.push({ url: response.url(), status: response.status() });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: config.profile.cpuSlowdown,
  });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: config.profile.latencyMs,
    downloadThroughput: config.profile.downloadBytesPerSecond,
    uploadThroughput: config.profile.uploadBytesPerSecond,
  });
  cdp.on(
    "Network.responseReceived",
    ({ requestId, response, type, timestamp }) =>
      network.set(requestId, {
        url: response.url,
        type,
        status: response.status,
        mimeType: response.mimeType,
        timestamp,
        encodedDataLength: 0,
        complete: false,
      }),
  );
  cdp.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => {
    const entry = network.get(requestId);
    if (entry) {
      entry.encodedDataLength = encodedDataLength;
      entry.complete = true;
    }
  });
  cdp.on("Network.loadingFailed", ({ requestId, errorText, canceled }) => {
    const entry = network.get(requestId);
    if (entry) {
      entry.failed = true;
      entry.failureText = errorText;
      entry.cancelled = canceled;
    }
  });
  return {
    context,
    page,
    cdp,
    consoleErrors,
    pageErrors,
    internalFailedRequests,
    cancelledRequests,
    badResponses,
    blockedRequests,
    network,
  };
};

const assertContent = async (page, route) => {
  const language = await page.locator("html").getAttribute("lang");
  if (language !== route.lang)
    throw new Error(`Expected html lang=${route.lang}, got ${language}`);
  const content = await page
    .locator(route.selector)
    .first()
    .textContent({ timeout: 1000 });
  if (!content?.trim()) throw new Error(`Empty/missing ${route.selector}`);
  if (route.text && !content.includes(route.text))
    throw new Error(
      `Expected ${JSON.stringify(route.text)} in ${route.selector}`,
    );
  return {
    language,
    contentLength: content.length,
    textPrefix: content.trim().slice(0, 120),
  };
};

try {
  for (const variant of config.variants)
    servers.set(
      variant.id,
      await createStaticServer({ root: resolve(variant.root, variant.output) }),
    );
  await saveJson(resultPath, result);
  measurementLoop: for (
    let round = 0;
    round < config.browserRepetitions;
    round++
  )
    for (const route of config.routes)
      for (const variant of rotate(config.variants, round)) {
        if (interrupted) break measurementLoop;
        console.log(
          `[browser] ${variant.id} ${route.path} ${round + 1}/${config.browserRepetitions}`,
        );
        const state = await createMeasuredPage();
        const sample = {
          variant: variant.id,
          route: route.path,
          repetition: round + 1,
          startedAt: new Date().toISOString(),
          observationWindowMs: config.observationWindowMs,
          success: false,
        };
        try {
          const url = `http://${config.benchmarkHostname}:${servers.get(variant.id).port}${route.path}`;
          const response = await state.page.goto(url, {
            waitUntil: "commit",
            timeout: 60000,
          });
          sample.status = response?.status() ?? null;
          await state.page.waitForTimeout(
            Math.max(
              0,
              config.observationWindowMs -
                (await state.page.evaluate(() => performance.now())),
            ),
          );
          sample.metrics = await state.page.evaluate(
            (windowMs) => window.__benchmarkRead(windowMs),
            config.observationWindowMs,
          );
          sample.frames = [];
          for (const frame of state.page.frames()) {
            if (frame === state.page.mainFrame()) continue;
            try {
              sample.frames.push(
                await frame.evaluate(
                  (windowMs) => window.__benchmarkRead?.(windowMs) ?? null,
                  config.observationWindowMs,
                ),
              );
            } catch (error) {
              sample.frames.push({ error: String(error) });
            }
          }
          sample.content = await assertContent(state.page, route);
          sample.lcpObserved = sample.metrics.lcpMs !== null;
          sample.unexpectedConsoleErrors = state.consoleErrors.filter(
            (message) => !message.includes("ERR_BLOCKED_BY_CLIENT"),
          );
          sample.success =
            sample.status === 200 &&
            sample.unexpectedConsoleErrors.length === 0 &&
            state.pageErrors.length === 0 &&
            state.badResponses.length === 0 &&
            state.internalFailedRequests.length === 0 &&
            sample.metrics.fcpMs !== null &&
            sample.lcpObserved &&
            sample.metrics.documentCompletedByCutoff;
          if (!sample.lcpObserved)
            sample.error =
              "LCP not observed in the finite window; extend --window-ms. This is a censored sample, never a zero/fast result.";
          if (!sample.metrics.documentCompletedByCutoff)
            sample.error =
              "Document transfer did not complete within the observation window; payload is censored, never a zero/fast result.";
          if (args.screenshots && round === 0) {
            const screenshotPath = resolve(
              config.outputDirectory,
              "logs",
              `screenshot-${variant.id}-${route.path.replace(/\//g, "_")}.png`,
            );
            await state.page.screenshot({ path: screenshotPath });
            sample.screenshotPath = screenshotPath;
          }
        } catch (error) {
          sample.error = String(error.stack ?? error);
          if (interrupted) sample.interrupted = true;
        } finally {
          sample.consoleErrors = [...state.consoleErrors];
          sample.pageErrors = [...state.pageErrors];
          sample.badResponses = [...state.badResponses];
          sample.internalFailedRequests = [...state.internalFailedRequests];
          sample.cancelledRequests = [...state.cancelledRequests];
          sample.blockedExternalRequests = [...new Set(state.blockedRequests)];
          sample.network = [...state.network.values()].map((entry) => ({
            ...entry,
          }));
          sample.incompleteResourceCount = sample.network.filter(
            (resource) => !resource.complete && !resource.failed,
          ).length;
          await state.context.close().catch(() => {});
          const logPath = resolve(
            config.outputDirectory,
            "logs",
            `browser-${variant.id}-${route.path.replace(/\//g, "_")}-${round + 1}.json`,
          );
          sample.logPath = logPath;
          await saveJson(logPath, sample);
          result.samples.push(sample);
          await saveJson(resultPath, result);
        }
      }

  if (!args["skip-navigation"] && !interrupted)
    navigationLoop: for (
      let round = 0;
      round < config.browserRepetitions;
      round++
    )
      for (const variant of rotate(config.variants, round)) {
        if (interrupted) break navigationLoop;
        console.log(
          `[navigation] ${variant.id} ${round + 1}/${config.browserRepetitions}`,
        );
        const state = await createMeasuredPage();
        const sample = {
          variant: variant.id,
          repetition: round + 1,
          ...config.navigation,
          success: false,
        };
        try {
          const url = `http://${config.benchmarkHostname}:${servers.get(variant.id).port}${config.navigation.from}`;
          await state.page.goto(url, { waitUntil: "commit", timeout: 60000 });
          await state.page.waitForTimeout(
            Math.max(
              0,
              config.observationWindowMs -
                (await state.page.evaluate(() => performance.now())),
            ),
          );
          const link = state.page
            .locator(`a[href="${config.navigation.to}"]`)
            .first();
          await link.scrollIntoViewIfNeeded({ timeout: 5000 });
          const previousTimeOrigin = await state.page.evaluate(
            () => performance.timeOrigin,
          );
          await link.evaluate((element) => {
            element.addEventListener(
              "click",
              () => {
                sessionStorage.setItem(
                  "__benchmarkNavigationStartEpochMs",
                  String(performance.timeOrigin + performance.now()),
                );
              },
              { once: true, capture: true },
            );
          });
          const start = performance.now();
          await link.click({ timeout: 5000, noWaitAfter: true });
          await state.page.waitForFunction(
            (path) =>
              location.pathname === path &&
              document
                .querySelector("article.blog-content")
                ?.textContent?.trim(),
            config.navigation.to,
            { timeout: 30000 },
          );
          const browserTimes = await state.page.evaluate(
            () =>
              new Promise((resolvePaint) => {
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => {
                    const storedStart = sessionStorage.getItem(
                      "__benchmarkNavigationStartEpochMs",
                    );
                    resolvePaint({
                      startEpochMs:
                        storedStart === null ? null : Number(storedStart),
                      endEpochMs: performance.timeOrigin + performance.now(),
                    });
                  }),
                );
              }),
          );
          if (
            browserTimes.startEpochMs === null ||
            !Number.isFinite(browserTimes.startEpochMs)
          )
            throw new Error("Navigation click start was not captured.");
          sample.browserTimes = browserTimes;
          sample.hostClickToCompletionMs = performance.now() - start;
          sample.elapsedMs =
            browserTimes.endEpochMs - browserTimes.startEpochMs;
          sample.domReadyLatencyMs = sample.elapsedMs;
          sample.navigationType =
            previousTimeOrigin ===
            (await state.page.evaluate(() => performance.timeOrigin))
              ? "soft"
              : "hard";
          sample.content = await assertContent(
            state.page,
            config.routes.find((route) => route.path === config.navigation.to),
          );
          sample.unexpectedConsoleErrors = state.consoleErrors.filter(
            (message) => !message.includes("ERR_BLOCKED_BY_CLIENT"),
          );
          sample.success =
            sample.unexpectedConsoleErrors.length === 0 &&
            state.pageErrors.length === 0 &&
            state.badResponses.length === 0 &&
            state.internalFailedRequests.length === 0;
        } catch (error) {
          sample.error = String(error.stack ?? error);
          if (interrupted) sample.interrupted = true;
        } finally {
          sample.consoleErrors = [...state.consoleErrors];
          sample.pageErrors = [...state.pageErrors];
          sample.badResponses = [...state.badResponses];
          sample.internalFailedRequests = [...state.internalFailedRequests];
          sample.cancelledRequests = [...state.cancelledRequests];
          sample.blockedExternalRequests = [...new Set(state.blockedRequests)];
          sample.network = [...state.network.values()].map((entry) => ({
            ...entry,
          }));
          await state.context.close().catch(() => {});
          sample.logPath = resolve(
            config.outputDirectory,
            "logs",
            `navigation-${variant.id}-${round + 1}.json`,
          );
          await saveJson(sample.logPath, sample);
          result.navigationSamples.push(sample);
          await saveJson(resultPath, result);
        }
      }
  result.complete = !interrupted;
  await saveJson(resultPath, result);
  if (
    result.samples.some((sample) => !sample.success) ||
    result.navigationSamples.some((sample) => !sample.success)
  )
    if (!interrupted) process.exitCode = 1;
  console.log(`Saved browser measurements to ${resultPath}`);
} catch (error) {
  if (!interrupted) throw error;
  result.interruption.pendingOperationError = String(error);
} finally {
  if (interrupted) await saveJson(resultPath, result);
  await browser.close().catch(() => {});
  for (const server of servers.values()) await server.close();
  process.removeListener("SIGINT", stopOnInterrupt);
  process.removeListener("SIGTERM", stopOnTerminate);
}
