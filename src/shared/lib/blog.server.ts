import "server-only";
import katex from "@vscode/markdown-it-katex";
import * as fs from "node:fs";
import matter from "gray-matter";
import hljs from "highlight.js";
import {
  createMarkdownExit,
  type PluginSimple,
  type PluginWithOptions,
} from "markdown-exit";
import footnote from "markdown-it-footnote";
import githubAlerts from "markdown-it-github-alerts";
import linkPreview from "markdown-it-link-preview";
import magicLink, {
  handlerGitHubAt,
  handlerLink,
} from "markdown-it-magic-link";
import taskLists from "markdown-it-task-lists";
import markdownItTocDoneRight from "markdown-it-toc-done-right";
import * as path from "node:path";
import type { BlogPost, BlogPostMeta } from "./blog";
import { DEFAULT_LANG, isSiteLang, type SiteLang } from "./i18n";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
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

function buildYouTubeEmbed(url: URL): string | null {
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  let videoId: string | null = null;

  if (url.hostname === "youtu.be") {
    videoId = url.pathname.slice(1).split("/")[0];
  } else {
    videoId = url.searchParams.get("v");
  }

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;

  return `<div class="markdown-embed markdown-embed-youtube"><div class="markdown-embed-inner"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div></div>`;
}

function buildTwitterEmbed(url: URL): string | null {
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
  return `<div class="markdown-embed markdown-embed-twitter"><blockquote class="twitter-tweet" data-dnt="true" data-theme="dark" data-width="550"><a href="${canonical}"></a></blockquote></div>`;
}

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

function safeReadDir(dirPath: string) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function createExcerpt(source: string, maxLength = 180) {
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
}

function resolveLangFromFile(fileName: string): SiteLang | null {
  const base = path.parse(fileName).name;
  if (isSiteLang(base)) return base;
  if (base === "index") return DEFAULT_LANG;
  return null;
}

function parseFrontmatter(
  slug: string,
  lang: SiteLang,
  filePath: string,
): { meta: BlogPostMeta; content: string } {
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
}

function getPostFilePath(slug: string, lang: SiteLang): string | null {
  const dirPath = path.join(BLOG_DIR, slug);
  const ext = MARKDOWN_EXTENSIONS.find((item) =>
    fs.existsSync(path.join(dirPath, `${lang}${item}`)),
  );
  return ext ? path.join(dirPath, `${lang}${ext}`) : null;
}

export function getAllPosts(lang?: SiteLang): BlogPostMeta[] {
  const entries = safeReadDir(BLOG_DIR).filter((entry) => entry.isDirectory());
  const posts = entries.flatMap((entry) => {
    const slug = entry.name;
    const dirPath = path.join(BLOG_DIR, slug);
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

  return posts.sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

export function getPostsByTag(tag: string, lang?: SiteLang): BlogPostMeta[] {
  const normalized = tag.trim();
  if (!normalized) return [];
  return getAllPosts(lang).filter((post) => post.tags.includes(normalized));
}

export function getAllTags(lang?: SiteLang): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts(lang)) {
    for (const tag of post.tags) {
      const normalized = tag.trim();
      if (normalized) tags.add(normalized);
    }
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function rewriteRelativeImagePaths(content: string, slug: string): string {
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
}

export async function getPost(
  slug: string,
  lang: SiteLang,
): Promise<BlogPost | null> {
  const filePath = getPostFilePath(slug, lang);
  if (!filePath) return null;
  const { meta, content } = parseFrontmatter(slug, lang, filePath);
  if (meta.draft) return null;
  const rewrittenContent = rewriteRelativeImagePaths(content, slug);
  const html = await md.renderAsync(rewrittenContent);
  return { ...meta, content: rewrittenContent, html };
}

export function getPostLanguages(slug: string): SiteLang[] {
  const dirPath = path.join(BLOG_DIR, slug);
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
}

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
md.use(asPluginSimple(linkPreview));
md.use(embedPlugin);
md.use(asPluginSimple(markdownItTocDoneRight));
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
