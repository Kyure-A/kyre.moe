import { isSiteLang, type SiteLang } from "./i18n";

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

export function isBlogLang(value: string): value is BlogLang {
	return isSiteLang(value);
}

export function formatDate(date: string, lang: BlogLang) {
	if (!date) return "";
	try {
		return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date(date));
	} catch {
		return date;
	}
}
