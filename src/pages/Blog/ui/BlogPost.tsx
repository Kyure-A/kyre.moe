import Image from "next/image";
import { Link } from "next-view-transitions";
import type { BlogPost } from "@/shared/lib/blog";
import { buildTagPath, formatDate } from "@/shared/lib/blog";
import CopyCodeBlock from "@/shared/ui/CopyCodeBlock/CopyCodeBlock";
import TwitterEmbedEnhancer from "@/shared/ui/TwitterEmbed/TwitterEmbed";
import YouTubeEmbedEnhancer from "@/shared/ui/YouTubeEmbed/YouTubeEmbed";
import { css, cx } from "styled-system/css";

type Props = {
  post: BlogPost;
};

const styles = {
  section: css({
    width: "full",
    py: "page-y",
    maxWidth: "content-3xl",
    mx: "auto",
    px: { base: "4", sm: "6" },
  }),
  header: css({
    mt: "8",
  }),
  date: css({
    fontSize: "2xs",
    letterSpacing: "label",
    color: "text.tertiary",
  }),
  title: css({
    mt: "4",
    fontSize: { base: "3xl", md: "4xl" },
    fontWeight: "semibold",
    letterSpacing: "tight",
    color: "text.primary",
  }),
  description: css({
    mt: "4",
    fontSize: { base: "sm", md: "md" },
    lineHeight: "relaxed",
    color: "text.secondary",
  }),
  tags: css({
    mt: "4",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    fontSize: "2xs",
    letterSpacing: "label",
    color: "text.tertiary",
  }),
  tag: css({
    borderRadius: "tag",
    borderWidth: "1px",
    borderColor: "border.subtle",
    px: "3",
    py: "1",
    transitionProperty: "colors",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
    _hover: {
      borderColor: "border.subtleStrong",
      color: "text.primary",
    },
  }),
  cover: css({
    mt: "8",
    overflow: "hidden",
    borderRadius: "2xl",
  }),
  coverImage: css({
    height: "auto",
    width: "full",
    objectFit: "cover",
  }),
  content: css({
    mt: "10",
  }),
  canonical: css({
    mt: "8",
    fontSize: "xs",
    letterSpacing: "label",
    color: "text.tertiary",
  }),
  canonicalLink: css({
    color: "text.secondary",
    textDecorationLine: "underline",
    textDecorationColor: "border.subtleStrong",
    textUnderlineOffset: "4px",
  }),
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
    <section className={styles.section}>
      <CopyCodeBlock />
      <TwitterEmbedEnhancer />
      <YouTubeEmbedEnhancer />
      <header className={styles.header}>
        <p
          className={styles.date}
          style={{ viewTransitionName: `blog-date-${post.slug}` }}
        >
          {formatDate(post.date, post.lang)}
        </p>
        <h1
          className={styles.title}
          style={{ viewTransitionName: `blog-title-${post.slug}` }}
        >
          {post.title}
        </h1>
        {post.description && (
          <p
            className={styles.description}
            style={{ viewTransitionName: `blog-desc-${post.slug}` }}
          >
            {post.description}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <Link
                key={`${post.slug}-${tag}`}
                href={buildTagPath(tag, post.lang)}
                className={styles.tag}
                style={{ viewTransitionName: `blog-tag-${post.slug}-${tag}` }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        {post.cover && (
          <div className={styles.cover}>
            <Image
              src={post.cover}
              alt={post.title}
              width={1600}
              height={900}
              sizes="(min-width: 768px) 768px, 100vw"
              className={styles.coverImage}
              loading="lazy"
            />
          </div>
        )}
      </header>

      <article
        className={cx("blog-content", styles.content)}
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is generated server-side with raw HTML disabled */
        /* nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml */
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      {showCanonical && (
        <div className={styles.canonical}>
          Original:&nbsp;
          <a
            href={post.canonical}
            className={styles.canonicalLink}
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
