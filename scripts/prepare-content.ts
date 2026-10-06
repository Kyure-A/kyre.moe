import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAllPosts,
  getAllTagItems,
  getPost,
} from "../src/shared/lib/blog.server.ts";
import { type BlogPostMeta, buildTagPath } from "../src/shared/lib/blog.ts";
import { SITE_LANGS } from "../src/shared/lib/i18n.ts";
import {
  generateOgImage,
  OG_IMAGE_FINGERPRINT,
  type OgImageProps,
} from "../src/shared/lib/og-image.ts";

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

const runJobs = async (jobs: (() => Promise<void>)[], concurrency = 4) => {
  const remaining = jobs.values();
  await Promise.all(
    Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
      for (const job of remaining) await job();
    }),
  );
};

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
  const ogJobs: (() => Promise<void>)[] = [];
  const imageFingerprint = createHash("sha256")
    .update(
      fs.readFileSync(path.join(ROOT, "src", "shared", "lib", "og-image.ts")),
    )
    .update(OG_IMAGE_FINGERPRINT)
    .digest("hex");

  const queueOgImage = (
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
    ogJobs.push(async () => {
      const image = await generateOgImage(props);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, image);
    });
  };

  for (const lang of SITE_LANGS) {
    queueOgImage(`/${lang}/blog`, `/${lang}/blog/opengraph-image.png`, {
      title: "Blog",
      subtitle: "Kyure_A / キュレェ",
    });
    queueOgImage(`/${lang}/blog/tag`, `/${lang}/blog/tag/opengraph-image.png`, {
      title: lang === "ja" ? "タグ一覧" : "Tags",
      subtitle: "Kyure_A / キュレェ",
    });
    for (const tag of tags[lang]) {
      const tagHash = createHash("sha256").update(tag.slug).digest("hex");
      queueOgImage(
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

  // Queue images from metadata before rendering posts so native image work can
  // overlap network requests without allowing an unbounded number of renders.
  for (const post of posts) {
    const routePath = `/${post.lang}/blog/${post.slug}`;
    queueOgImage(routePath, `${routePath}/opengraph-image.png`, {
      title: post.title,
      subtitle: post.date || undefined,
      tags: post.tags,
    });
  }

  const postJobs = posts.map((postMeta) => async () => {
    const post = await getPost(postMeta);
    if (!post)
      throw new Error(
        `Published post could not be read: ${postMeta.lang}/${postMeta.slug}`,
      );
    const { content: _content, ...publishedPost } = post;
    const filePath = path.join(POSTS_DIR, post.lang, `${post.slug}.json`);
    expectedFiles.add(filePath);
    writeJson(filePath, publishedPost);
  });

  await Promise.all([runJobs(postJobs), runJobs(ogJobs)]);

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
    `Prepared ${posts.length} posts and ${tagPaths.length} tag archives (${ogJobs.length} OGP images rendered, ${Object.keys(nextOgCache).length - ogJobs.length} cached).`,
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
