import "server-only";
import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";
import hljs from "highlight.js";
import katex from "katex";
import {
  type BlogPost,
  type BlogPostMeta,
  type BlogTagItem,
  getTagSlug,
  normalizeTagLabel,
} from "./blog";
import { DEFAULT_LANG, isSiteLang, type SiteLang } from "./i18n";

const ARTICLES_DIR = path.join(process.cwd(), "articles");
const MARKDOWN_EXTENSIONS = [".md", ".mdx"];

const TWITTER_HOSTS = new Set([
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "mobile.twitter.com",
]);

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

type LinkPreviewData = {
  title: string;
  description: string;
  image: string;
  site_name: string;
  url: string;
};

const HTML_ESCAPE_REPLACE_RE = /[&<>"']/g;
const HTML_REPLACEMENTS: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const LINK_PREVIEW_TIMEOUT_MS = 5000;
const linkPreviewCache = new Map<string, Promise<LinkPreviewData>>();
type OxParserOptions = {
  gfm?: boolean;
  footnotes?: boolean;
  taskLists?: boolean;
  tables?: boolean;
  strikethrough?: boolean;
  autolinks?: boolean;
};
type OxContentModule = {
  parseAndRender: (
    source: string,
    options?: OxParserOptions,
  ) => {
    html: string;
    errors: string[];
  };
};
const OX_MARKDOWN_OPTIONS = {
  gfm: true,
  footnotes: true,
  taskLists: true,
  tables: true,
  strikethrough: true,
  autolinks: true,
} satisfies OxParserOptions;
const HTML_PLACEHOLDER_PREFIX = "KYREHTMLPLACEHOLDER";

type HtmlPlaceholder = {
  token: string;
  html: string;
  block: boolean;
};

const replaceUnsafeChar = (ch: string) => HTML_REPLACEMENTS[ch] ?? ch;

const escapeHtml = (str: string) =>
  str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);

// biome-ignore lint/security/noGlobalEval: Keeps Turbopack from bundling Ox Content's native binding loader.
const nativeRequire = eval("require") as NodeRequire;
const OX_CONTENT_PACKAGE = "@ox-content/napi";

const loadOxContent = (): OxContentModule => {
  return nativeRequire(OX_CONTENT_PACKAGE) as OxContentModule;
};

const decodeHtmlEntities = (str: string) =>
  str
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const getHtmlAttribute = (tag: string, name: string) => {
  const normalizedName = name.toLowerCase();
  const attributes = tag.matchAll(
    /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
  );

  for (const attribute of attributes) {
    if (attribute[1].toLowerCase() !== normalizedName) continue;
    return decodeHtmlEntities(
      attribute[2] ?? attribute[3] ?? attribute[4] ?? "",
    );
  }

  return "";
};

const getMetaContent = (
  html: string,
  attr: "name" | "property",
  value: string,
) => {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const normalizedValue = value.toLowerCase();

  for (const tag of metaTags) {
    if (getHtmlAttribute(tag, attr).toLowerCase() !== normalizedValue) continue;
    const content = getHtmlAttribute(tag, "content");
    if (content) return content;
  }

  return "";
};

const getTitle = (html: string) => {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].replace(/\s+/g, " ").trim()) : "";
};

const emptyLinkPreview = (url: string): LinkPreviewData => ({
  title: "",
  description: "",
  image: "",
  site_name: "",
  url,
});

const parseLinkPreviewData = (html: string, url: string): LinkPreviewData => {
  const pageUrl = getMetaContent(html, "property", "og:url") || url;
  return {
    title: getMetaContent(html, "property", "og:title") || getTitle(html),
    description:
      getMetaContent(html, "property", "og:description") ||
      getMetaContent(html, "name", "description") ||
      getMetaContent(html, "name", "Description"),
    image: getMetaContent(html, "property", "og:image"),
    site_name: getMetaContent(html, "property", "og:site_name"),
    url: pageUrl,
  };
};

const fetchLinkPreviewData = async (url: string): Promise<LinkPreviewData> => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return emptyLinkPreview(url);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return emptyLinkPreview(url);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINK_PREVIEW_TIMEOUT_MS);

  try {
    const response = await fetch(parsedUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "kyre.moe link preview generator",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) return emptyLinkPreview(url);
    return parseLinkPreviewData(await response.text(), response.url || url);
  } catch {
    return emptyLinkPreview(url);
  } finally {
    clearTimeout(timeout);
  }
};

