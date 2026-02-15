import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/shared/lib/blog.server";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

type Params = { tag: string };

type Props = {
  params: Promise<Params>;
};

export const generateStaticParams = () => {
  return getAllTags().map((tag) => ({ tag }));
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
  if (getPostsByTag(decodedTag, DEFAULT_LANG).length === 0) return {};
  const title = `#${decodedTag} の記事`;
  const description = `タグ「${decodedTag}」の記事一覧。`;
  const ogImage = `/${DEFAULT_LANG}/blog/tag/${encodeURIComponent(decodedTag)}/opengraph-image`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${DEFAULT_LANG}/blog/tag/${encodeURIComponent(decodedTag)}`,
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
  redirect(`/${DEFAULT_LANG}/blog/tag/${encodeURIComponent(tag)}`);
};

export default BlogTagItemRedirectPage;
