import HomeView from "@/pages/Home/ui/Home";
import { getOgImage } from "@/shared/lib/blog.content";
import { DEFAULT_LANG } from "@/shared/lib/i18n";
import { pageHead, sectionHead } from "@/shared/lib/root-metadata";
import { requireSiteLang } from "@/shared/lib/routing";
import Document from "./Document";
import type { PageProps } from "./types";

export default function Home({ params, url }: PageProps) {
  const lang = requireSiteLang(params.lang ?? DEFAULT_LANG);
  const head =
    url.pathname === "/"
      ? pageHead({
          title: "kyre.moe",
          description: "Kyure_A のポートフォリオ",
          canonical: "/ja",
          languages: { ja: "/ja", en: "/en" },
          noindex: true,
        })
      : sectionHead(lang, "home", getOgImage(`/${lang}`));
  return (
    <Document head={head} lang={lang}>
      <div id="home-content" style={{ width: "100%" }}>
        <HomeView />
      </div>
    </Document>
  );
}
