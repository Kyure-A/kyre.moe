import type { Metadata } from "next";
import BlogIndex from "@/pages/Blog/ui/BlogIndex";
import { DEFAULT_BLOG_LANG, getAllPosts } from "@/shared/lib/blog";

export const metadata: Metadata = {
	title: "Blog",
	description: "Kyure_A's blog index.",
	alternates: {
		canonical: `/blog/${DEFAULT_BLOG_LANG}`,
		languages: {
			ja: "/blog/ja",
			en: "/blog/en",
		},
	},
};

export default function BlogLandingPage() {
	const posts = getAllPosts(DEFAULT_BLOG_LANG);
	return <BlogIndex lang={DEFAULT_BLOG_LANG} posts={posts} />;
}
