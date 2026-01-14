import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogIndex from "@/pages/Blog/ui/BlogIndex";
import { BLOG_LANGS, getAllPosts, isBlogLang } from "@/shared/lib/blog";

type Params = { lang: string };

type Props = {
	params: Promise<Params>;
};

export function generateStaticParams() {
	return BLOG_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	if (!isBlogLang(lang)) return {};
	return {
		title: "Blog",
		description: "Kyure_A's blog index.",
		alternates: {
			canonical: `/blog/${lang}`,
			languages: {
				ja: "/blog/ja",
				en: "/blog/en",
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
