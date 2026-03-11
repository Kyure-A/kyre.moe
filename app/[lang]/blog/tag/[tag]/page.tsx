import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogTagIndex from "@/pages/Blog/ui/BlogTagIndex";
import { buildTagPath } from "@/shared/lib/blog";
import {
  getAllTagItems,
  getPostsByTag,
  getTagItem,
} from "@/shared/lib/blog.server";
import { isSiteLang, SITE_LANGS, type SiteLang } from "@/shared/lib/i18n";

type Params = { lang: string; tag: string };

type Props = {
  params: Promise<Params>;
};

const META_COPY: Record<
  SiteLang,
  { title: (tag: string) => string; description: (tag: string) => string }
> = {
  ja: {
    title: (tag) => `#${tag} の記事`,
    description: (tag) => `タグ「${tag}」の記事一覧。`,
  },
  en: {
    title: (tag) => `#${tag} posts`,
    description: (tag) => `Posts tagged #${tag}.`,
  },
};

const decodeTag = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const generateStaticParams = () => {
  return SITE_LANGS.flatMap((lang) =>
    getAllTagItems(lang).map((tag) => ({ lang, tag: tag.slug })),
  );
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { lang, tag } = await params;
  if (!isSiteLang(lang)) return {};
  const decodedTag = decodeTag(tag);
  const tagItem = getTagItem(decodedTag, lang);
  if (!tagItem) return {};
  const posts = getPostsByTag(tagItem.slug, lang);
  if (posts.length === 0) return {};

  const meta = META_COPY[lang];
  const title = meta.title(tagItem.label);
  const description = meta.description(tagItem.label);
  const ogImage = `/${lang}/blog/tag/${encodeURIComponent(tagItem.slug)}/opengraph-image`;
  const languages: Record<string, string> = {};

  for (const siteLang of SITE_LANGS) {
    if (getTagItem(tagItem.slug, siteLang)) {
      languages[siteLang] = buildTagPath(tagItem.slug, siteLang);
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: buildTagPath(tagItem.slug, lang),
      languages,
    },
    openGraph: {
      title,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
};

const BlogTagPage = async ({ params }: Props) => {
  const { lang, tag } = await params;
  if (!isSiteLang(lang)) notFound();
  const decodedTag = decodeTag(tag);
  const tagItem = getTagItem(decodedTag, lang);
  if (!tagItem) notFound();
  const posts = getPostsByTag(tagItem.slug, lang);
  if (posts.length === 0) notFound();
  return <BlogTagIndex lang={lang} tag={tagItem.label} posts={posts} />;
};

export default BlogTagPage;
