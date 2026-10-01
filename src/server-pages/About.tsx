import type { PageProps } from "@rshono/core";
import View from "@/pages/AboutMe/ui/AboutMe";
import { getOgImage } from "@/shared/lib/blog.content";
import { sectionHead } from "@/shared/lib/root-metadata";
import { requireSiteLang } from "@/shared/lib/routing";
import Document from "./Document";

export default function About({ params }: PageProps<"/:lang/about">) {
  const lang = requireSiteLang(params.lang);
  return (
    <Document
      head={sectionHead(lang, "about", getOgImage(`/${lang}/about`))}
      lang={lang}
    >
      <View lang={lang} />
    </Document>
  );
}
