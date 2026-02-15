import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

export const metadata: Metadata = {
  title: "ブログ",
  description: "記事一覧",
  alternates: {
    canonical: `/${DEFAULT_LANG}/blog`,
  },
  openGraph: {
    title: "ブログ",
    description: "記事一覧",
    images: [`/${DEFAULT_LANG}/blog/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: "ブログ",
    description: "記事一覧",
    images: [`/${DEFAULT_LANG}/blog/opengraph-image`],
  },
};

const BlogRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/blog`);
};

export default BlogRedirectPage;
