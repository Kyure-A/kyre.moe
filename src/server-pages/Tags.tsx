import type { PageProps } from "@rshono/core";
import BlogTagList from "@/pages/Blog/ui/BlogTagList";
import { getAllTagItems, getOgImage } from "@/shared/lib/blog.content";
import { sectionHead } from "@/shared/lib/root-metadata";
import { requireSiteLang } from "@/shared/lib/routing";
import Document from "./Document";

export default function Tags({ params }: PageProps<"/:lang/blog/tag">) {
  const lang = requireSiteLang(params.lang);
  return (
    <Document
      head={sectionHead(lang, "blog/tag", getOgImage(`/${lang}/blog/tag`))}
      lang={lang}
    >
      <BlogTagList lang={lang} tags={getAllTagItems(lang)} />
    </Document>
  );
}
