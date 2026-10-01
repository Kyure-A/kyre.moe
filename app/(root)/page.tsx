import type { Metadata } from "next";
import Home from "@/pages/Home/ui/Home";
import { DEFAULT_LANG } from "@/shared/lib/i18n";
import { siteOgImage } from "@/shared/lib/root-metadata";
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
    images: [siteOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "ホーム",
    description: "キュレェ (Kyure_A)'s portfolio website",
    images: [siteOgImage],
  },
};

const RootPage = () => {
  return <Home />;
};

export default RootPage;
