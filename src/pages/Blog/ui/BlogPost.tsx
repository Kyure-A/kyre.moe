import Image from "next/image";
import { Link } from "next-view-transitions";
import type { BlogPost } from "@/shared/lib/blog";
import { buildTagPath, formatDate } from "@/shared/lib/blog";
import CopyCodeBlock from "@/shared/ui/CopyCodeBlock/CopyCodeBlock";
import TwitterEmbedEnhancer from "@/shared/ui/TwitterEmbed/TwitterEmbed";
import YouTubeEmbedEnhancer from "@/shared/ui/YouTubeEmbed/YouTubeEmbed";

type Props = {
  post: BlogPost;
};

const BlogPostView = ({ post }: Props) => {
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
      <YouTubeEmbedEnhancer />
      <header className="mt-8">
        <p
          className="text-[11px] tracking-[0.08em] text-[var(--text-tertiary)]"
          style={{ viewTransitionName: `blog-date-${post.slug}` }}
        >
          {formatDate(post.date, post.lang)}
        </p>
        <h1
          className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl"
          style={{ viewTransitionName: `blog-title-${post.slug}` }}
        >
          {post.title}
        </h1>
        {post.description && (
          <p
            className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] md:text-base"
            style={{ viewTransitionName: `blog-desc-${post.slug}` }}
          >
            {post.description}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] tracking-[0.08em] text-[var(--text-tertiary)]">
            {post.tags.map((tag) => (
              <Link
                key={`${post.slug}-${tag}`}
                href={buildTagPath(tag, post.lang)}
                className="rounded-full border border-[var(--border-subtle)] px-3 py-1 transition-colors duration-[400ms] ease-out hover:border-[var(--border-subtle-strong)] hover:text-[var(--text-primary)]"
                style={{ viewTransitionName: `blog-tag-${post.slug}-${tag}` }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        {post.cover && (
          <div className="mt-8 overflow-hidden rounded-2xl">
            <Image
              src={post.cover}
              alt={post.title}
              width={1600}
              height={900}
              sizes="(min-width: 768px) 768px, 100vw"
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </header>

      <article
        className="blog-content mt-10"
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is generated server-side with raw HTML disabled */
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      {showCanonical && (
        <div className="mt-8 text-xs tracking-[0.08em] text-[var(--text-tertiary)]">
          Original:&nbsp;
          <a
            href={post.canonical}
            className="text-[var(--text-secondary)] underline decoration-[var(--border-subtle-strong)] underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            {post.canonical}
          </a>
        </div>
      )}
    </section>
  );
};

export default BlogPostView;
