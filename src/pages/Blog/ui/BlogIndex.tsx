import { Link } from "next-view-transitions";
import BlogPostList from "@/pages/Blog/ui/BlogPostList";
import BlogSection from "@/pages/Blog/ui/BlogSection";
import type { BlogPostMeta } from "@/shared/lib/blog";
import type { SiteLang } from "@/shared/lib/i18n";

const COPY: Record<SiteLang, { empty: string; tags: string }> = {
  ja: {
    empty: "まだ記事がありません。",
    tags: "タグ一覧",
  },
  en: {
    empty: "No posts yet.",
    tags: "Tags",
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
      <BlogPostList posts={posts} emptyLabel={copy.empty} />
      <div className="mt-8 flex items-center justify-end text-[11px] tracking-[0.08em] text-gray-500">
        <Link
          href={`/${lang}/blog/tag`}
          className="inline-flex items-center gap-2 transition-colors duration-[300ms] ease-out hover:text-gray-200"
        >
          {copy.tags} →
        </Link>
      </div>
    </BlogSection>
  );
};

export default BlogIndex;
