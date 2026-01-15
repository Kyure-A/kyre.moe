import type { MetadataRoute } from "next";
import { getAllPosts } from "@/shared/lib/blog.server";
import { SITE_LANGS } from "@/shared/lib/i18n";

const BASE_URL = "https://kyre.moe";

export default function sitemap(): MetadataRoute.Sitemap {
	const staticRoutes = SITE_LANGS.flatMap((lang) =>
		["", "/about", "/accounts", "/history", "/blog"].map((path) => ({
			url: `${BASE_URL}/${lang}${path}`,
			lastModified: new Date(),
		})),
	);

	const posts = getAllPosts().map((post) => ({
		url: `${BASE_URL}/${post.lang}/blog/${post.slug}`,
		lastModified: post.date ? new Date(post.date) : new Date(),
	}));

	return [...staticRoutes, ...posts];
}
