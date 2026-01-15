import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogIndex from "@/pages/Blog/ui/BlogIndex";
import { getAllPosts, isBlogLang } from "@/shared/lib/blog";
import { SITE_LANGS } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
	params: Promise<Params>;
};

export function generateStaticParams() {
	return SITE_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	if (!isBlogLang(lang)) return {};
	return {
		title: "Blog",
		description: "Kyure_A's blog index.",
		alternates: {
			canonical: `/${lang}/blog`,
			languages: {
				ja: "/ja/blog",
				en: "/en/blog",
			},
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
