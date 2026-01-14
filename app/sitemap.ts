import type { MetadataRoute } from "next";
import { BLOG_LANGS, getAllPosts } from "@/shared/lib/blog";

const BASE_URL = "https://kyre.moe";

export default function sitemap(): MetadataRoute.Sitemap {
	const staticRoutes = ["", "/about", "/accounts", "/history", "/blog"].map(
		(path) => ({
			url: `${BASE_URL}${path}`,
			lastModified: new Date(),
		}),
	);

	const blogIndexes = BLOG_LANGS.map((lang) => ({
		url: `${BASE_URL}/blog/${lang}`,
		lastModified: new Date(),
	}));

	const posts = getAllPosts().map((post) => ({
		url: `${BASE_URL}/blog/${post.lang}/${post.slug}`,
		lastModified: post.date ? new Date(post.date) : new Date(),
	}));

	return [...staticRoutes, ...blogIndexes, ...posts];
}
