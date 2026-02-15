import type { Metadata } from "next";
import Home from "@/pages/Home/ui/Home";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

export const metadata: Metadata = {
  title: "ホーム",
  description: "Kyure_A のポートフォリオ",
  alternates: {
    canonical: `/${DEFAULT_LANG}`,
    languages: {
      ja: "/ja",
      en: "/en",
    },
  },
  openGraph: {
    title: "ホーム",
    description: "Kyure_A のポートフォリオ",
    images: [`/${DEFAULT_LANG}/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: "ホーム",
    description: "Kyure_A のポートフォリオ",
    images: [`/${DEFAULT_LANG}/opengraph-image`],
  },
};

const RootPage = () => {
  return <Home />;
};

export default RootPage;