const getLinkPreviewData = (url: string) => {
  const cached = linkPreviewCache.get(url);
  if (cached) return cached;

  const preview = fetchLinkPreviewData(url);
  linkPreviewCache.set(url, preview);
  return preview;
};

const linkPreviewHtml = (ogData: LinkPreviewData) => {
  const url = escapeHtml(ogData.url);
  const imageHtml = ogData.image
    ? `<a class="link-preview-widget-image" href="${url}" rel="noopener" style="background-image: url('${escapeHtml(ogData.image)}');" target="_blank"></a>`
    : "";

  return `<div class="link-preview-widget"><a href="${url}" rel="noopener" target="_blank"><div class="link-preview-widget-title">${escapeHtml(ogData.title)}</div><div class="link-preview-widget-description">${escapeHtml(ogData.description)}</div><div class="link-preview-widget-url">${escapeHtml(ogData.site_name)}</div></a>${imageHtml}</div>`;
};

const buildLinkPreview = async (url: string) =>
  linkPreviewHtml(await getLinkPreviewData(url));

const buildYouTubeEmbed = (url: URL): string | null => {
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  let videoId: string | null = null;

  if (url.hostname === "youtu.be") {
    videoId = url.pathname.slice(1).split("/")[0];
  } else {
    videoId = url.searchParams.get("v");
  }

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return `<div class="markdown-embed markdown-embed-youtube"><div class="markdown-embed-inner"><a class="markdown-youtube-placeholder" href="${watchUrl}" data-youtube-video-id="${videoId}" aria-label="Play YouTube video"><img class="markdown-youtube-thumbnail" src="${thumbnailUrl}" alt="" loading="lazy" decoding="async" /><span class="markdown-youtube-play" aria-hidden="true"></span></a></div></div>`;
};

const buildTwitterEmbed = (url: URL): string | null => {
  if (!TWITTER_HOSTS.has(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const statusIndex = parts.findIndex(
    (part) => part === "status" || part === "statuses",
  );
  if (statusIndex === -1) return null;
  const id = parts[statusIndex + 1];
  if (!id || !/^\d+$/.test(id)) return null;
  const user = parts[statusIndex - 1] ?? "i";
  const canonical = `https://twitter.com/${user}/status/${id}`;
  return `<div class="markdown-embed markdown-embed-twitter"><blockquote class="twitter-tweet" data-dnt="true" data-theme="dark" data-width="550"><a href="${canonical}" aria-label="View this post on X"></a></blockquote></div>`;
};

const addHtmlPlaceholder = (
  placeholders: HtmlPlaceholder[],
  html: string,
  block: boolean,
) => {
  const token = `${HTML_PLACEHOLDER_PREFIX}_${placeholders.length}`;
  placeholders.push({ token, html, block });
  return token;
};

const buildMagicLink = (user: string) => {
  const safeUser = escapeHtml(user);
  const url = `https://github.com/${safeUser}`;
  const avatar = `https://github.com/${safeUser}.png?size=40`;
  return `<a class="markdown-magic-link" href="${url}" rel="noopener" target="_blank"><span class="markdown-magic-link-image" style="background-image: url('${avatar}');" aria-hidden="true"></span>@${safeUser}</a>`;
};

const renderMath = (source: string, displayMode: boolean) => {
  try {
    return katex.renderToString(source, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return escapeHtml(source);
  }
};

const normalizeAngleLinkDestinations = (line: string) =>
  line.replace(/\]\(<(https?:\/\/[^>\s]+)>\)/g, "]($1)");

const normalizeTaskListMarkers = (line: string) =>
  line.replace(
    /^([ \t]*(?:[-+*]|\d+[.)]))[ \t]+\[([ xX])\][ \t]+/,
    (_match, bullet: string, marker: string) =>
      `${bullet} [${marker === "X" ? "x" : marker}] `,
  );

const decodeSafeNumericEntities = (line: string) =>
  line
    .replace(/&#x([\da-f]+);/gi, (match, code: string) => {
      const value = Number.parseInt(code, 16);
      if ([34, 38, 39, 60, 62].includes(value)) return match;
      return String.fromCodePoint(value);
    })
    .replace(/&#(\d+);/g, (match, code: string) => {
      const value = Number.parseInt(code, 10);
      if ([34, 38, 39, 60, 62].includes(value)) return match;
      return String.fromCodePoint(value);
    });

const escapeRawHtmlLine = (line: string) =>
  line.replace(/<([A-Za-z!/][^>\n]*)>/g, "&lt;$1&gt;");

