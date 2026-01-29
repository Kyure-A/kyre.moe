import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogTagIndex from "@/pages/Blog/ui/BlogTagIndex";
import { buildTagPath } from "@/shared/lib/blog";
import { getAllTags, getPostsByTag } from "@/shared/lib/blog.server";
import { isSiteLang, SITE_LANGS, type SiteLang } from "@/shared/lib/i18n";

type Params = { lang: string; tag: string };

type Props = {
	params: Promise<Params>;
};

const META_COPY: Record<
	SiteLang,
	{ title: (tag: string) => string; description: (tag: string) => string }
> = {
	ja: {
		title: (tag) => `#${tag} の記事`,
		description: (tag) => `タグ「${tag}」の記事一覧。`,
	},
	en: {
		title: (tag) => `#${tag} posts`,
		description: (tag) => `Posts tagged #${tag}.`,
	},
};

function decodeTag(value: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export function generateStaticParams() {
	return SITE_LANGS.flatMap((lang) =>
		getAllTags(lang).map((tag) => ({ lang, tag })),
	);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang, tag } = await params;
	if (!isSiteLang(lang)) return {};
	const decodedTag = decodeTag(tag);
	const posts = getPostsByTag(decodedTag, lang);
	if (posts.length === 0) return {};

	const meta = META_COPY[lang];
	const title = meta.title(decodedTag);
	const description = meta.description(decodedTag);
	const languages: Record<string, string> = {};

	for (const siteLang of SITE_LANGS) {
		if (getPostsByTag(decodedTag, siteLang).length > 0) {
			languages[siteLang] = buildTagPath(decodedTag, siteLang);
		}
	}

	return {
		title,
		description,
		alternates: {
			canonical: buildTagPath(decodedTag, lang),
			languages,
		},
		openGraph: {
			title,
			description,
		},
	};
}

export default async function BlogTagPage({ params }: Props) {
	const { lang, tag } = await params;
	if (!isSiteLang(lang)) notFound();
	const decodedTag = decodeTag(tag);
	const posts = getPostsByTag(decodedTag, lang);
	if (posts.length === 0) notFound();
	return <BlogTagIndex lang={lang} tag={decodedTag} posts={posts} />;
}
