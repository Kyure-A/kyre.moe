import { Link } from "next-view-transitions";
import BlogPostList from "@/pages/Blog/ui/BlogPostList";
import BlogSection from "@/pages/Blog/ui/BlogSection";
import type { BlogPostMeta } from "@/shared/lib/blog";
import type { SiteLang } from "@/shared/lib/i18n";
import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

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

const styles = {
  title: visuallyHidden(),
  footer: css({
    mt: "8",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    fontSize: "2xs",
    letterSpacing: "label",
    color: "text.tertiary",
  }),
  tagLink: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    transitionProperty: "colors",
    transitionDuration: "slow",
    transitionTimingFunction: "easeOut",
    _hover: {
      color: "text.primary",
    },
  }),
};

const BlogIndex = ({ lang, posts }: Props) => {
  const copy = COPY[lang];

  return (
    <BlogSection>
      <h1 className={styles.title}>{copy.title}</h1>
      <BlogPostList posts={posts} emptyLabel={copy.empty} />
      <div className={styles.footer}>
        <Link href={`/${lang}/blog/tag`} className={styles.tagLink}>
          {copy.tags} →
        </Link>
      </div>
    </BlogSection>
  );
};

export default BlogIndex;
