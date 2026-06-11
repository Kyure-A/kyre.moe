import { Link } from "next-view-transitions";
import { css } from "styled-system/css";
import BlogSection from "@/pages/Blog/ui/BlogSection";
import { type BlogTagItem, buildTagPath } from "@/shared/lib/blog";
import type { SiteLang } from "@/shared/lib/i18n";

type Props = {
  lang: SiteLang;
  tags: BlogTagItem[];
};

const COPY: Record<
  SiteLang,
  {
    label: string;
    title: string;
    empty: string;
    count: (count: number) => string;
  }
> = {
  ja: {
    label: "タグ",
    title: "タグ一覧",
    empty: "タグがまだありません。",
    count: (count) => `タグ ${count} 件`,
  },
  en: {
    label: "Tags",
    title: "All tags",
    empty: "No tags yet.",
    count: (count) => `${count} tag${count === 1 ? "" : "s"}`,
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
  empty: css({
    fontSize: "sm",
    color: "text.tertiary",
  }),
  tags: css({
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    fontSize: "2xs",
    letterSpacing: "label",
    color: "text.tertiary",
  }),
  tag: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    borderRadius: "tag",
    borderWidth: "1px",
    borderColor: "border.subtle",
    px: "3",
    py: "1",
    transitionProperty: "colors",
    transitionDuration: "slow",
    transitionTimingFunction: "easeOut",
    _hover: {
      borderColor: "border.subtleStrong",
      color: "text.primary",
    },
  }),
  tagCount: css({
    color: "text.tertiary",
    opacity: "0.8",
  }),
};

const BlogTagList = ({ lang, tags }: Props) => {
  const copy = COPY[lang];

  return (
    <BlogSection>
      <header className={styles.header}>
        <p className={styles.label}>{copy.label}</p>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.count}>{copy.count(tags.length)}</p>
      </header>
      {tags.length === 0 ? (
        <p className={styles.empty}>{copy.empty}</p>
      ) : (
        <div className={styles.tags}>
          {tags.map((item) => (
            <Link
              key={item.slug}
              href={buildTagPath(item.slug, lang)}
              className={styles.tag}
            >
              <span>#{item.label}</span>
              <span className={styles.tagCount}>{item.count}</span>
            </Link>
          ))}
        </div>
      )}
    </BlogSection>
  );
};

export default BlogTagList;
