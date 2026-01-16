import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostView from "@/pages/Blog/ui/BlogPost";
import {
	getAllPosts,
	getPost,
	getPostLanguages,
} from "@/shared/lib/blog.server";
import { isSiteLang, SITE_LANGS } from "@/shared/lib/i18n";

type Params = { lang: string; slug: string };

type Props = {
	params: Promise<Params>;
};

export function generateStaticParams() {
	return getAllPosts().map((post) => ({
		lang: post.lang,
		slug: post.slug,
	}));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang, slug } = await params;
	if (!isSiteLang(lang)) return {};
	const post = getPost(slug, lang);
	if (!post) return {};
	const availableLangs = getPostLanguages(post.slug);
	const alternates: Record<string, string> = {};
	for (const lang of SITE_LANGS) {
		if (availableLangs.includes(lang)) {
			alternates[lang] = `/${lang}/blog/${post.slug}`;
		}
	}
	const canonical = post.canonical ?? `/${post.lang}/blog/${post.slug}`;
	const images = post.cover ? [post.cover] : undefined;

	return {
		title: post.title,
		description: post.description,
		alternates: {
			canonical,
			languages: alternates,
		},
		openGraph: {
			title: post.title,
			description: post.description,
			type: "article",
			publishedTime: post.date || undefined,
			images,
			url: `/${post.lang}/blog/${post.slug}`,
		},
		twitter: {
			card: post.cover ? "summary_large_image" : "summary",
			images,
		},
	};
}

export default async function BlogPostPage({ params }: Props) {
	const { lang, slug } = await params;
	if (!isSiteLang(lang)) notFound();
	const post = getPost(slug, lang);
	if (!post) notFound();
	return <BlogPostView post={post} />;
}
