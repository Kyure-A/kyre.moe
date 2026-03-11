import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildTagPath } from "@/shared/lib/blog";
import {
  getAllTagItems,
  getPostsByTag,
  getTagItem,
} from "@/shared/lib/blog.server";
import { DEFAULT_LANG } from "@/shared/lib/i18n";
import { duplicatePageRobots } from "@/shared/lib/seo";

type Params = { tag: string };

type Props = {
  params: Promise<Params>;
};

export const generateStaticParams = () => {
  return getAllTagItems().map((tag) => ({ tag: tag.slug }));
};

const decodeTag = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { tag } = await params;
  const decodedTag = decodeTag(tag);
  const tagItem = getTagItem(decodedTag, DEFAULT_LANG);
  if (!tagItem || getPostsByTag(tagItem.slug, DEFAULT_LANG).length === 0) {
    return {};
  }
  const title = `#${tagItem.label} の記事`;
  const description = `タグ「${tagItem.label}」の記事一覧。`;
  const ogImage = `/${DEFAULT_LANG}/blog/tag/${encodeURIComponent(tagItem.slug)}/opengraph-image`;
  return {
    title,
    description,
    robots: duplicatePageRobots,
    alternates: {
      canonical: buildTagPath(tagItem.slug, DEFAULT_LANG),
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

const BlogTagItemRedirectPage = async ({ params }: Props) => {
  const { tag } = await params;
  redirect(buildTagPath(tag, DEFAULT_LANG));
};

export default BlogTagItemRedirectPage;
