import NotFoundView from "@/pages/NotFound/ui/NotFound";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";
import { pageHead } from "@/shared/lib/root-metadata";
import Document from "./Document";
import type { PageProps } from "./types";

export default function NotFound({ url }: PageProps) {
  const lang = getLangFromPath(url.pathname) ?? DEFAULT_LANG;
  return (
    <Document
      head={pageHead({
        title: "Page not found",
        description: "The page you requested could not be found.",
        canonical: "/404",
        noindex: true,
        lang,
      })}
      lang={lang}
      shell={false}
    >
      <div id="not-found-content" style={{ width: "100%" }}>
        <NotFoundView />
      </div>
    </Document>
  );
}
