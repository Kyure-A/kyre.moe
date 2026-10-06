import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = process.env.PLAYWRIGHT_MODULE_PATH
  ? createRequire(
      pathToFileURL(
        resolve(process.env.PLAYWRIGHT_MODULE_PATH, "package.json"),
      ),
    )
  : createRequire(new URL("../package.json", import.meta.url));
const { chromium } = require("playwright-core");
const base = new URL(process.env.BASE_URL ?? "http://localhost:4173");
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_EXECUTABLE ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
await context.route("**/*", (route) =>
  new URL(route.request().url()).origin === base.origin
    ? route.continue()
    : route.abort("blockedbyclient"),
);
await context.addInitScript(() => {
  window.__copiedCode = [];
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: async (text) => {
        window.__copiedCode.push(text);
      },
    },
  });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
async function visit(path) {
  await page.evaluate((path) => {
    document.getElementById("interaction-test-link")?.remove();
    const link = document.createElement("a");
    link.id = "interaction-test-link";
    link.textContent = "Navigate";
    link.href = path;
    document.body.appendChild(link);
  }, path);
  await page.locator("#interaction-test-link").evaluate((link) => link.click());
  await page.waitForFunction((path) => {
    const canonical = document.querySelector('link[rel="canonical"]');
    return (
      location.pathname.replace(/\/$/, "") === path &&
      canonical &&
      new URL(canonical.href).pathname.replace(/\/$/, "") === path
    );
  }, path);
  await page.waitForFunction(
    () =>
      !document
        .getAnimations()
        .some((animation) =>
          String(
            animation.effect?.pseudoElement ??
              animation.effect?.target?.type ??
              "",
          ).includes("view-transition"),
        ),
  );
}
const settleScroll = () =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
async function checkHashHistory() {
  const articlePath = "/ja/blog/sheldon-nix";
  await visit(articlePath);
  const origin = await page.evaluate(() => performance.timeOrigin);
  const hash = await page.evaluate(() => {
    const heading = document.querySelector("article.blog-content [id]");
    if (!heading?.id) throw new Error("Article must contain an anchor target");
    return `#${encodeURIComponent(heading.id)}`;
  });
  await page.evaluate(() => window.scrollTo(0, 150));
  await settleScroll();
  await page.evaluate((hash) => {
    location.hash = hash;
  }, hash);
  await page.waitForFunction((hash) => location.hash === hash, hash);
  await settleScroll();
  await page.evaluate(() => window.scrollTo(0, 600));
  await settleScroll();
  assert.equal(await page.evaluate(() => scrollY), 600);
  await visit("/ja/about");
  let delayedRequests = 0;
  const delayArticle = async (route) => {
    if (
      route.request().headers().rsc === "1" &&
      new URL(route.request().url()).pathname
        .replace(/\/index\.rsc$/, "")
        .replace(/\/$/, "") === articlePath
    ) {
      delayedRequests++;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    await route.fallback();
  };
  await page.route("**/*", delayArticle);
  await page.evaluate(() => history.back());
  await page.waitForFunction((articlePath) => {
    const canonical = document.querySelector('link[rel="canonical"]');
    return (
      location.pathname.replace(/\/$/, "") === articlePath &&
      document.querySelector("article.blog-content") &&
      canonical &&
      new URL(canonical.href).pathname.replace(/\/$/, "") === articlePath
    );
  }, articlePath);
  await page.waitForFunction(
    () =>
      !document
        .getAnimations()
        .some((animation) =>
          String(
            animation.effect?.pseudoElement ??
              animation.effect?.target?.type ??
              "",
          ).includes("view-transition"),
        ),
  );
  await page.unroute("**/*", delayArticle);
  assert.equal(
    delayedRequests,
    1,
    "Back must fetch the delayed article Flight payload",
  );
  assert.equal(
    await page.evaluate(() => scrollY),
    600,
    "Back from another route must restore the hashed article entry's scroll",
  );
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => location.hash === "" && scrollY === 150);
  await page.evaluate(() => history.forward());
  await page.waitForFunction(
    (hash) => location.hash === hash && scrollY === 600,
    hash,
  );
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  assert.deepEqual(errors, []);
}
try {
  if (process.env.CHECK_HASH_HISTORY_ONLY === "1") {
    await page.goto(new URL("/ja/blog", base).href, {
      waitUntil: "networkidle",
    });
    await checkHashHistory();
    console.log(
      "Verified delayed cross-route hash history and native fragment Back/Forward scroll.",
    );
  } else {
    await page.goto(new URL("/ja/blog", base).href, {
      waitUntil: "networkidle",
    });
    const origin = await page.evaluate(() => performance.timeOrigin);
    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    await visit("/ja/about");
    const age = page.locator("main span").filter({ hasText: /^\d+\.\d{9}$/ });
    const previousAge = Number(await age.textContent());
    assert.ok(Number.isFinite(previousAge), "Live age must be a numeric value");
    await page.waitForFunction(
      (previous) =>
        Array.from(document.querySelectorAll("main span")).some((span) => {
          const text = span.textContent.trim();
          return /^\d+\.\d{9}$/.test(text) && Number(text) > previous;
        }),
      previousAge,
    );
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "light",
    );
    await visit("/ja/accounts");
    assert.ok((await page.locator("[data-account-row]").count()) > 10);
    assert.ok((await page.locator("[data-account-row] svg").count()) > 10);
    await visit("/ja/history");
    assert.ok((await page.locator("main").innerText()).length > 100);
    await visit("/ja/blog/tag/nix");
    await page.locator('a[href="/ja/blog/sheldon-nix"]').first().click();
    await page.waitForURL(/\/ja\/blog\/sheldon-nix\/?$/);
    await page
      .getByRole("button", { name: "Copy code", exact: true })
      .first()
      .click();
    await page.waitForFunction(() => window.__copiedCode.length === 1);
    const code = await page.locator("article pre code").first().textContent();
    assert.equal(await page.evaluate(() => window.__copiedCode[0]), code);
    const codeBlocks = await page.locator("article pre").count();
    assert.equal(await page.locator(".code-copy-button").count(), codeBlocks);
    await page
      .getByRole("button", {
        name: "Toggle language between Japanese and English",
      })
      .click();
    await page.waitForURL(/\/en\/blog\/sheldon-nix\/?$/);
    await page.waitForFunction(
      () =>
        document.documentElement.lang === "en" &&
        document.querySelector("article")?.textContent.includes("Sheldon"),
    );
    assert.ok(
      (
        await page.locator('link[rel="canonical"]').getAttribute("href")
      ).includes("/en/blog/sheldon-nix"),
    );
    await visit("/ja/blog/sheldon-nix");
    await page
      .getByRole("button", { name: "Copy code", exact: true })
      .first()
      .click();
    await page.waitForFunction(() => window.__copiedCode.length === 2);
    assert.equal(await page.locator(".code-copy-button").count(), codeBlocks);
    await checkHashHistory();
    await visit("/ja");
    await page.waitForFunction(
      () =>
        document.querySelector(".home-shader canvas") &&
        document.querySelector('main img[alt="Kyure_A"]'),
    );
    const hero = await page
      .locator('main img[alt="Kyure_A"]')
      .first()
      .boundingBox();
    assert.ok(
      hero?.width > 500 && hero.x < 1440 && hero.y < 900,
      "Home hero must occupy its visible layout",
    );
    await page.evaluate(() => {
      window.__homeShader = document.querySelector(".home-shader canvas");
      window.__homeDock = document.querySelector(
        '.orbit-dock[data-layer="front"]',
      );
    });
    const blogDockButton = page
      .locator('.orbit-dock[data-layer="front"]')
      .getByRole("button", { name: "Blog", exact: true });
    await blogDockButton.focus();
    await blogDockButton.press("Enter");
    await page.waitForFunction(
      () =>
        location.pathname.replace(/\/$/, "") === "/ja/blog" &&
        document.querySelector("main h1")?.textContent === "ブログ" &&
        document.querySelector(".home-shader")?.getAttribute("aria-hidden") ===
          "true",
    );
    assert.equal(
      await page.evaluate(() => performance.timeOrigin),
      origin,
      "Keyboard activation of the orbit dock must preserve the document",
    );
    assert.equal(
      await page.locator(".home-shader").getAttribute("aria-hidden"),
      "true",
    );
    await visit("/ja");
    assert.equal(
      await page.evaluate(
        () =>
          window.__homeShader ===
            document.querySelector(".home-shader canvas") &&
          window.__homeDock ===
            document.querySelector('.orbit-dock[data-layer="front"]'),
      ),
      true,
      "Home navigation must preserve the background canvas and orbit controls",
    );
    await page
      .locator('main img[alt="Kyure_A"]')
      .first()
      .waitFor({ state: "visible" });
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "light",
    );
    assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
    assert.deepEqual(errors, []);
    await page.goto(new URL("/en/does-not-exist", base).href, {
      waitUntil: "networkidle",
    });
    await page
      .getByRole("heading", { name: "Page Not Found", exact: true })
      .waitFor();
    const fallback = await page
      .locator("section")
      .filter({
        has: page.getByRole("heading", { name: "Page Not Found", exact: true }),
      })
      .boundingBox();
    assert.ok(
      fallback?.width >= 1440 && fallback.height >= 900,
      "404 artwork must fill the viewport",
    );
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    await page.getByRole("link", { name: "Back to Home", exact: true }).click();
    await page.waitForURL(/\/en\/?$/);
    await page.waitForFunction(() =>
      document.querySelector('main img[alt="Kyure_A"]'),
    );
    assert.deepEqual(errors, []);
    console.log(
      "Verified theme persistence, live age, accounts/icons, history, tags, language/metadata, copy lifecycle, orbit dock keyboard navigation, Home continuity and localized 404 recovery.",
    );
  }
} finally {
  await browser.close();
}
