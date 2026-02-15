import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

export const metadata: Metadata = {
  title: "タグ一覧",
  description: "ブログのタグ一覧",
  alternates: {
    canonical: `/${DEFAULT_LANG}/blog/tag`,
  },
  openGraph: {
    title: "タグ一覧",
    description: "ブログのタグ一覧",
    images: [`/${DEFAULT_LANG}/blog/tag/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: "タグ一覧",
    description: "ブログのタグ一覧",
    images: [`/${DEFAULT_LANG}/blog/tag/opengraph-image`],
  },
};

const BlogTagRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/blog/tag`);
};

export default BlogTagRedirectPage;
