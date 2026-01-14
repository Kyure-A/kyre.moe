import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { createMarkdownExit } from "markdown-exit";
import hljs from "highlight.js";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import githubAlerts from "markdown-it-github-alerts";
import magicLink, { handlerGitHubAt, handlerLink } from "markdown-it-magic-link";
import { DEFAULT_LANG, isSiteLang, type SiteLang } from "./i18n";

export type BlogLang = SiteLang;

export type BlogPostMeta = {
	slug: string;
	lang: BlogLang;
	title: string;
	description: string;
	date: string;
	tags: string[];
	canonical?: string;
	cover?: string;
	draft?: boolean;
};

export type BlogPost = BlogPostMeta & {
	content: string;
	html: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const MARKDOWN_EXTENSIONS = [".md", ".mdx"];

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
md.use(taskLists, { label: true, labelAfter: true });
md.use(githubAlerts);
md.use(magicLink, { handlers: [handlerLink(), handlerGitHubAt()] });
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

export function isBlogLang(value: string): value is BlogLang {
	return isSiteLang(value);
}

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
		.replace(/\[[^\]]*\]\([^\)]*\)/g, " ")
		.replace(/[#>*_~\-]/g, " ")
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
	const canonical = typeof data.canonical === "string" ? data.canonical : undefined;
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

export function formatDate(date: string, lang: BlogLang) {
	if (!date) return "";
	try {
		return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
			year: "numeric",
			month: "short",
			day: "2-digit",
		}).format(new Date(date));
	} catch {
		return date;
	}
}
