import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = process.env.PLAYWRIGHT_MODULE_PATH;
const require = modulePath
  ? createRequire(pathToFileURL(resolve(modulePath, "package.json")))
  : createRequire(new URL("../package.json", import.meta.url));
const { chromium } = require("playwright-core");
const base = new URL(process.env.BASE_URL ?? "http://localhost:4173");
const listPath = "/ja/blog";
const postPath = "/ja/blog/sheldon-nix";
const titleName = "blog-title-sheldon-nix";
const descriptionName = "blog-desc-sheldon-nix";
const titleSelector = `[style*="${titleName}"]`;
const results = [];

function instrument({ disabled, names }) {
  const state = { calls: [], fetches: [], snapshot: null };
  window.__transitionCheck = state;
  const snapshot = () => {
    const elements = [...document.querySelectorAll("[style]")];
    return Object.fromEntries(
      names.map((name) => {
        const element = elements.find(
          (candidate) =>
            getComputedStyle(candidate).viewTransitionName === name,
        );
        if (!element) return [name, null];
        const rect = element.getBoundingClientRect();
        return [
          name,
          {
            tag: element.tagName.toLowerCase(),
            text: element.textContent.trim(),
            rect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
          },
        ];
      }),
    );
  };
  state.snapshot = snapshot;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const request = input instanceof Request ? input : null;
    const headers = new Headers(init?.headers ?? request?.headers);
    if (!headers.get("accept")?.includes("text/html"))
      return nativeFetch(input, init);
    const record = { requestedAt: performance.now(), responseAt: null };
    state.fetches.push(record);
    return nativeFetch(input, init).then((response) => {
      record.responseAt = performance.now();
      return response;
    });
  };
  const nativeTransition = document.startViewTransition?.bind(document);
  state.nativeSupported = Boolean(nativeTransition);
  if (disabled) {
    Object.defineProperty(document, "startViewTransition", {
      value: undefined,
      configurable: true,
    });
    return;
  }
  if (!nativeTransition) return;
  document.startViewTransition = (options) => {
    const record = {
      startedAt: performance.now(),
      before: snapshot(),
      updateBefore: null,
      updateAfter: null,
      ready: "pending",
      finished: "pending",
      update: "pending",
      animations: [],
      pseudoStyles: {},
    };
    state.calls.push(record);
    const callback = typeof options === "function" ? options : options?.update;
    const update = async () => {
      record.updateBefore = snapshot();
      await callback?.();
      record.updateAfter = snapshot();
    };
    const transition = nativeTransition(
      typeof options === "object" ? { ...options, update } : update,
    );
    transition.updateCallbackDone.then(
      () => {
        record.update = "fulfilled";
      },
      (error) => {
        record.update = String(error);
      },
    );
    transition.ready.then(
      () => {
        record.ready = "fulfilled";
        record.atReady = snapshot();
        record.animations = document
          .getAnimations()
          .filter((animation) => {
            const effect = animation.effect;
            return String(
              effect?.pseudoElement ?? effect?.target?.type ?? "",
            ).includes("view-transition");
          })
          .map((animation) => {
            const effect = animation.effect;
            const pseudo = String(
              effect?.pseudoElement ?? effect?.target?.type ?? "",
            );
            const frames = !pseudo.startsWith("::view-transition-group(")
              ? []
              : effect.getKeyframes().map((frame) => {
                  const matrix = new DOMMatrixReadOnly(
                    frame.transform ?? "none",
                  );
                  return {
                    offset: frame.computedOffset,
                    x: matrix.e,
                    y: matrix.f,
                    width: Number.parseFloat(frame.width),
                    height: Number.parseFloat(frame.height),
                  };
                });
            return {
              pseudo,
              duration: effect?.getComputedTiming().duration,
              frames,
            };
          });
        for (const name of names) {
          record.pseudoStyles[name] = Object.fromEntries(
            ["group", "old", "new"].map((part) => {
              const style = getComputedStyle(
                document.documentElement,
                `::view-transition-${part}(${name})`,
              );
              return [
                part,
                {
                  animationName: style.animationName,
                  animationDuration: style.animationDuration,
                  display: style.display,
                  width: style.width,
                  height: style.height,
                },
              ];
            }),
          );
        }
      },
      (error) => {
        record.ready = String(error);
      },
    );
    transition.finished.then(
      () => {
        record.finished = "fulfilled";
      },
      (error) => {
        record.finished = String(error);
      },
    );
    return transition;
  };
}

