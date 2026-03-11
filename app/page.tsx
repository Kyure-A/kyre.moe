import type { Metadata } from "next";
import Home from "@/pages/Home/ui/Home";
import { DEFAULT_LANG } from "@/shared/lib/i18n";
import { duplicatePageRobots } from "@/shared/lib/seo";

export const metadata: Metadata = {
  title: "kyre.moe",
  description: "キュレェ (Kyure_A)'s portfolio website",
  robots: duplicatePageRobots,
  alternates: {
    canonical: `/${DEFAULT_LANG}`,
    languages: {
      ja: "/ja",
      en: "/en",
    },
  },
  openGraph: {
    title: "kyre.moe",
    description: "キュレェ (Kyure_A)'s portfolio website",
    images: [`/${DEFAULT_LANG}/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: "ホーム",
    description: "キュレェ (Kyure_A)'s portfolio website",
    images: [`/${DEFAULT_LANG}/opengraph-image`],
  },
};

const RootPage = () => {
  return <Home />;
};

export default RootPage;
