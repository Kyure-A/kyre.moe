import { Link } from "next-view-transitions";
import BlogPostList from "@/pages/Blog/ui/BlogPostList";
import BlogSection from "@/pages/Blog/ui/BlogSection";
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

const BlogTagIndex = ({ lang, tag, posts }: Props) => {
  const copy = COPY[lang];

  return (
    <BlogSection>
      <header className="mb-10">
        <p className="text-[11px] tracking-[0.08em] text-[var(--text-tertiary)]">
          {copy.label}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
          #{tag}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {copy.count(posts.length)}
        </p>
        <Link
          href={`/${lang}/blog/tag`}
          className="mt-5 inline-flex items-center gap-2 text-[11px] tracking-[0.08em] text-[var(--text-tertiary)] transition-colors duration-[300ms] ease-out hover:text-[var(--text-primary)]"
        >
          ← {copy.back}
        </Link>
      </header>
      <BlogPostList posts={posts} emptyLabel={copy.empty} />
    </BlogSection>
  );
};

export default BlogTagIndex;