const replaceInlineMath = (line: string, placeholders: HtmlPlaceholder[]) => {
  let result = "";
  let cursor = 0;
  let inlineCodeTicks = 0;

  while (cursor < line.length) {
    const ch = line[cursor];
    if (ch === "`") {
      const run = line.slice(cursor).match(/^`+/)?.[0] ?? "`";
      inlineCodeTicks = inlineCodeTicks === run.length ? 0 : run.length;
      result += run;
      cursor += run.length;
      continue;
    }

    if (inlineCodeTicks === 0 && ch === "$" && line[cursor + 1] !== "$") {
      let end = cursor + 1;
      while (end < line.length) {
        if (line[end] === "$" && line[end - 1] !== "\\") break;
        end += 1;
      }
      if (end < line.length) {
        const math = line.slice(cursor + 1, end);
        if (math.trim()) {
          result += addHtmlPlaceholder(
            placeholders,
            renderMath(math, false),
            false,
          );
          cursor = end + 1;
          continue;
        }
      }
    }

    result += ch;
    cursor += 1;
  }

  return result;
};

const replaceMagicLinks = (line: string, placeholders: HtmlPlaceholder[]) =>
  line.replace(
    /\{@([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\}/g,
    (_match, user: string) =>
      addHtmlPlaceholder(placeholders, buildMagicLink(user), false),
  );

const replaceInlineAutolinks = (line: string) =>
  line.replace(/<((?:https?:\/\/)[^>\s]+)>/g, "[$1]($1)");

const restoreHtmlPlaceholders = (
  html: string,
  placeholders: HtmlPlaceholder[],
) => {
  let result = html;
  for (const placeholder of placeholders) {
    if (placeholder.block) {
      result = result.replaceAll(
        `<p>${placeholder.token}</p>`,
        placeholder.html,
      );
    }
    result = result.replaceAll(placeholder.token, placeholder.html);
  }
  return result;
};

const renderHighlightedCodeBlock = (escapedCode: string, lang: string) => {
  const code = decodeHtmlEntities(escapedCode);
  try {
    if (lang && hljs.getLanguage(lang)) {
      const result = hljs.highlight(code, {
        language: lang,
        ignoreIllegals: true,
      });
      return `<pre class="hljs"><code class="hljs language-${escapeHtml(lang)}">${result.value}</code></pre>`;
    }
    const result = hljs.highlightAuto(code);
    const langClass = result.language
      ? ` language-${escapeHtml(result.language)}`
      : "";
    return `<pre class="hljs"><code class="hljs${langClass}">${result.value}</code></pre>`;
  } catch {
    return `<pre class="hljs"><code class="hljs">${escapedCode}</code></pre>`;
  }
};

const highlightCodeBlocks = (html: string) =>
  html.replace(
    /<pre><code(?: class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang: string | undefined, code: string) =>
      renderHighlightedCodeBlock(code, lang ?? ""),
  );

const normalizeOxHtml = (html: string) =>
  html
    .replace(
      /<blockquote class="ox-callout ox-callout--([a-z]+)">/g,
      (_match, kind: string) =>
        `<blockquote class="markdown-alert markdown-alert-${kind}">`,
    )
    .replace(
      /<p class="ox-callout-title">([\s\S]*?)<\/p>/g,
      '<p class="markdown-alert-title">$1</p>',
    )
    .replace(
      /<li>(\s*<input type="checkbox"[^>]*>)/g,
      '<li class="task-list-item">$1',
    );

const preprocessMarkdown = async (source: string) => {
  const placeholders: HtmlPlaceholder[] = [];
  const lines = source.split(/\r?\n/);
  const output: string[] = [];
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^[ \t]*(`{3,}|~{3,})/);
    if (fence) {
      const marker = fence[1];
      const isClosing =
        inFence && marker[0] === fenceChar && marker.length >= fenceLen;
      if (isClosing) {
        inFence = false;
        fenceChar = "";
        fenceLen = 0;
      } else if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceLen = marker.length;
      }
      output.push(line);
      continue;
    }

    if (inFence) {
      output.push(line);
      continue;
    }

    if (line.trim() === "$$") {
      const mathLines: string[] = [];
      let end = index + 1;
      while (end < lines.length && lines[end].trim() !== "$$") {
        mathLines.push(lines[end]);
        end += 1;
      }
      if (end < lines.length) {
        output.push(
          addHtmlPlaceholder(
            placeholders,
            renderMath(mathLines.join("\n"), true),
            true,
          ),
        );
        index = end;
        continue;
      }
    }

    const preview = line.match(
      /^[ \t]*\[@preview\]\((?:<([^>]+)>|([^)]+))\)[ \t]*$/,
    );
    if (preview) {
      output.push(
        addHtmlPlaceholder(
          placeholders,
          await buildLinkPreview(preview[1] ?? preview[2]),
          true,
        ),
      );
      continue;
    }

    const autolink = line.match(/^[ \t]*<(https?:\/\/[^>\s]+)>[ \t]*$/);
    if (autolink) {
      const url = new URL(autolink[1]);
      const embed = buildYouTubeEmbed(url) ?? buildTwitterEmbed(url);
      output.push(
        embed
          ? addHtmlPlaceholder(placeholders, embed, true)
          : `[${autolink[1]}](${autolink[1]})`,
      );
      continue;
    }

    const normalized = normalizeAngleLinkDestinations(
      normalizeTaskListMarkers(line),
    );
    const withAutolinks = replaceInlineAutolinks(normalized);
    const withMath = replaceInlineMath(withAutolinks, placeholders);
    const withMagicLinks = replaceMagicLinks(withMath, placeholders);
    output.push(decodeSafeNumericEntities(escapeRawHtmlLine(withMagicLinks)));
  }

  return {
    markdown: output.join("\n"),
    placeholders,
  };
};

const renderMarkdown = async (source: string) => {
  const { markdown, placeholders } = await preprocessMarkdown(source);
  const { parseAndRender } = loadOxContent();
  const result = parseAndRender(markdown, OX_MARKDOWN_OPTIONS);
  if (result.errors.length > 0) {
    throw new Error(
      `Ox Content failed to render Markdown: ${result.errors.join("\n")}`,
    );
  }
  return normalizeOxHtml(
    highlightCodeBlocks(restoreHtmlPlaceholders(result.html, placeholders)),
  );
};

const safeReadDir = (dirPath: string) => {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
};

const createExcerpt = (source: string, maxLength = 180) => {
  const stripped = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return "";
  return stripped.length > maxLength
    ? `${stripped.slice(0, maxLength).trim()}…`
    : stripped;
};

const resolveLangFromFile = (fileName: string): SiteLang | null => {
  const base = path.parse(fileName).name;
  if (isSiteLang(base)) return base;
  if (base === "index") return DEFAULT_LANG;
  return null;
};

const parseFrontmatter = (
  slug: string,
  lang: SiteLang,
  filePath: string,
): { meta: BlogPostMeta; content: string } => {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const title = typeof data.title === "string" ? data.title : slug;
  const description =
    typeof data.description === "string"
      ? data.description
      : createExcerpt(content);
  const date = typeof data.date === "string" ? data.date : "";
  const tags = Array.isArray(data.tags)
    ? data.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : typeof data.tags === "string"
      ? data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
  const canonical =
    typeof data.canonical === "string" ? data.canonical : undefined;
  const cover = typeof data.cover === "string" ? data.cover : undefined;
  const draft = data.draft === true;

  return {
    meta: {
      slug,
      lang,
      title,
      description,
      date,
      tags,
      canonical,
      cover,
      draft,
    },
    content,
  };
};

const getPostFilePath = (slug: string, lang: SiteLang): string | null => {
  const dirPath = path.join(ARTICLES_DIR, slug);
  const ext = MARKDOWN_EXTENSIONS.find((item) =>
    fs.existsSync(path.join(dirPath, `${lang}${item}`)),
  );
  return ext ? path.join(dirPath, `${lang}${ext}`) : null;
};

const comparePostsByDateDesc = (a: BlogPostMeta, b: BlogPostMeta) => {
  const aTime = a.date ? new Date(a.date).getTime() : 0;
  const bTime = b.date ? new Date(b.date).getTime() : 0;
  return bTime - aTime;
};

const pickPreferredTagLabel = (current: string, candidate: string) => {
  return candidate < current ? candidate : current;
};

const buildCanonicalTagLabelMap = (posts: BlogPostMeta[]) => {
  const labels = new Map<string, string>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const label = normalizeTagLabel(tag);
      const slug = getTagSlug(label);
      if (!slug) continue;
      const current = labels.get(slug);
      labels.set(slug, current ? pickPreferredTagLabel(current, label) : label);
    }
  }

  return labels;
};

const canonicalizeTags = (tags: string[], labels: Map<string, string>) => {
  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const tag of tags) {
    const slug = getTagSlug(tag);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    normalizedTags.push(labels.get(slug) ?? normalizeTagLabel(tag));
  }

  return normalizedTags;
};

const readAllPosts = (lang?: SiteLang): BlogPostMeta[] => {
  const entries = safeReadDir(ARTICLES_DIR).filter((entry) =>
    entry.isDirectory(),
  );
  return entries.flatMap((entry) => {
    const slug = entry.name;
    const dirPath = path.join(ARTICLES_DIR, slug);
    const files = safeReadDir(dirPath).filter((file) => file.isFile());

    return files
      .map((file) => {
        const ext = path.extname(file.name);
        if (!MARKDOWN_EXTENSIONS.includes(ext)) return null;
        const fileLang = resolveLangFromFile(file.name);
        if (!fileLang) return null;
        if (lang && fileLang !== lang) return null;
        const filePath = path.join(dirPath, file.name);
        const { meta } = parseFrontmatter(slug, fileLang, filePath);
        if (meta.draft) return null;
        return meta;
      })
      .filter((meta): meta is BlogPostMeta => Boolean(meta));
  });
};

export const getAllPosts = (lang?: SiteLang): BlogPostMeta[] => {
  const posts = readAllPosts(lang);
  const labels = buildCanonicalTagLabelMap(posts);

  return posts
    .map((post) => ({
      ...post,
      tags: canonicalizeTags(post.tags, labels),
    }))
    .sort(comparePostsByDateDesc);
};

export const getPostsByTag = (tag: string, lang?: SiteLang): BlogPostMeta[] => {
  const slug = getTagSlug(tag);
  if (!slug) return [];
  return getAllPosts(lang).filter((post) =>
    post.tags.some((postTag) => getTagSlug(postTag) === slug),
  );
};

export const getAllTagItems = (lang?: SiteLang): BlogTagItem[] => {
  const tags = new Map<string, BlogTagItem>();

  for (const post of getAllPosts(lang)) {
    for (const tag of post.tags) {
      const slug = getTagSlug(tag);
      const label = normalizeTagLabel(tag);
      if (!slug) continue;

      const current = tags.get(slug);
      if (current) {
        current.count += 1;
        current.label = pickPreferredTagLabel(current.label, label);
        continue;
      }

      tags.set(slug, {
        slug,
        label,
        count: 1,
      });
    }
  }

  return Array.from(tags.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
};

export const getTagItem = (
  tag: string,
  lang?: SiteLang,
): BlogTagItem | null => {
  const slug = getTagSlug(tag);
  if (!slug) return null;
  return getAllTagItems(lang).find((item) => item.slug === slug) ?? null;
};

export const getAllTags = (lang?: SiteLang): string[] => {
  return getAllTagItems(lang).map((item) => item.slug);
};

const rewriteRelativeImagePaths = (content: string, slug: string): string => {
  // ![alt](./path) 形式
  const markdownImageRegex = /!\[([^\]]*)\]\(\.\/([^)]+)\)/g;
  // [text](./path) 形式（画像リンク）
  const markdownLinkImageRegex =
    /\[([^\]]*)\]\(\.\/([^)]+\.(png|jpg|jpeg|gif|webp|svg))\)/gi;

  let result = content.replace(
    markdownImageRegex,
    (_match, alt, imagePath) => `![${alt}](/blog/${slug}/${imagePath})`,
  );
  result = result.replace(
    markdownLinkImageRegex,
    (_match, text, imagePath) => `[${text}](/blog/${slug}/${imagePath})`,
  );

  return result;
};

export const getPost = async (
  slug: string,
  lang: SiteLang,
): Promise<BlogPost | null> => {
  const filePath = getPostFilePath(slug, lang);
  if (!filePath) return null;
  const { meta, content } = parseFrontmatter(slug, lang, filePath);
  if (meta.draft) return null;
  const tags =
    getAllPosts(lang).find((post) => post.slug === slug && post.lang === lang)
      ?.tags ?? meta.tags;
  const rewrittenContent = rewriteRelativeImagePaths(content, slug);
  const html = await renderMarkdown(rewrittenContent);
  return { ...meta, tags, content: rewrittenContent, html };
};

export const getPostLanguages = (slug: string): SiteLang[] => {
  const dirPath = path.join(ARTICLES_DIR, slug);
  const files = safeReadDir(dirPath).filter((file) => file.isFile());
  const langs = new Set(
    files
      .map((file) => {
        const ext = path.extname(file.name);
        if (!MARKDOWN_EXTENSIONS.includes(ext)) return null;
        return resolveLangFromFile(file.name);
      })
      .filter((fileLang): fileLang is SiteLang => Boolean(fileLang)),
  );
  return Array.from(langs);
};
