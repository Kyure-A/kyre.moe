import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostView from "@/pages/Blog/ui/BlogPost";
import {
  getAllPosts,
  getPost,
  getPostLanguages,
} from "@/shared/lib/blog.server";
import { isSiteLang, SITE_LANGS } from "@/shared/lib/i18n";

type Params = { lang: string; slug: string };

type Props = {
  params: Promise<Params>;
};

export const generateStaticParams = () => {
  return getAllPosts().map((post) => ({
    lang: post.lang,
    slug: post.slug,
  }));
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { lang, slug } = await params;
  if (!isSiteLang(lang)) return {};
  const post = await getPost(slug, lang);
  if (!post) return {};
  const availableLangs = getPostLanguages(post.slug);
  const alternates: Record<string, string> = {};
  for (const lang of SITE_LANGS) {
    if (availableLangs.includes(lang)) {
      alternates[lang] = `/${lang}/blog/${post.slug}`;
    }
  }
  const canonical = post.canonical ?? `/${post.lang}/blog/${post.slug}`;
  const fallbackOgImage = `/${post.lang}/blog/${post.slug}/opengraph-image`;
  const images = [post.cover ?? fallbackOgImage];

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical,
      languages: alternates,
    },
    ...(post.canonical && { robots: { index: false, follow: true } }),
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date || undefined,
      images,
      url: `/${post.lang}/blog/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      images,
    },
  };
};

const BlogPostPage = async ({ params }: Props) => {
  const { lang, slug } = await params;
  if (!isSiteLang(lang)) notFound();
  const post = await getPost(slug, lang);
  if (!post) notFound();
  return <BlogPostView post={post} />;
};

export default BlogPostPage;
