import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogTagList from "@/pages/Blog/ui/BlogTagList";
import { getAllPosts } from "@/shared/lib/blog.server";
import { isSiteLang, SITE_LANGS, type SiteLang } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
	params: Promise<Params>;
};

const META_BY_LANG: Record<SiteLang, { title: string; description: string }> = {
	ja: {
		title: "タグ一覧",
		description: "ブログのタグ一覧",
	},
	en: {
		title: "Tags",
		description: "All blog tags.",
	},
};

export function generateStaticParams() {
	return SITE_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	if (!isSiteLang(lang)) return {};
	const meta = META_BY_LANG[lang];
	return {
		title: meta.title,
		description: meta.description,
		alternates: {
			canonical: `/${lang}/blog/tag`,
			languages: {
				ja: "/ja/blog/tag",
				en: "/en/blog/tag",
			},
		},
		openGraph: {
			title: meta.title,
			description: meta.description,
		},
	};
}

function buildTagItems(posts: ReturnType<typeof getAllPosts>) {
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.tags) {
			if (!tag) continue;
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}
	return Array.from(counts.entries())
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => a.tag.localeCompare(b.tag));
}

export default async function BlogTagListPage({ params }: Props) {
	const { lang } = await params;
	if (!isSiteLang(lang)) notFound();
	const posts = getAllPosts(lang);
	const tags = buildTagItems(posts);
	return <BlogTagList lang={lang} tags={tags} />;
}
