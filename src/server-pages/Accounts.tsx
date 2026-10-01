import type { PageProps } from "@rshono/core";
import View from "@/pages/Accounts/ui/Accounts";
import { getOgImage } from "@/shared/lib/blog.content";
import { sectionHead } from "@/shared/lib/root-metadata";
import { requireSiteLang } from "@/shared/lib/routing";
import Document from "./Document";

export default function Accounts({ params }: PageProps<"/:lang/accounts">) {
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
