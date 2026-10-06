import type { PageProps } from "@rshono/core";
import { notFound } from "@rshono/core/server";
import BlogTagIndex from "@/pages/Blog/ui/BlogTagIndex";
import {
  getOgImage,
  getPostsByTag,
  getTagItem,
} from "@/shared/lib/blog.content";
import { pageHead } from "@/shared/lib/root-metadata";
import { requireSiteLang } from "@/shared/lib/routing";
import Document from "./Document";

export default function Tag({ params }: PageProps<"/:lang/blog/tag/:tag">) {
  const lang = requireSiteLang(params.lang);
  const tag = getTagItem(params.tag, lang);
  if (!tag) notFound();
  const path = `/${lang}/blog/tag/${encodeURIComponent(tag.slug)}`;
  const head = pageHead({
    lang,
    title: `#${tag.label}`,
    description:
      lang === "ja"
        ? `「${tag.label}」の記事一覧`
        : `Posts tagged ${tag.label}`,
    canonical: path,
    image: getOgImage(path),
  });
  return (
    <Document head={head} lang={lang}>
      <BlogTagIndex
        lang={lang}
        tag={tag.label}
        posts={getPostsByTag(tag.slug, lang)}
      />
    </Document>
  );
}
