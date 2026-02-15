import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllPosts, getPost } from "@/shared/lib/blog.server";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

type Params = { slug: string };

type Props = {
  params: Promise<Params>;
};

export const generateStaticParams = () => {
  const slugs = new Set(getAllPosts().map((post) => post.slug));
  return Array.from(slugs).map((slug) => ({ slug }));
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { slug } = await params;
  const post = await getPost(slug, DEFAULT_LANG);
  if (!post) return {};

  const canonical = post.canonical ?? `/${DEFAULT_LANG}/blog/${post.slug}`;
  const fallbackOgImage = `/${DEFAULT_LANG}/blog/${post.slug}/opengraph-image`;
  const images = [post.cover ?? fallbackOgImage];

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    ...(post.canonical && { robots: { index: false, follow: true } }),
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date || undefined,
      images,
      url: `/${DEFAULT_LANG}/blog/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      images,
    },
  };
};

const BlogPostRedirectPage = async ({ params }: Props) => {
  const { slug } = await params;
  redirect(`/${DEFAULT_LANG}/blog/${slug}`);
};

export default BlogPostRedirectPage;
