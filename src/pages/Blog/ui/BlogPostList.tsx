import { Link } from "next-view-transitions";
import type { CSSProperties } from "react";
import type { BlogPostMeta } from "@/shared/lib/blog";
import { buildTagPath, formatDate } from "@/shared/lib/blog";
import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

type Props = {
  posts: BlogPostMeta[];
  emptyLabel: string;
};

const styles = {
  list: css({
    listStyle: "none",
    spaceY: "2",
  }),
  empty: css({
    px: "2",
    py: "3",
    fontSize: "sm",
    color: "text.tertiary",
  }),
  item: css({
    px: "2",
  }),
  card: css({
    position: "relative",
    display: "block",
    width: "full",
    "&:is(:hover, :focus-within, [data-hover], [data-focus-within]) [data-blog-content]": {
      px: "4",
      borderRadius: "item",
      backgroundColor: "accent.dynamic",
      color: "postHoverTitle",
    },
    "&:is(:hover, :focus-within, [data-hover], [data-focus-within]) [data-blog-meta]": {
      color: "postHoverMeta",
    },
    "&:is(:hover, :focus-within, [data-hover], [data-focus-within]) [data-blog-title]": {
      color: "postHoverTitle",
    },
    "&:is(:hover, :focus-within, [data-hover], [data-focus-within]) [data-blog-description]": {
      color: "postHoverBody",
    },
    "&:is(:hover, :focus-within, [data-hover], [data-focus-within]) [data-blog-tags]": {
      color: "postHoverBody",
    },
    "&:is(:hover, :focus-within, [data-hover], [data-focus-within]) [data-blog-tag]": {
      borderColor: "postHoverBorder",
    },
  }),
  overlayLink: css({
    position: "absolute",
    inset: "0",
    zIndex: "content",
  }),
  hiddenTitle: visuallyHidden(),
  content: css({
    display: "flex",
    flexDirection: "column",
    gap: "2",
    px: "0",
    py: "3",
    color: "text.primary",
    transition: "all",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
  }),
  meta: css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "3",
    fontSize: "2xs",
    letterSpacing: "label",
    color: "text.secondary",
    transitionProperty: "colors",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
  }),
  title: css({
    fontSize: { base: "lg", md: "xl" },
    fontWeight: "semibold",
    lineHeight: "snug",
    color: "text.primary",
    transitionProperty: "colors",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
  }),
  description: css({
    fontSize: "sm",
    lineHeight: "relaxed",
    color: "text.secondary",
    transitionProperty: "colors",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
  }),
  tags: css({
    position: "relative",
    zIndex: "controls",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    fontSize: "2xs",
    letterSpacing: "label",
    color: "text.tertiary",
    transitionProperty: "colors",
    transitionDuration: "slower",
    transitionTimingFunction: "easeOut",
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
    },
  }),
};

const BlogPostList = ({ posts, emptyLabel }: Props) => {
  const accentStyle = {
    "--accent": "#66d9ef",
    "--colors-accent-dynamic": "#66d9ef",
  } as CSSProperties;

  return (
    <ul className={styles.list}>
      {posts.length === 0 ? (
        <li className={styles.empty}>
          {emptyLabel}
        </li>
      ) : (
        posts.map((post) => (
          <li key={`${post.slug}-${post.lang}`} className={styles.item}>
            <div className={styles.card} style={accentStyle}>
              <Link
                href={`/${post.lang}/blog/${post.slug}`}
                className={styles.overlayLink}
                aria-label={post.title}
              >
                <span className={styles.hiddenTitle}>{post.title}</span>
              </Link>
              <div className={styles.content} data-blog-content="">
                <div className={styles.meta} data-blog-meta="">
                  <span>{formatDate(post.date, post.lang)}</span>
                </div>
                <h2
                  className={styles.title}
                  style={{ viewTransitionName: `blog-title-${post.slug}` }}
                  data-blog-title=""
                >
                  {post.title}
                </h2>
                {post.description && (
                  <p
                    className={styles.description}
                    style={{ viewTransitionName: `blog-desc-${post.slug}` }}
                    data-blog-description=""
                  >
                    {post.description}
                  </p>
                )}
                {post.tags.length > 0 && (
                  <div className={styles.tags} data-blog-tags="">
                    {post.tags.map((tag) => (
                      <Link
                        key={`${post.slug}-${tag}`}
                        href={buildTagPath(tag, post.lang)}
                        className={styles.tag}
                        data-blog-tag=""
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))
      )}
    </ul>
  );
};

export default BlogPostList;
