import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AboutMe from "@/pages/AboutMe/ui/AboutMe";
import { isSiteLang, SITE_LANGS, type SiteLang } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
  params: Promise<Params>;
};

const META_BY_LANG: Record<SiteLang, { title: string; description: string }> = {
  ja: {
    title: "自己紹介",
    description: "キュレェの基本情報と自己紹介",
  },
  en: {
    title: "About me",
    description: "Profile and quick facts about Kyure_A.",
  },
};

export function generateStaticParams() {
  return SITE_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLang(lang)) return {};
  const meta = META_BY_LANG[lang];
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/about`,
      languages: {
        ja: "/ja/about",
        en: "/en/about",
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { lang } = await params;
  if (!isSiteLang(lang)) notFound();
  return <AboutMe lang={lang} />;
}
