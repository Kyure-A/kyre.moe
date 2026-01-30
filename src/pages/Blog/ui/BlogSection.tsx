import type { ReactNode } from "react";

type BlogSectionSize = "default" | "narrow";

type Props = {
  children: ReactNode;
  size?: BlogSectionSize;
  className?: string;
};

const SIZE_CLASS: Record<BlogSectionSize, string> = {
  default: "max-w-4xl",
  narrow: "max-w-3xl",
};

const BlogSection = ({ children, size = "default", className }: Props) => {
  const classes = [
    "w-full py-24 mx-auto px-4 sm:px-6",
    SIZE_CLASS[size],
    className,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return <section className={classes}>{children}</section>;
};

export default BlogSection;
