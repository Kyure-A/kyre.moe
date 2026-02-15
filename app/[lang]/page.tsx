import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "@/pages/Home/ui/Home";
import { isSiteLang, SITE_LANGS, type SiteLang } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
  params: Promise<Params>;
};

const META_BY_LANG: Record<SiteLang, { title: string; description: string }> = {
  ja: {
    title: "ホーム",
    description: "Kyure_A のポートフォリオ",
  },
  en: {
    title: "Home",
    description: "Kyure_A's portfolio.",
  },
};

export const generateStaticParams = () => {
  return SITE_LANGS.map((lang) => ({ lang }));
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { lang } = await params;
  if (!isSiteLang(lang)) return {};
  const meta = META_BY_LANG[lang];
  const ogImage = `/${lang}/opengraph-image`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: {
        ja: "/ja",
        en: "/en",
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  };
};

const HomeLangPage = async ({ params }: Props) => {
  const { lang } = await params;
  if (!isSiteLang(lang)) notFound();
  return <Home />;
};

export default HomeLangPage;
