import { Link } from "next-view-transitions";
import BlogPostList from "@/pages/Blog/ui/BlogPostList";
import BlogSection from "@/pages/Blog/ui/BlogSection";
import type { BlogPostMeta } from "@/shared/lib/blog";
import type { SiteLang } from "@/shared/lib/i18n";
import { css } from "styled-system/css";

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

const styles = {
  header: css({
    mb: "10",
  }),
  label: css({
    fontSize: "2xs",
    letterSpacing: "label",
    color: "text.tertiary",
  }),
  title: css({
    mt: "3",
    fontSize: { base: "2xl", md: "3xl" },
    fontWeight: "semibold",
    color: "text.primary",
  }),
  count: css({
    mt: "2",
    fontSize: "sm",
    color: "text.secondary",
  }),
  back: css({
    mt: "5",
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    fontSize: "2xs",
    letterSpacing: "label",
    color: "text.tertiary",
    transitionProperty: "colors",
    transitionDuration: "slow",
    transitionTimingFunction: "easeOut",
    _hover: {
      color: "text.primary",
    },
  }),
};

const BlogTagIndex = ({ lang, tag, posts }: Props) => {
  const copy = COPY[lang];

  return (
    <BlogSection>
      <header className={styles.header}>
        <p className={styles.label}>
          {copy.label}
        </p>
        <h1 className={styles.title}>
          #{tag}
        </h1>
        <p className={styles.count}>
          {copy.count(posts.length)}
        </p>
        <Link
          href={`/${lang}/blog/tag`}
          className={styles.back}
        >
          ← {copy.back}
        </Link>
      </header>
      <BlogPostList posts={posts} emptyLabel={copy.empty} />
    </BlogSection>
  );
};

export default BlogTagIndex;
