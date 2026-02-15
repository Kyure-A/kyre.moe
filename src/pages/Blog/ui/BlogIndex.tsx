import { Link } from "next-view-transitions";
import BlogPostList from "@/pages/Blog/ui/BlogPostList";
import BlogSection from "@/pages/Blog/ui/BlogSection";
import type { BlogPostMeta } from "@/shared/lib/blog";
import type { SiteLang } from "@/shared/lib/i18n";

const COPY: Record<SiteLang, { empty: string; tags: string; title: string }> = {
  ja: {
    empty: "まだ記事がありません。",
    tags: "タグ一覧",
    title: "ブログ",
  },
  en: {
    empty: "No posts yet.",
    tags: "Tags",
    title: "Blog",
  },
};

type Props = {
  lang: SiteLang;
  posts: BlogPostMeta[];
};

const BlogIndex = ({ lang, posts }: Props) => {
  const copy = COPY[lang];

  return (
    <BlogSection>
      <h1 className="sr-only">{copy.title}</h1>
      <BlogPostList posts={posts} emptyLabel={copy.empty} />
      <div className="mt-8 flex items-center justify-end text-[11px] tracking-[0.08em] text-[var(--text-tertiary)]">
        <Link
          href={`/${lang}/blog/tag`}
          className="inline-flex items-center gap-2 transition-colors duration-[300ms] ease-out hover:text-[var(--text-primary)]"
        >
          {copy.tags} →
        </Link>
      </div>
    </BlogSection>
  );
};

export default BlogIndex;
