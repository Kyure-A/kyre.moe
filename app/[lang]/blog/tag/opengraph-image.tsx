import { isSiteLang, type SiteLang } from "@/shared/lib/i18n";
import {
  generateLangStaticParams,
  generateOgImage,
  ogImageExports,
} from "@/shared/lib/og-image";

export const { dynamic, size, contentType } = ogImageExports;
export const generateStaticParams = generateLangStaticParams;

const COPY_BY_LANG: Record<SiteLang, { title: string; subtitle: string }> = {
  ja: {
    title: "タグ一覧",
    subtitle: "Kyure_A / キュレェ",
  },
  en: {
    title: "Tags",
    subtitle: "Kyure_A / Kyuree",
  },
};

type Props = {
  params: Promise<{ lang: string }>;
};

const Image = async ({ params }: Props) => {
  const { lang } = await params;
  const copy = isSiteLang(lang) ? COPY_BY_LANG[lang] : COPY_BY_LANG.ja;

  return generateOgImage({
    title: copy.title,
    subtitle: copy.subtitle,
  });
};

export default Image;
