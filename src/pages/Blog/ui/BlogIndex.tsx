import { Link } from "next-view-transitions";
import type { CSSProperties } from "react";
import type { BlogPostMeta } from "@/shared/lib/blog";
import { formatDate } from "@/shared/lib/blog";
import type { SiteLang } from "@/shared/lib/i18n";

const COPY: Record<SiteLang, { empty: string }> = {
	ja: {
		empty: "まだ記事がありません。",
	},
	en: {
		empty: "No posts yet.",
	},
};

type Props = {
	lang: SiteLang;
	posts: BlogPostMeta[];
};

export default function BlogIndex({ lang, posts }: Props) {
	const copy = COPY[lang];
	const accentStyle = {
		"--accent": "#F92672",
	} as CSSProperties;

	return (
		<section className="w-full py-24 max-w-4xl mx-auto px-4 sm:px-6">
			<ul className="list-none space-y-2">
				{posts.length === 0 ? (
					<li className="px-2 py-3 text-sm text-gray-500">{copy.empty}</li>
				) : (
					posts.map((post) => (
						<li key={`${post.slug}-${post.lang}`}>
							<Link
								href={`/${post.lang}/blog/${post.slug}`}
								className="group block w-full px-2"
								style={accentStyle}
							>
								<div className="flex flex-col gap-2 px-0 py-3 text-gray-100 transition-[padding,background-color,border-radius,color] duration-[400ms] ease-out group-hover:px-4 group-hover:rounded-[10px] group-hover:bg-[var(--accent)] group-hover:text-white">
									<div className="flex flex-wrap items-center gap-3 text-[11px] tracking-[0.08em] text-gray-400 transition-colors duration-[400ms] ease-out group-hover:text-white/80">
										<span
											style={{ viewTransitionName: `blog-date-${post.slug}` }}
										>
											{formatDate(post.date, post.lang)}
										</span>
									</div>
									<h2
										className="text-lg font-semibold leading-snug text-gray-100 transition-colors duration-[400ms] ease-out group-hover:text-white md:text-xl"
										style={{ viewTransitionName: `blog-title-${post.slug}` }}
									>
										{post.title}
									</h2>
									{post.description && (
										<p
											className="text-sm leading-relaxed text-gray-400 transition-colors duration-[400ms] ease-out group-hover:text-white/85"
											style={{ viewTransitionName: `blog-desc-${post.slug}` }}
										>
											{post.description}
										</p>
									)}
									{post.tags.length > 0 && (
										<div
											className="flex flex-wrap gap-2 text-[11px] tracking-[0.08em] text-gray-500 transition-colors duration-[400ms] ease-out group-hover:text-white/85"
											style={{ viewTransitionName: `blog-tags-${post.slug}` }}
										>
											{post.tags.map((tag) => (
												<span
													key={`${post.slug}-${tag}`}
													className="rounded-full border border-white/10 px-3 py-1 transition-colors duration-[400ms] ease-out group-hover:border-white/40"
												>
													#{tag}
												</span>
											))}
										</div>
									)}
								</div>
							</Link>
						</li>
					))
				)}
			</ul>
		</section>
	);
}
