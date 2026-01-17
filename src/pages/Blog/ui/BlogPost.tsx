import type { BlogPost } from "@/shared/lib/blog";
import { formatDate } from "@/shared/lib/blog";
import CopyCodeBlock from "@/shared/ui/CopyCodeBlock/CopyCodeBlock";
import TwitterEmbedEnhancer from "@/shared/ui/TwitterEmbed/TwitterEmbed";

type Props = {
	post: BlogPost;
};

export default function BlogPostView({ post }: Props) {
	const showCanonical = (() => {
		if (!post.canonical || post.canonical.startsWith("/")) return false;
		try {
			const url = new URL(post.canonical);
			return url.hostname !== "kyre.moe";
		} catch {
			return false;
		}
	})();

	return (
		<section className="w-full py-24 max-w-3xl mx-auto px-4 sm:px-6">
			<CopyCodeBlock />
			<TwitterEmbedEnhancer />
			<header className="mt-8">
				<p className="text-[11px] tracking-[0.08em] text-gray-500">
					{formatDate(post.date, post.lang)}
				</p>
				<h1
					className="mt-4 text-3xl font-semibold tracking-tight text-gray-100 md:text-4xl"
					style={{ viewTransitionName: `blog-title-${post.slug}` }}
				>
					{post.title}
				</h1>
				{post.description && (
					<p className="mt-4 text-sm leading-relaxed text-gray-400 md:text-base">
						{post.description}
					</p>
				)}
				{post.tags.length > 0 && (
					<div className="mt-4 flex flex-wrap gap-2 text-[11px] tracking-[0.08em] text-gray-500">
						{post.tags.map((tag) => (
							<span
								key={`${post.slug}-${tag}`}
								className="rounded-full border border-white/10 px-3 py-1"
							>
								#{tag}
							</span>
						))}
					</div>
				)}
				{post.cover && (
					<div className="mt-8 overflow-hidden rounded-2xl">
						<img
							src={post.cover}
							alt=""
							className="h-auto w-full object-cover"
							loading="lazy"
						/>
					</div>
				)}
			</header>

			<article
				className="blog-content mt-10"
				dangerouslySetInnerHTML={{ __html: post.html }}
			/>

			{showCanonical && (
				<div className="mt-8 text-xs tracking-[0.08em] text-gray-500">
					Original:&nbsp;
					<a
						href={post.canonical}
						className="text-gray-300 underline decoration-white/30 underline-offset-4"
						target="_blank"
						rel="noreferrer"
					>
						{post.canonical}
					</a>
				</div>
			)}
		</section>
	);
}
