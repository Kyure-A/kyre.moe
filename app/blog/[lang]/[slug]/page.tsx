import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostView from "@/pages/Blog/ui/BlogPost";
import {
	BLOG_LANGS,
	getAllPosts,
	getPost,
	getPostLanguages,
	isBlogLang,
} from "@/shared/lib/blog";

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
	if (!isBlogLang(lang)) return {};
	const post = getPost(slug, lang);
	if (!post) return {};
	const availableLangs = getPostLanguages(post.slug);
	const alternates: Record<string, string> = {};
	for (const lang of BLOG_LANGS) {
		if (availableLangs.includes(lang)) {
			alternates[lang] = `/blog/${lang}/${post.slug}`;
		}
	}
	const canonical = post.canonical ?? `/blog/${post.lang}/${post.slug}`;
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
			url: `/blog/${post.lang}/${post.slug}`,
		},
		twitter: {
			card: post.cover ? "summary_large_image" : "summary",
			images,
		},
	};
}

export default async function BlogPostPage({ params }: Props) {
	const { lang, slug } = await params;
	if (!isBlogLang(lang)) notFound();
	const post = getPost(slug, lang);
	if (!post) notFound();
	return <BlogPostView post={post} />;
}
