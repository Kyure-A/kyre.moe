import "server-only";
import * as fs from "node:fs";
import * as path from "node:path";
import katex from "@vscode/markdown-it-katex";
import matter from "gray-matter";
import hljs from "highlight.js";
import {
  createMarkdownExit,
  type PluginSimple,
  type PluginWithOptions,
} from "markdown-exit";
import markdownItBudoux from "markdown-it-budoux";
import footnote from "markdown-it-footnote";
import githubAlerts from "markdown-it-github-alerts";
import magicLink, {
  handlerGitHubAt,
  handlerLink,
} from "markdown-it-magic-link";
import taskLists from "markdown-it-task-lists";
import markdownItTocDoneRight from "markdown-it-toc-done-right";
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

const replaceUnsafeChar = (ch: string) => HTML_REPLACEMENTS[ch] ?? ch;

const escapeHtml = (str: string) =>
  str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);

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

const linkPreviewPlugin: PluginSimple = (md) => {
  const defaultRender =
    md.renderer.rules.link_open ??
    ((tokens, idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  const isLinkPreview = (
    tokens: Parameters<typeof defaultRender>[0],
    idx: number,
  ) => {
    const token = tokens[idx + 1];
    return token?.type === "text" && token.content === "@preview";
  };

  const hideTokensUntilLinkClose = (
    tokens: Parameters<typeof defaultRender>[0],
    idx: number,
  ) => {
    tokens[idx + 1].content = "";
    for (let i = idx + 1; i < tokens.length; i++) {
      tokens[i].hidden = true;
      if (tokens[i].type === "link_close") break;
    }
  };

  const getHref = (
    tokens: Parameters<typeof defaultRender>[0],
    idx: number,
  ) => {
    const hrefIdx = tokens[idx].attrIndex("href");
    return hrefIdx >= 0 ? (tokens[idx].attrs?.[hrefIdx]?.[1] ?? "") : "";
  };

  md.renderer.rules.link_open = async (tokens, idx, options, env, self) => {
    if (!isLinkPreview(tokens, idx)) {
      return defaultRender(tokens, idx, options, env, self);
    }

    hideTokensUntilLinkClose(tokens, idx);
    const url = getHref(tokens, idx);
    const ogData = await getLinkPreviewData(url);
    return linkPreviewHtml(ogData);
  };
};

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

const embedPlugin: PluginSimple = (md) => {
  md.core.ruler.after("inline", "embed", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type !== "paragraph_open") continue;
      const inline = tokens[i + 1];
      const close = tokens[i + 2];
      if (!inline || !close) continue;
      if (inline.type !== "inline" || close.type !== "paragraph_close")
        continue;

      const children = inline.children ?? [];
      const meaningful = children.filter(
        (child) => child.type !== "text" || child.content?.trim(),
      );
      if (meaningful.length !== 3) continue;
      const [open, , end] = meaningful;
      if (open.type !== "link_open" || end.type !== "link_close") continue;

      const href =
        open.attrGet?.("href") ??
        open.attrs?.find(([name]) => name === "href")?.[1];
      if (!href) continue;

      let url: URL;
      try {
        url = new URL(href);
      } catch {
        continue;
      }

      const html = buildYouTubeEmbed(url) ?? buildTwitterEmbed(url);
      if (!html) continue;

      const embedToken = new state.Token("html_block", "", 0);
      embedToken.content = `${html}\n`;
      tokens.splice(i, 3, embedToken);
    }
  });
};

const md = createMarkdownExit({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (code, lang) => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        const result = hljs.highlight(code, {
          language: lang,
          ignoreIllegals: true,
        });
        return `<pre class="hljs"><code class="hljs language-${lang}">${result.value}</code></pre>`;
      }
      const result = hljs.highlightAuto(code);
      const langClass = result.language ? ` language-${result.language}` : "";
      return `<pre class="hljs"><code class="hljs${langClass}">${result.value}</code></pre>`;
    } catch {
      return "";
    }
  },
});

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
  const html = await md.renderAsync(rewrittenContent);
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

const asPluginSimple = <T>(plugin: T) => plugin as unknown as PluginSimple;
const asPluginWithOptions = <T, O>(plugin: T) =>
  plugin as unknown as PluginWithOptions<O>;

md.use(asPluginSimple(footnote));
md.use(
  asPluginWithOptions<
    typeof taskLists,
    { label?: boolean; labelAfter?: boolean }
  >(taskLists),
  { label: true, labelAfter: false },
);
md.use(asPluginSimple(githubAlerts));
md.use(asPluginSimple(katex));
md.use(
  asPluginWithOptions<typeof magicLink, { handlers?: unknown[] }>(magicLink),
  { handlers: [handlerLink(), handlerGitHubAt()] },
);
md.use(linkPreviewPlugin);
md.use(embedPlugin);
md.use(asPluginSimple(markdownItTocDoneRight));
md.use(asPluginSimple(markdownItBudoux({ language: "ja" })));
md.inline.ruler.after("emphasis", "underline", (state, silent) => {
  const start = state.pos;
  if (state.src.charCodeAt(start) !== 0x5f) return false;
  if (state.src.charCodeAt(start + 1) !== 0x5f) return false;
  let pos = start + 2;
  while (pos < state.posMax) {
    if (
      state.src.charCodeAt(pos) === 0x5f &&
      state.src.charCodeAt(pos + 1) === 0x5f
    ) {
      if (!silent) {
        state.push("u_open", "u", 1);
        state.push("text", "", 0).content = state.src.slice(start + 2, pos);
        state.push("u_close", "u", -1);
      }
      state.pos = pos + 2;
      return true;
    }
    pos += 1;
  }
  return false;
});
md.renderer.rules.u_open = () => "<u>";
md.renderer.rules.u_close = () => "</u>";
