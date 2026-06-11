import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";

type BlogSectionSize = "default" | "narrow";

type Props = {
  children: ReactNode;
  size?: BlogSectionSize;
  className?: string;
};

const sizeClass: Record<BlogSectionSize, string> = {
  default: css({ maxWidth: "content-4xl" }),
  narrow: css({ maxWidth: "content-3xl" }),
};

const BlogSection = ({ children, size = "default", className }: Props) => {
  const classes = cx(
    css({
      width: "full",
      py: "page-y",
      mx: "auto",
      px: { base: "4", sm: "6" },
    }),
    sizeClass[size],
    className,
  );

  return <section className={classes}>{children}</section>;
};

export default BlogSection;
