import type { Metadata } from "next";
import { notFound } from "next/navigation";
import History from "@/pages/History/ui/History";
import { isSiteLang, SITE_LANGS, type SiteLang } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
  params: Promise<Params>;
};

const META_BY_LANG: Record<SiteLang, { title: string; description: string }> = {
  ja: {
    title: "来歴",
    description: "キュレェの来歴",
  },
  en: {
    title: "History",
    description: "A timeline of Kyure_A's milestones and activities.",
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
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/history`,
      languages: {
        ja: "/ja/history",
        en: "/en/history",
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
};

const HistoryPage = async ({ params }: Props) => {
  const { lang } = await params;
  if (!isSiteLang(lang)) notFound();
  return <History lang={lang} />;
};

export default HistoryPage;
