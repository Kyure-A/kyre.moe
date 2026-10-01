import type { PageProps } from "@rshono/core";
import View from "@/pages/History/ui/History";
import { getOgImage } from "@/shared/lib/blog.content";
import { sectionHead } from "@/shared/lib/root-metadata";
import { requireSiteLang } from "@/shared/lib/routing";
import Document from "./Document";

export default function History({ params }: PageProps<"/:lang/history">) {
  const lang = requireSiteLang(params.lang);
  return (
    <Document
      head={sectionHead(lang, "history", getOgImage(`/${lang}/history`))}
      lang={lang}
    >
      <View lang={lang} />
    </Document>
  );
}
