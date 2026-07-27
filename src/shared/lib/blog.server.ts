import "server-only";
import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";
import hljs from "highlight.js";
import katex from "katex";
import sanitizeHtml from "sanitize-html";
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

const CSS_EM_VALUE_RE = /^-?(?:0|\d+(?:\.\d+)?)em$/;
const CSS_ZERO_RE = /^0$/;
const CSS_COLOR_RE = /^(?:#[\da-f]{3,8}|[a-z]+)$/i;
const CSS_BACKGROUND_IMAGE_URL_RE =
  /^url\((?:"https?:\/\/[^"()\\\s]+"|'https?:\/\/[^'()\\\s]+'|https?:\/\/[^"'()\\\s]+)\)$/i;
const BLOG_HTML_ALLOWED_TAGS = [
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "caption",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "details",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "input",
  "kbd",
  "label",
  "li",
  "mark",
  "nav",
  "ol",
  "p",
  "pre",
  "s",
  "small",
  "span",
  "strong",
  "section",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
  "path",
  "svg",
  "annotation",
  "math",
  "menclose",
  "mfrac",
  "mi",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mroot",
  "mrow",
  "mspace",
  "msqrt",
  "mstyle",
  "msub",
  "msubsup",
  "msup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "semantics",
];
const BLOG_HTML_SANITIZE_OPTIONS = {
  allowedTags: BLOG_HTML_ALLOWED_TAGS,
  allowedAttributes: {
    "*": ["aria-hidden", "aria-label", "class", "id", "title"],
    a: [
      "aria-label",
      "class",
      "data-youtube-video-id",
      "href",
      "name",
      "rel",
      "style",
      {
        name: "target",
        values: ["_blank"],
      },
    ],
    annotation: ["encoding"],
    blockquote: ["class", "data-dnt", "data-theme", "data-width"],
    code: ["class"],
    img: [
      "alt",
      "class",
      "decoding",
      "height",
      "loading",
      "src",
      "title",
      "width",
    ],
    input: [
      "checked",
      "class",
      "disabled",
      {
        name: "type",
        values: ["checkbox"],
      },
    ],
    path: ["d"],
    math: ["display", "xmlns"],
    mo: ["fence", "lspace", "rspace", "separator", "stretchy"],
    mpadded: ["depth", "height", "lspace", "voffset", "width"],
    mspace: ["depth", "height", "width"],
    mstyle: ["displaystyle", "scriptlevel"],
    ol: ["start", "type"],
    span: ["aria-hidden", "class", "style"],
    svg: [
      "aria-hidden",
      "class",
      "height",
      "preserveAspectRatio",
      "preserveaspectratio",
      "style",
      "viewBox",
      "viewbox",
      "width",
      "xmlns",
    ],
    td: ["align", "colspan", "rowspan"],
    th: ["align", "colspan", "rowspan"],
  },
  allowedClasses: {
    "*": [/^[A-Za-z0-9_-]+$/],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src", "cite"],
  allowProtocolRelative: false,
  allowedStyles: {
    a: {
      "background-image": [CSS_BACKGROUND_IMAGE_URL_RE],
    },
    span: {
      "background-image": [CSS_BACKGROUND_IMAGE_URL_RE],
      "border-bottom-width": [CSS_EM_VALUE_RE, CSS_ZERO_RE],
      color: [CSS_COLOR_RE],
      height: [CSS_EM_VALUE_RE, CSS_ZERO_RE],
      "margin-left": [CSS_EM_VALUE_RE, CSS_ZERO_RE],
      "margin-right": [CSS_EM_VALUE_RE, CSS_ZERO_RE],
      "min-width": [CSS_EM_VALUE_RE, CSS_ZERO_RE],
      left: [CSS_EM_VALUE_RE, CSS_ZERO_RE],
      "padding-left": [CSS_EM_VALUE_RE, CSS_ZERO_RE],
      position: [/^relative$/],
      top: [CSS_EM_VALUE_RE, CSS_ZERO_RE],
      "vertical-align": [CSS_EM_VALUE_RE, CSS_ZERO_RE],
      width: [CSS_EM_VALUE_RE, CSS_ZERO_RE],
    },
    svg: {
      width: [CSS_EM_VALUE_RE, CSS_ZERO_RE],
    },
  },
  transformTags: {
    input: (_tagName: string, attribs: sanitizeHtml.Attributes) => ({
      tagName: "input",
      attribs: {
        ...attribs,
        disabled: "disabled",
        type: "checkbox",
      },
    }),
  },
} satisfies NonNullable<Parameters<typeof sanitizeHtml>[1]>;

const replaceUnsafeChar = (ch: string) => HTML_REPLACEMENTS[ch] ?? ch;

const escapeHtml = (str: string) =>
  str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);

const sanitizeBlogHtml = (html: string) =>
  sanitizeHtml(html, BLOG_HTML_SANITIZE_OPTIONS);

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
  const token = `${HTML_PLACEHOLDER_PREFIX}${placeholders.length}END`;
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

const replaceUnderlines = (line: string, placeholders: HtmlPlaceholder[]) => {
  let result = "";
  let cursor = 0;
  let inlineCodeTicks = 0;

  while (cursor < line.length) {
    if (line[cursor] === "`") {
      const run = line.slice(cursor).match(/^`+/)?.[0] ?? "`";
      inlineCodeTicks = inlineCodeTicks === run.length ? 0 : run.length;
      result += run;
      cursor += run.length;
      continue;
    }

    if (
      inlineCodeTicks === 0 &&
      line[cursor] === "_" &&
      line[cursor + 1] === "_"
    ) {
      const end = line.indexOf("__", cursor + 2);
      if (end > cursor + 2) {
        result += addHtmlPlaceholder(
          placeholders,
          `<u>${escapeHtml(line.slice(cursor + 2, end))}</u>`,
          false,
        );
        cursor = end + 2;
        continue;
      }
    }

    result += line[cursor];
    cursor += 1;
  }

  return result;
};

const replaceInlineAutolinks = (line: string) =>
  line.replace(/<((?:https?:\/\/)[^>\s]+)>/g, "[$1]($1)");

type FootnoteDefinition = {
  id: string;
  number: number;
  content: string;
  referenceIds: string[];
};

const extractFootnoteDefinitions = (lines: string[]) => {
  const markdownLines: string[] = [];
  const definitions: FootnoteDefinition[] = [];
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const fence = lines[index].match(/^[ \t]*(`{3,}|~{3,})/);
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
      markdownLines.push(lines[index]);
      continue;
    }
    if (inFence) {
      markdownLines.push(lines[index]);
      continue;
    }

    const definition = lines[index].match(/^\[\^([^\]\s]+)\]:[ \t]*(.*)$/);
    if (!definition) {
      markdownLines.push(lines[index]);
      continue;
    }

    const content = [definition[2]];
    let end = index + 1;
    while (end < lines.length) {
      const continuation = lines[end].match(/^(?: {2,}|\t)(.*)$/);
      if (continuation) {
        content.push(continuation[1]);
        end += 1;
        continue;
      }
      if (
        lines[end].trim() === "" &&
        end + 1 < lines.length &&
        /^(?: {2,}|\t)/.test(lines[end + 1])
      ) {
        content.push("");
        end += 1;
        continue;
      }
      break;
    }

    definitions.push({
      id: definition[1],
      number: definitions.length + 1,
      content: content.join("\n"),
      referenceIds: [],
    });
    index = end - 1;
  }

  return { definitions, markdownLines };
};

const replaceFootnoteReferences = (
  line: string,
  definitions: Map<string, FootnoteDefinition>,
  placeholders: HtmlPlaceholder[],
  referenceLabel: string,
) =>
  line.replace(
    /(^|[^\\])\[\^([^\]\s]+)\]/g,
    (match, prefix: string, id: string) => {
      const definition = definitions.get(id);
      if (!definition) return match;

      const referenceNumber = definition.referenceIds.length + 1;
      const referenceId = `fnref-${definition.number}${
        referenceNumber > 1 ? `-${referenceNumber}` : ""
      }`;
      definition.referenceIds.push(referenceId);

      return `${prefix}${addHtmlPlaceholder(
        placeholders,
        `<sup class="footnote-ref"><a href="#fn-${definition.number}" id="${referenceId}" aria-label="${referenceLabel} ${definition.number}">${definition.number}</a></sup>`,
        false,
      )}`;
    },
  );

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

type TableOfContentsItem = {
  level: number;
  id: string;
  label: string;
  children: TableOfContentsItem[];
};

const TABLE_OF_CONTENTS_LABELS: Record<SiteLang, string> = {
  ja: "目次",
  en: "Table of contents",
};

const collectTableOfContentsItems = (html: string) => {
  const roots: TableOfContentsItem[] = [];
  const stack: TableOfContentsItem[] = [];
  const headings = html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi);

  for (const heading of headings) {
    const id = getHtmlAttribute(heading[2], "id");
    const label = decodeHtmlEntities(
      sanitizeHtml(heading[3], {
        allowedTags: [],
        allowedAttributes: {},
      }),
    )
      .replace(/\s+/g, " ")
      .trim();
    if (!id || !label) continue;

    const item: TableOfContentsItem = {
      level: Number(heading[1]),
      id,
      label,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(item);
    } else {
      roots.push(item);
    }
    stack.push(item);
  }

  return roots;
};

const renderTableOfContentsItems = (items: TableOfContentsItem[]): string => {
  const entries = items
    .map((item) => {
      const children =
        item.children.length > 0
          ? renderTableOfContentsItems(item.children)
          : "";
      return `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>${children}</li>`;
    })
    .join("");
  return `<ol>${entries}</ol>`;
};

const renderTableOfContents = (html: string, lang: SiteLang) => {
  const marker = /<p>\s*\[toc\]\s*<\/p>/gi;
  if (!/<p>\s*\[toc\]\s*<\/p>/i.test(html)) return html;

  const items = collectTableOfContentsItems(html);
  const tableOfContents =
    items.length > 0
      ? `<nav class="blog-toc" aria-label="${TABLE_OF_CONTENTS_LABELS[lang]}"><p class="blog-toc-title">${TABLE_OF_CONTENTS_LABELS[lang]}</p>${renderTableOfContentsItems(items)}</nav>`
      : "";
  return html.replace(marker, tableOfContents);
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

const MARKDOWN_ALERT_ICONS: Record<string, string> = {
  note: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-3.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM6.75 8a.75.75 0 0 0 0 1.5h.5v2h-.5a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-.5V8Z"></path></svg>',
  tip: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0a5.5 5.5 0 0 0-3.6 9.66c.38.33.6.8.6 1.3V12a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1.04c0-.5.22-.97.6-1.3A5.5 5.5 0 0 0 8 0Zm1.5 14.5h-3a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5Z"></path></svg>',
  important:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7.2.6a1 1 0 0 1 1.6 0l1.86 2.48 3.1.93a1 1 0 0 1 .5 1.54l-1.87 2.51.08 3.23a1 1 0 0 1-1.31.95L8 11.32l-3.16.92a1 1 0 0 1-1.31-.95l.08-3.23-1.87-2.51a1 1 0 0 1 .5-1.54l3.1-.93L7.2.6Z"></path></svg>',
  warning:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.46 1.22a1.75 1.75 0 0 1 3.08 0l6.21 11.52A1.75 1.75 0 0 1 14.21 15H1.79a1.75 1.75 0 0 1-1.54-2.26L6.46 1.22ZM8 5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5Zm0 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>',
  caution:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.22.22A.75.75 0 0 1 5.75 0h4.5c.2 0 .39.08.53.22l3 3c.14.14.22.33.22.53v4.5c0 .2-.08.39-.22.53l-3 3a.75.75 0 0 1-.53.22h-4.5a.75.75 0 0 1-.53-.22l-3-3A.75.75 0 0 1 2 8.25v-4.5c0-.2.08-.39.22-.53l3-3ZM8 3.5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 3.5Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>',
};

const normalizeOxHtml = (html: string) =>
  html
    .replace(
      /<blockquote class="ox-callout ox-callout--([a-z]+)">\s*<p class="ox-callout-title">([\s\S]*?)<\/p>/g,
      (_match, kind: string, title: string) =>
        `<blockquote class="markdown-alert markdown-alert-${kind}"><p class="markdown-alert-title">${MARKDOWN_ALERT_ICONS[kind] ?? ""}${title}</p>`,
    )
    .replace(
      /<li>\s*(<input\b(?=[^>]*\btype="checkbox")[^>]*>)\s*<p>([\s\S]*?)<\/p>/g,
      '<li class="task-list-item"><label>$1 $2</label>',
    )
    .replace(
      /<li>\s*(<input\b(?=[^>]*\btype="checkbox")[^>]*>)\s*((?:(?!<(?:ul|ol)\b)[\s\S])*?)(?=<(?:ul|ol)\b|<\/li>)/g,
      '<li class="task-list-item"><label>$1 $2</label>',
    );

const preprocessMarkdown = async (source: string, lang: SiteLang) => {
  const placeholders: HtmlPlaceholder[] = [];
  const { definitions: footnotes, markdownLines: lines } =
    extractFootnoteDefinitions(source.split(/\r?\n/));
  const footnotesById = new Map(
    footnotes.map((definition) => [definition.id, definition]),
  );
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
    const withUnderlines = replaceUnderlines(withMagicLinks, placeholders);
    const withFootnotes = replaceFootnoteReferences(
      withUnderlines,
      footnotesById,
      placeholders,
      FOOTNOTE_LABELS[lang].reference,
    );
    output.push(decodeSafeNumericEntities(escapeRawHtmlLine(withFootnotes)));
  }

  return {
    footnotes,
    markdown: output.join("\n"),
    placeholders,
  };
};

const TYPOGRAPHER_PROTECTED_TAGS = new Set(["code", "math", "pre"]);
const TYPOGRAPHER_VOID_TAGS = new Set(["br", "hr", "img", "input"]);

const applyTypographicReplacements = (text: string) =>
  text
    .replace(/\((c)\)/gi, "©")
    .replace(/\((r)\)/gi, "®")
    .replace(/\((tm)\)/gi, "™")
    .replace(/\((p)\)/gi, "§")
    .replace(/\+-/g, "±")
    .replace(/\.{2,}/g, "…")
    .replace(/([?!]){4,}/g, "$1$1$1")
    .replace(/,{2,}/g, ",")
    .replace(/(^|[^-])---(?=[^-]|$)/g, "$1—")
    .replace(/(^|\s)--(?=\s|$)/g, "$1–")
    .replace(/(^|[\s([{])"([^"\n]+)"(?=$|[\s.,!?;:)\]}])/g, "$1“$2”")
    .replace(/(^|[\s([{])'([^'\n]+)'(?=$|[\s.,!?;:)\]}])/g, "$1‘$2’");

const applyTypographer = (html: string) => {
  const stack: boolean[] = [];
  let protectedDepth = 0;

  return html
    .split(/(<[^>]+>)/g)
    .map((token) => {
      if (!token.startsWith("<")) {
        return protectedDepth > 0 ? token : applyTypographicReplacements(token);
      }

      const closing = token.match(/^<\/([a-z0-9-]+)\s*>/i);
      if (closing) {
        const wasProtected = stack.pop() ?? false;
        if (wasProtected) protectedDepth -= 1;
        return token;
      }

      const opening = token.match(/^<([a-z0-9-]+)\b/i);
      if (!opening) return token;

      const tag = opening[1].toLowerCase();
      const isVoid = TYPOGRAPHER_VOID_TAGS.has(tag) || /\/>\s*$/.test(token);
      if (isVoid) return token;

      const isProtected =
        protectedDepth > 0 ||
        TYPOGRAPHER_PROTECTED_TAGS.has(tag) ||
        /\bclass=(?:"[^"]*\bkatex\b[^"]*"|'[^']*\bkatex\b[^']*')/i.test(token);
      stack.push(isProtected);
      if (isProtected) protectedDepth += 1;
      return token;
    })
    .join("");
};

const FOOTNOTE_LABELS: Record<
  SiteLang,
  { section: string; reference: string; backreference: string }
> = {
  ja: {
    section: "脚注",
    reference: "脚注",
    backreference: "本文に戻る",
  },
  en: {
    section: "Footnotes",
    reference: "Footnote",
    backreference: "Back to content",
  },
};

const renderFootnotes = async (
  definitions: FootnoteDefinition[],
  parseAndRender: OxContentModule["parseAndRender"],
  lang: SiteLang,
) => {
  const referenced = definitions.filter(
    (definition) => definition.referenceIds.length > 0,
  );
  if (referenced.length === 0) return "";

  const items = await Promise.all(
    referenced.map(async (definition) => {
      const {
        footnotes: _nestedFootnotes,
        markdown,
        placeholders,
      } = await preprocessMarkdown(definition.content, lang);
      const result = parseAndRender(markdown, OX_MARKDOWN_OPTIONS);
      if (result.errors.length > 0) {
        throw new Error(
          `Ox Content failed to render a footnote: ${result.errors.join("\n")}`,
        );
      }

      const backlinks = definition.referenceIds
        .map(
          (referenceId, index) =>
            `<a class="footnote-backref" href="#${referenceId}" aria-label="${FOOTNOTE_LABELS[lang].backreference}${
              definition.referenceIds.length > 1 ? ` ${index + 1}` : ""
            }">↩</a>`,
        )
        .join(" ");
      const renderedBody = normalizeOxHtml(
        highlightCodeBlocks(restoreHtmlPlaceholders(result.html, placeholders)),
      ).trim();
      const body = /<\/p>$/.test(renderedBody)
        ? renderedBody.replace(/<\/p>$/, ` ${backlinks}</p>`)
        : `${renderedBody}<p>${backlinks}</p>`;

      return `<li id="fn-${definition.number}">${body}</li>`;
    }),
  );

  return `<hr class="footnotes-sep"><section class="footnotes" aria-label="${FOOTNOTE_LABELS[lang].section}"><ol class="footnotes-list">${items.join("")}</ol></section>`;
};

const renderMarkdown = async (source: string, lang: SiteLang) => {
  const { footnotes, markdown, placeholders } = await preprocessMarkdown(
    source,
    lang,
  );
  const { parseAndRender } = loadOxContent();
  const result = parseAndRender(markdown, OX_MARKDOWN_OPTIONS);
  if (result.errors.length > 0) {
    throw new Error(
      `Ox Content failed to render Markdown: ${result.errors.join("\n")}`,
    );
  }
  const renderedFootnotes = await renderFootnotes(
    footnotes,
    parseAndRender,
    lang,
  );
  return sanitizeBlogHtml(
    applyTypographer(
      `${normalizeOxHtml(
        highlightCodeBlocks(
          renderTableOfContents(
            restoreHtmlPlaceholders(result.html, placeholders),
            lang,
          ),
        ),
      )}${renderedFootnotes}`,
    ),
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
  const html = await renderMarkdown(rewrittenContent, lang);
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
