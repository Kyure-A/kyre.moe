import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogTagList from "@/pages/Blog/ui/BlogTagList";
import { getAllTagItems } from "@/shared/lib/blog.server";
import { isSiteLang, SITE_LANGS, type SiteLang } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
  params: Promise<Params>;
};

const META_BY_LANG: Record<SiteLang, { title: string; description: string }> = {
  ja: {
    title: "タグ一覧",
    description: "ブログのタグ一覧",
  },
  en: {
    title: "Tags",
    description: "All blog tags.",
  },
};

export const generateStaticParams = () => {
  return SITE_LANGS.map((lang) => ({ lang }));
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { lang } = await params;
  if (!isSiteLang(lang)) return {};
  const meta = META_BY_LANG[lang];
  const ogImage = `/${lang}/blog/tag/opengraph-image`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/blog/tag`,
      languages: {
        ja: "/ja/blog/tag",
        en: "/en/blog/tag",
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  };
};

const BlogTagListPage = async ({ params }: Props) => {
  const { lang } = await params;
  if (!isSiteLang(lang)) notFound();
  const tags = getAllTagItems(lang);
  return <BlogTagList lang={lang} tags={tags} />;
};

export default BlogTagListPage;
