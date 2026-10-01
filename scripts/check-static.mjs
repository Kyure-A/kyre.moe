import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import index from "../src/generated/blog-index.json" with { type: "json" };
import paths from "../src/generated/prerender-paths.json" with { type: "json" };

const root = "dist/client";
const origin = "https://kyre.moe";
const publishedPaths = paths.filter((path) => path !== "/404");

for (const image of [
  "kyure_a.webp",
  "kyure_a-640.webp",
  "kyure_a-1000.webp",
  "kyure_a-1600.webp",
]) {
  await access(join(root, image));
}

for (const path of publishedPaths) {
  const html = await readFile(
    join(root, decodeURIComponent(path), "index.html"),
    "utf8",
  );
  const head = html.split("</head>")[0];
  for (const [name, pattern] of [
    ["title", /<title>/g],
    ["description", /<meta name="description"/g],
    ["canonical", /<link rel="canonical"/g],
    ["OGP image", /<meta property="og:image"/g],
  ]) {
    assert.equal(
      [...head.matchAll(pattern)].length,
      1,
      `${path}: expected one ${name}`,
    );
  }
  const lang = path.startsWith("/en") ? "en" : "ja";
  assert.ok(
    html.includes(`<html lang="${lang}"`),
    `${path}: incorrect document language`,
  );
  const post = index.posts.find(
    (post) => `/${post.lang}/blog/${post.slug}` === path,
  );
  const canonical = post?.canonical ?? (path === "/" ? "/ja" : path);
  const canonicalUrl = new URL(canonical, origin).href;
  assert.ok(
    head.includes(`rel="canonical" href="${canonicalUrl}"`),
    `${path}: incorrect canonical`,
  );
  assert.ok(
    head.includes(`property="og:url" content="${canonicalUrl}"`),
    `${path}: inconsistent og:url`,
  );
  if (path === "/" || post?.canonical) {
    assert.ok(
      head.includes("noindex, follow"),
      `${path}: duplicate page must be noindex`,
    );
  }
  if (post) {
    assert.ok(
      html.includes("<article"),
      `${path}: article was not prerendered`,
    );
    assert.ok(!post.draft, `${path}: draft should not be published`);
  }
  const image = new URL(head.match(/property="og:image" content="([^"]+)"/)[1]);
  if (image.origin === origin) {
    await access(join(root, decodeURIComponent(image.pathname)));
  }
}

const fallback = await readFile(join(root, "404.html"), "utf8");
assert.ok(fallback.includes("noindex, follow"), "404 fallback must be noindex");
await access(join(root, ".nojekyll"));
const robots = await readFile(join(root, "robots.txt"), "utf8");
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
for (const post of index.posts) {
  const url = `${origin}/${post.lang}/blog/${post.slug}`;
  const externalCanonical =
    post.canonical && new URL(post.canonical, origin).origin !== origin;
  assert.equal(
    sitemap.includes(`<loc>${url}</loc>`),
    !externalCanonical,
    `${url}: incorrect sitemap membership`,
  );
}
console.log(
  `Verified ${publishedPaths.length} static pages, unique metadata, OGP assets, 404 and sitemap.`,
);
