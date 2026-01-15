import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogIndex from "@/pages/Blog/ui/BlogIndex";
import { type BlogLang, isBlogLang } from "@/shared/lib/blog";
import { getAllPosts } from "@/shared/lib/blog.server";
import { SITE_LANGS } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
	params: Promise<Params>;
};

const META_BY_LANG: Record<BlogLang, { title: string; description: string }> = {
	ja: {
		title: "ブログ",
		description: "Kyure_A のブログ一覧。",
	},
	en: {
		title: "Blog",
		description: "Kyure_A's blog index.",
	},
};

export function generateStaticParams() {
	return SITE_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	if (!isBlogLang(lang)) return {};
	const meta = META_BY_LANG[lang];
	return {
		title: meta.title,
		description: meta.description,
		alternates: {
			canonical: `/${lang}/blog`,
			languages: {
				ja: "/ja/blog",
				en: "/en/blog",
			},
		},
		openGraph: {
			title: meta.title,
			description: meta.description,
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
			},
		},
	};
}

export default async function BlogIndexPage({ params }: Props) {
	const { lang } = await params;
	if (!isBlogLang(lang)) notFound();
	const posts = getAllPosts(lang);
	return <BlogIndex lang={lang} posts={posts} />;
}
