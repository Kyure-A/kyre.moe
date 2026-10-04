import BlogIndex from "@/pages/Blog/ui/BlogIndex";
import { getAllPosts, getOgImage } from "@/shared/lib/blog.content";
import { sectionHead } from "@/shared/lib/root-metadata";
import { requireSiteLang } from "@/shared/lib/routing";
import Document from "./Document";
import type { PageProps } from "./types";

export default function Blog({ params }: PageProps) {
  const lang = requireSiteLang(params.lang);
  return (
    <Document
      head={sectionHead(lang, "blog", getOgImage(`/${lang}/blog`))}
      lang={lang}
    >
      <BlogIndex lang={lang} posts={getAllPosts(lang)} />
    </Document>
  );
}