const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_EXECUTABLE ??
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined),
});

async function createPage({
  reducedMotion = "no-preference",
  disabled = false,
  delay = 0,
} = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
    reducedMotion,
    serviceWorkers: "block",
  });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return ["http:", "https:"].includes(url.protocol) &&
      url.origin !== base.origin
      ? route.abort("blockedbyclient")
      : route.continue();
  });
  await context.addInitScript(instrument, {
    disabled,
    names: [titleName, descriptionName],
  });
  const page = await context.newPage();
  const errors = [];
  const state = { page, context, errors, delayedRequests: 0 };
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("ERR_BLOCKED_BY_CLIENT")
    ) {
      errors.push(message.text());
    }
  });
  if (delay) {
    await page.route("**/*", async (route) => {
      if (
        route.request().headers().accept?.includes("text/html") &&
        route.request().resourceType() === "fetch"
      ) {
        state.delayedRequests++;
        await new Promise((done) => setTimeout(done, delay));
      }
      await route.fallback();
    });
  }
  await page.goto(new URL(listPath, base).href, { waitUntil: "networkidle" });
  await page.locator(titleSelector).waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(titleSelector).scrollIntoViewIfNeeded();
  await page.locator(`[style*="${descriptionName}"]`).scrollIntoViewIfNeeded();
  return state;
}

function assertRect(actual, expected, label) {
  for (const key of ["x", "y", "width", "height"]) {
    assert.ok(
      Number.isFinite(actual[key]) &&
        Math.abs(actual[key] - expected[key]) <= 2,
      `${label} ${key}: animation=${actual[key]}, DOM=${expected[key]}`,
    );
  }
}

async function navigate(
  state,
  label,
  action,
  fromTag,
  toTag,
  path,
  animate = true,
) {
  const { page } = state;
  const before = await page.evaluate(() => ({
    calls: window.__transitionCheck.calls.length,
    fetches: window.__transitionCheck.fetches.length,
    timeOrigin: performance.timeOrigin,
    scrollY,
  }));
  await action();
  await page.waitForFunction(
    ({ path, selector, tag }) =>
      location.pathname.replace(/\/$/, "") === path &&
      document.querySelector(selector)?.tagName.toLowerCase() === tag,
    { path, selector: titleSelector, tag: toTag },
  );
  if (animate) {
    await page.waitForFunction(
      (offset) =>
        window.__transitionCheck.calls[offset]?.finished !== undefined &&
        window.__transitionCheck.calls[offset].finished !== "pending",
      before.calls,
    );
  } else {
    await page.evaluate(
      () =>
        new Promise((done) =>
          requestAnimationFrame(() => requestAnimationFrame(done)),
        ),
    );
    await page.waitForTimeout(100);
  }
  const after = await page.evaluate(
    ({ calls, fetches }) => ({
      calls: window.__transitionCheck.calls.slice(calls),
      fetches: window.__transitionCheck.fetches.slice(fetches),
      snapshot: window.__transitionCheck.snapshot(),
      timeOrigin: performance.timeOrigin,
      scrollY,
    }),
    before,
  );
  results.push({ label, before, after });
  assert.equal(
    after.timeOrigin,
    before.timeOrigin,
    `${label}: navigation reloaded the document`,
  );
  assert.deepEqual(state.errors, [], `${label}: browser errors`);
  assert.equal(
    after.calls.length,
    animate ? 1 : 0,
    `${label}: unexpected transition count`,
  );
  if (animate) {
    const call = after.calls[0];
    assert.equal(
      call.ready,
      "fulfilled",
      `${label}: ready rejected: ${call.ready}`,
    );
    assert.equal(call.finished, "fulfilled", `${label}: finished rejected`);
    assert.equal(call.update, "fulfilled", `${label}: update rejected`);
    assert.equal(
      call.before[titleName]?.tag,
      fromTag,
      `${label}: old title was already replaced before transition`,
    );
    assert.equal(
      call.updateBefore[titleName]?.tag,
      fromTag,
      `${label}: old title was replaced before the native snapshot`,
    );
    assert.equal(
      call.updateAfter[titleName]?.tag,
      toTag,
      `${label}: update did not commit the new title`,
    );
    for (const name of [titleName, descriptionName]) {
      assert.ok(call.before[name]?.text, `${label}: missing old ${name}`);
      assert.equal(
        call.before[name].text,
        after.snapshot[name]?.text,
        `${label}: shared text changed`,
      );
      const group = call.animations.find(
        (animation) => animation.pseudo === `::view-transition-group(${name})`,
      );
      assert.ok(
        group?.frames.length >= 2,
        `${label}: no actual shared ${name} group animation`,
      );
      assert.ok(
        group.duration > 0 && group.duration <= 1000,
        `${label}: invalid shared animation duration`,
      );
      assertRect(
        group.frames[0],
        call.updateBefore[name].rect,
        `${label}: old ${name}`,
      );
      assertRect(
        group.frames.at(-1),
        after.snapshot[name].rect,
        `${label}: restored/new ${name}`,
      );
      for (const part of ["old", "new"]) {
        assert.ok(
          call.animations.some(
            (animation) =>
              animation.pseudo === `::view-transition-${part}(${name})`,
          ),
          `${label}: missing actual ${part} ${name} snapshot animation`,
        );
        assert.notEqual(
          call.pseudoStyles[name][part].animationName,
          "none",
          `${label}: ${part} snapshot is not animated`,
        );
      }
    }
  }
  console.log(`PASS ${label}`);
  return after;
}

