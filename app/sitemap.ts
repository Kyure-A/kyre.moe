import type { MetadataRoute } from "next";
import { buildTagPath } from "@/shared/lib/blog";
import { getAllPosts, getAllTags } from "@/shared/lib/blog.server";
import { SITE_LANGS } from "@/shared/lib/i18n";

export const dynamic = "force-static";

const BASE_URL = "https://kyre.moe";

export default function sitemap(): MetadataRoute.Sitemap {
	const staticRoutes = SITE_LANGS.flatMap((lang) =>
		["", "/about", "/accounts", "/history", "/blog", "/blog/tag"].map(
			(path) => ({
				url: `${BASE_URL}/${lang}${path}`,
				lastModified: new Date(),
			}),
		),
	);

	const posts = getAllPosts().map((post) => ({
		url: `${BASE_URL}/${post.lang}/blog/${post.slug}`,
		lastModified: post.date ? new Date(post.date) : new Date(),
	}));

	const tags = SITE_LANGS.flatMap((lang) =>
		getAllTags(lang).map((tag) => ({
			url: `${BASE_URL}${buildTagPath(tag, lang)}`,
			lastModified: new Date(),
		})),
	);

	return [...staticRoutes, ...posts, ...tags];
}
