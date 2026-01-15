import "server-only";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import hljs from "highlight.js";
import { createMarkdownExit } from "markdown-exit";
import footnote from "markdown-it-footnote";
import githubAlerts from "markdown-it-github-alerts";
import magicLink, {
	handlerGitHubAt,
	handlerLink,
} from "markdown-it-magic-link";
import taskLists from "markdown-it-task-lists";
import type { BlogLang, BlogPost, BlogPostMeta } from "./blog";
import { isBlogLang } from "./blog";
import { DEFAULT_LANG } from "./i18n";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const MARKDOWN_EXTENSIONS = [".md", ".mdx"];

const YOUTUBE_HOSTS = new Set([
	"youtube.com",
	"www.youtube.com",
	"m.youtube.com",
	"youtu.be",
	"www.youtu.be",
	"youtube-nocookie.com",
	"www.youtube-nocookie.com",
]);

const TWITTER_HOSTS = new Set([
	"twitter.com",
	"www.twitter.com",
	"x.com",
	"www.x.com",
	"mobile.twitter.com",
]);

type InlineChild = {
	type: string;
	content?: string;
	attrGet?: (name: string) => string | null;
	attrs?: [string, string][] | null;
};

type InlineTokenLike = {
	children?: InlineChild[];
};

function parseTimeParam(value: string | null): number | null {
	if (!value) return null;
	if (/^\d+$/.test(value)) return Number(value);
	let total = 0;
	let matched = false;
	for (const match of value.matchAll(/(\d+)(h|m|s)/g)) {
		matched = true;
		const amount = Number(match[1]);
		const unit = match[2];
		if (unit === "h") total += amount * 3600;
		if (unit === "m") total += amount * 60;
		if (unit === "s") total += amount;
	}
	return matched && total > 0 ? total : null;
}

function buildYouTubeEmbed(url: URL): string | null {
	if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
	const pathname = url.pathname.replace(/\/+$/, "");
	const parts = pathname.split("/").filter(Boolean);
	const list = url.searchParams.get("list");
	let id: string | null = null;
	let base = "";

	if (url.hostname.includes("youtu.be")) {
		id = parts[0] ?? null;
	} else if (parts[0] === "watch") {
		id = url.searchParams.get("v");
	} else if (["embed", "shorts", "live"].includes(parts[0] ?? "")) {
		id = parts[1] ?? null;
	} else if (parts[0] === "playlist") {
		if (list) {
			base = "https://www.youtube-nocookie.com/embed/videoseries";
		}
	}

	if (!base) {
		if (!id) return null;
		base = `https://www.youtube-nocookie.com/embed/${id}`;
	}

	const params = new URLSearchParams();
	params.set("rel", "0");
	params.set("modestbranding", "1");
	const start =
		parseTimeParam(url.searchParams.get("t")) ??
		parseTimeParam(url.searchParams.get("start"));
	if (start) params.set("start", String(start));
	if (list) params.set("list", list);

	const src = `${base}?${params.toString()}`;
	return [
		'<div class="markdown-embed markdown-embed-youtube">',
		'<div class="markdown-embed-inner">',
		`<iframe src="${src}" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`,
		"</div>",
		"</div>",
	].join("");
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
	return [
		'<div class="markdown-embed markdown-embed-twitter">',
		`<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><a href="${canonical}"></a></blockquote>`,
		"</div>",
	].join("");
}

function resolveEmbedHtml(href: string): string | null {
	if (!href.startsWith("http://") && !href.startsWith("https://")) return null;
	let url: URL;
	try {
		url = new URL(href);
	} catch {
		return null;
	}
	return buildYouTubeEmbed(url) ?? buildTwitterEmbed(url);
}

function extractSingleLink(inlineToken: InlineTokenLike): string | null {
	const children = inlineToken.children ?? [];
	const meaningful = children.filter((child) => {
		if (child.type !== "text") return true;
		return Boolean(child.content?.trim());
	});
	if (meaningful.length !== 3) return null;
	const [open, , close] = meaningful;
	if (open.type !== "link_open" || close.type !== "link_close") return null;
	const href =
		open.attrGet?.("href") ??
		open.attrs?.find((attr) => attr[0] === "href")?.[1];
	return href ?? null;
}

function embedMediaPlugin(md: any) {
	md.core.ruler.after("inline", "media-embed", (state: any) => {
		const tokens = state.tokens as { type: string; tag: string }[];
		for (let i = 0; i < tokens.length; i += 1) {
			const token = tokens[i];
			if (token.type !== "paragraph_open") continue;
			const inline = state.tokens[i + 1];
			const close = state.tokens[i + 2];
			if (!inline || !close) continue;
			if (inline.type !== "inline" || close.type !== "paragraph_close")
				continue;

			const href = extractSingleLink(inline);
			if (!href) continue;
			const html = resolveEmbedHtml(href);
			if (!html) continue;

			const embedToken = new state.Token("html_block", "", 0);
			embedToken.content = `${html}\n`;
			state.tokens.splice(i, 3, embedToken);
		}
	});
}

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

md.use(footnote);
md.use(taskLists, { label: true, labelAfter: false });
md.use(githubAlerts);
md.use(magicLink, { handlers: [handlerLink(), handlerGitHubAt()] });
md.use(embedMediaPlugin);
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

function resolveLangFromFile(fileName: string): BlogLang | null {
	const base = path.parse(fileName).name;
	if (isBlogLang(base)) return base;
	if (base === "index") return DEFAULT_LANG;
	return null;
}

function parseFrontmatter(
	slug: string,
	lang: BlogLang,
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
		? data.tags.map((tag) => String(tag)).filter(Boolean)
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

function getPostFilePath(slug: string, lang: BlogLang): string | null {
	const dirPath = path.join(BLOG_DIR, slug);
	const ext = MARKDOWN_EXTENSIONS.find((item) =>
		fs.existsSync(path.join(dirPath, `${lang}${item}`)),
	);
	return ext ? path.join(dirPath, `${lang}${ext}`) : null;
}

export function getAllPosts(lang?: BlogLang): BlogPostMeta[] {
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

export function getPost(slug: string, lang: BlogLang): BlogPost | null {
	const filePath = getPostFilePath(slug, lang);
	if (!filePath) return null;
	const { meta, content } = parseFrontmatter(slug, lang, filePath);
	if (meta.draft) return null;
	const html = md.render(content);
	return { ...meta, content, html };
}

export function getPostLanguages(slug: string): BlogLang[] {
	const dirPath = path.join(BLOG_DIR, slug);
	const files = safeReadDir(dirPath).filter((file) => file.isFile());
	const langs = new Set(
		files
			.map((file) => {
				const ext = path.extname(file.name);
				if (!MARKDOWN_EXTENSIONS.includes(ext)) return null;
				return resolveLangFromFile(file.name);
			})
			.filter((fileLang): fileLang is BlogLang => Boolean(fileLang)),
	);
	return Array.from(langs);
}
