import { Link } from "next-view-transitions";
import BlogPostList from "@/pages/Blog/ui/BlogPostList";
import type { BlogPostMeta } from "@/shared/lib/blog";
import type { SiteLang } from "@/shared/lib/i18n";

type Props = {
	lang: SiteLang;
	tag: string;
	posts: BlogPostMeta[];
};

const COPY: Record<
	SiteLang,
	{
		label: string;
		back: string;
		empty: string;
		count: (count: number) => string;
	}
> = {
	ja: {
		label: "タグ",
		back: "タグ一覧へ",
		empty: "該当する記事がありません。",
		count: (count) => `記事 ${count} 件`,
	},
	en: {
		label: "Tag",
		back: "Back to tags",
		empty: "No posts for this tag.",
		count: (count) => `${count} post${count === 1 ? "" : "s"}`,
	},
};

export default function BlogTagIndex({ lang, tag, posts }: Props) {
	const copy = COPY[lang];

	return (
		<section className="w-full py-24 max-w-4xl mx-auto px-4 sm:px-6">
			<header className="mb-10">
				<p className="text-[11px] tracking-[0.08em] text-gray-500">
					{copy.label}
				</p>
				<h1 className="mt-3 text-2xl font-semibold text-gray-100 md:text-3xl">
					#{tag}
				</h1>
				<p className="mt-2 text-sm text-gray-400">{copy.count(posts.length)}</p>
				<Link
					href={`/${lang}/blog/tag`}
					className="mt-5 inline-flex items-center gap-2 text-[11px] tracking-[0.08em] text-gray-500 transition-colors duration-[300ms] ease-out hover:text-gray-200"
				>
					← {copy.back}
				</Link>
			</header>
			<BlogPostList posts={posts} emptyLabel={copy.empty} />
		</section>
	);
}
