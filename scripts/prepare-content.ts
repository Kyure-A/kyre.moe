import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { type BlogPostMeta, buildTagPath } from "../src/shared/lib/blog";
import {
  getAllPosts,
  getAllTagItems,
  getPost,
} from "../src/shared/lib/blog.server";
import { SITE_LANGS } from "../src/shared/lib/i18n";
import { generateOgImage, type OgImageProps } from "../src/shared/lib/og-image";

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, "src", "generated");
const POSTS_DIR = path.join(GENERATED_DIR, "posts");
const PUBLIC_DIR = path.join(ROOT, "public");
const OG_CACHE_PATH = path.join(GENERATED_DIR, ".og-image-cache.json");
const BASE_URL = "https://kyre.moe";
const STATIC_ROUTES = [
  "",
  "/about",
  "/accounts",
  "/history",
  "/blog",
  "/blog/tag",
];

const writeIfChanged = (filePath: string, content: string) => {
  if (
    fs.existsSync(filePath) &&
    fs.readFileSync(filePath, "utf8") === content
  ) {
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const writeJson = (filePath: string, value: unknown) =>
  writeIfChanged(filePath, `${JSON.stringify(value)}\n`);

const readOgCache = (): Record<string, string> => {
  try {
    return JSON.parse(fs.readFileSync(OG_CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
};

const isGeneratedOgPath = (imagePath: string) =>
  !imagePath
    .split("/")
    .some((segment) => segment === "." || segment === "..") &&
  (/^\/(?:ja|en)\/blog(?:\/[^/]+)*\/opengraph-image\.png$/.test(imagePath) ||
    /^\/og\/blog\/tag\/(?:ja|en)\/[a-f0-9]{64}\.png$/.test(imagePath));

const isExternalCanonical = (canonical?: string) => {
  if (!canonical || canonical.startsWith("/")) return false;
  try {
    return new URL(canonical).hostname !== "kyre.moe";
  } catch {
    return false;
  }
};

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return replacements[character];
  });

const sitemapEntry = (routePath: string, post?: BlogPostMeta) => {
  const date = post?.date ? new Date(post.date) : null;
  const lastModified =
    date && !Number.isNaN(date.getTime())
      ? `<lastmod>${date.toISOString()}</lastmod>`
      : "";
  return `<url><loc>${escapeXml(`${BASE_URL}${routePath}`)}</loc>${lastModified}</url>`;
};

const removeStalePosts = (
  expectedFiles: Set<string>,
  directory = POSTS_DIR,
) => {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      removeStalePosts(expectedFiles, filePath);
      if (fs.readdirSync(filePath).length === 0) fs.rmdirSync(filePath);
    } else if (!expectedFiles.has(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

export const prepareContent = async () => {
  const localizedPosts = new Map(
    SITE_LANGS.flatMap((lang) =>
      getAllPosts(lang).map((post) => [`${lang}/${post.slug}`, post] as const),
    ),
  );
  const posts = getAllPosts().map(
    (post) => localizedPosts.get(`${post.lang}/${post.slug}`) ?? post,
  );
  const tags = {
    ja: getAllTagItems("ja"),
    en: getAllTagItems("en"),
  };
  const staticPaths = SITE_LANGS.flatMap((lang) =>
    STATIC_ROUTES.map((routePath) => `/${lang}${routePath}`),
  );
  const postPaths = posts.map((post) => `/${post.lang}/blog/${post.slug}`);
  const tagPaths = SITE_LANGS.flatMap((lang) =>
    tags[lang].map((tag) => buildTagPath(tag.slug, lang)),
  );
  const expectedFiles = new Set<string>();
  const ogImages: Record<string, string> = {};
  const previousOgCache = readOgCache();
  const nextOgCache: Record<string, string> = {};
  const imageFingerprint = createHash("sha256")
    .update(fs.readFileSync(fileURLToPath(import.meta.url)))
    .update(
      fs.readFileSync(path.join(ROOT, "src", "shared", "lib", "og-image.tsx")),
    )
    .update(fs.readFileSync(path.join(PUBLIC_DIR, "icon.jpg")))
    .update(process.env.OG_IMAGE_FONT_PATH ?? "")
    .digest("hex");

  const writeOgImage = async (
    routePath: string,
    imagePath: string,
    props: OgImageProps,
  ) => {
    ogImages[routePath] = imagePath;
    const imageHash = createHash("sha256")
      .update(imageFingerprint)
      .update(JSON.stringify(props))
      .digest("hex");
    nextOgCache[imagePath] = imageHash;
    const filePath = path.join(PUBLIC_DIR, imagePath);
    if (previousOgCache[imagePath] === imageHash && fs.existsSync(filePath))
      return;
    const response = await generateOgImage(props);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()));
  };

  for (const lang of SITE_LANGS) {
    await writeOgImage(`/${lang}/blog`, `/${lang}/blog/opengraph-image.png`, {
      title: "Blog",
      subtitle: "Kyure_A / キュレェ",
    });
    await writeOgImage(
      `/${lang}/blog/tag`,
      `/${lang}/blog/tag/opengraph-image.png`,
      {
        title: lang === "ja" ? "タグ一覧" : "Tags",
        subtitle: "Kyure_A / キュレェ",
      },
    );
    for (const tag of tags[lang]) {
      const tagHash = createHash("sha256").update(tag.slug).digest("hex");
      await writeOgImage(
        buildTagPath(tag.slug, lang),
        `/og/blog/tag/${lang}/${tagHash}.png`,
        {
          title: lang === "ja" ? `#${tag.label} の記事` : `#${tag.label} posts`,
          subtitle: lang === "ja" ? "タグアーカイブ" : "Tag archive",
          tags: [tag.label],
        },
      );
    }
  }

  for (const postMeta of posts) {
    const post = await getPost(postMeta.slug, postMeta.lang);
    if (!post)
      throw new Error(
        `Published post could not be read: ${postMeta.lang}/${postMeta.slug}`,
      );
    const { content: _content, ...publishedPost } = post;
    const filePath = path.join(POSTS_DIR, post.lang, `${post.slug}.json`);
    expectedFiles.add(filePath);
    writeJson(filePath, publishedPost);
    const routePath = `/${post.lang}/blog/${post.slug}`;
    await writeOgImage(routePath, `${routePath}/opengraph-image.png`, {
      title: post.title,
      subtitle: post.date || undefined,
      tags: post.tags,
    });
  }

  removeStalePosts(expectedFiles);
  for (const imagePath of Object.keys(previousOgCache)) {
    if (!nextOgCache[imagePath] && isGeneratedOgPath(imagePath)) {
      fs.rmSync(path.join(PUBLIC_DIR, imagePath), { force: true });
    }
  }
  writeJson(OG_CACHE_PATH, nextOgCache);
  writeJson(path.join(GENERATED_DIR, "blog-index.json"), {
    posts,
    tags,
    ogImages,
  });
  writeJson(path.join(GENERATED_DIR, "prerender-paths.json"), [
    "/",
    "/404",
    ...staticPaths,
    ...postPaths,
    ...tagPaths,
  ]);
  const sitemapEntries = [
    ...staticPaths.map((routePath) => sitemapEntry(routePath)),
    ...posts
      .filter((post) => !isExternalCanonical(post.canonical))
      .map((post) => sitemapEntry(`/${post.lang}/blog/${post.slug}`, post)),
    ...tagPaths.map((routePath) => sitemapEntry(routePath)),
  ];
  writeIfChanged(
    path.join(PUBLIC_DIR, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.join("")}</urlset>\n`,
  );
  writeIfChanged(
    path.join(PUBLIC_DIR, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`,
  );
  console.log(
    `Prepared ${posts.length} posts and ${tagPaths.length} tag archives.`,
  );
};

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  prepareContent().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