const clickArticle = (page) =>
  page.locator(`a[href="${postPath}"]`).first().click({ noWaitAfter: true });
try {
  const normal = await createPage();
  try {
    assert.ok(
      await normal.page.evaluate(
        () => window.__transitionCheck.nativeSupported,
      ),
      "Chrome must support native View Transitions",
    );
    const listScroll = await normal.page.evaluate(() => scrollY);
    await navigate(
      normal,
      "list → article",
      () => clickArticle(normal.page),
      "h2",
      "h1",
      postPath,
    );
    const back = await navigate(
      normal,
      "Back: article → list",
      () => normal.page.evaluate(() => history.back()),
      "h1",
      "h2",
      listPath,
    );
    assert.ok(
      Math.abs(back.scrollY - listScroll) <= 2,
      "Back did not restore list scroll before the shared snapshot",
    );
    await navigate(
      normal,
      "Forward: list → article",
      () => normal.page.evaluate(() => history.forward()),
      "h2",
      "h1",
      postPath,
    );
    const hash = await normal.page.evaluate(() => {
      const heading = document.querySelector("article.blog-content [id]");
      return `#${encodeURIComponent(heading?.id || "transition-check")}`;
    });
    const count = await normal.page.evaluate(
      () => window.__transitionCheck.calls.length,
    );
    const timeOrigin = await normal.page.evaluate(() => performance.timeOrigin);
    await normal.page.evaluate((hash) => {
      location.hash = hash;
    }, hash);
    await normal.page.waitForFunction((hash) => location.hash === hash, hash);
    await normal.page.waitForTimeout(150);
    assert.equal(
      await normal.page.evaluate(() => window.__transitionCheck.calls.length),
      count,
      "Hash-only navigation started a View Transition",
    );
    assert.equal(
      await normal.page.evaluate(() => performance.timeOrigin),
      timeOrigin,
      "Hash-only navigation reloaded",
    );
    console.log("PASS hash-only navigation");
  } finally {
    await normal.context.close();
  }

  const delayed = await createPage({ delay: 400 });
  try {
    const after = await navigate(
      delayed,
      "400 ms HTML delay",
      () => clickArticle(delayed.page),
      "h2",
      "h1",
      postPath,
    );
    assert.ok(delayed.delayedRequests > 0, "The HTML request was not delayed");
    assert.ok(
      after.fetches.length > 0,
      "No browser HTML response was observed",
    );
    assert.ok(
      after.fetches.every(
        (fetch) =>
          fetch.responseAt !== null &&
          fetch.responseAt <= after.calls[0].startedAt,
      ),
      "Transition froze the old page before the delayed HTML response arrived",
    );
  } finally {
    await delayed.context.close();
  }

  for (const [label, options] of [
    ["reduced motion", { reducedMotion: "reduce" }],
    ["View Transition API unavailable", { disabled: true }],
  ]) {
    const state = await createPage(options);
    try {
      await navigate(
        state,
        label,
        () => clickArticle(state.page),
        "h2",
        "h1",
        postPath,
        false,
      );
    } finally {
      await state.context.close();
    }
  }
  console.log(
    "Verified native shared title/description geometry, history, delayed HTML, motion/API fallbacks and hash navigation.",
  );
} catch (error) {
  console.error(JSON.stringify(results.at(-1) ?? {}, null, 2));
  throw error;
} finally {
  await browser.close();
}
