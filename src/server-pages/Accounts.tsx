import View from "@/pages/Accounts/ui/Accounts";
import { getOgImage } from "@/shared/lib/blog.content";
import { sectionHead } from "@/shared/lib/root-metadata";
import { requireSiteLang } from "@/shared/lib/routing";
import Document from "./Document";
import type { PageProps } from "./types";

export default function Accounts({ params }: PageProps) {
  const lang = requireSiteLang(params.lang);
  return (
    <Document
      head={sectionHead(lang, "accounts", getOgImage(`/${lang}/accounts`))}
      lang={lang}
    >
      <View lang={lang} />
    </Document>
  );
}
