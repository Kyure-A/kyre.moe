import type { PageProps } from "@rshono/core";
import { notFound } from "@rshono/core/server";
import BlogPost from "@/pages/Blog/ui/BlogPost";
import {
  getOgImage,
  getPost,
  getPostLanguages,
} from "@/shared/lib/blog.content";
import { pageHead } from "@/shared/lib/root-metadata";
import { requireSiteLang } from "@/shared/lib/routing";
import Document from "./Document";

export default async function Post({ params }: PageProps<"/:lang/blog/:slug">) {
  const lang = requireSiteLang(params.lang);
  const post = await getPost(params.slug, lang);
  if (!post) notFound();
  const path = `/${lang}/blog/${post.slug}`;
  const head = pageHead({
    lang,
    title: post.title,
    description: post.description,
    canonical: post.canonical ?? path,
    languages: Object.fromEntries(
      getPostLanguages(post.slug).map((language) => [
        language,
        `/${language}/blog/${post.slug}`,
      ]),
    ),
    image: post.cover ?? getOgImage(path),
    type: "article",
    publishedTime: post.date || undefined,
    noindex: Boolean(post.canonical),
  });
  return (
    <Document head={head} lang={lang}>
      <BlogPost key={`${lang}/${post.slug}`} post={post} />
    </Document>
  );
}
