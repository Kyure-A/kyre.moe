import { getAllTags } from "@/shared/lib/blog.server";
import { isSiteLang, SITE_LANGS, type SiteLang } from "@/shared/lib/i18n";
import {
  generateOgImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/shared/lib/og-image";

export const dynamic = "force-static";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

const TEXT_BY_LANG: Record<
  SiteLang,
  { title: (tag: string) => string; subtitle: string }
> = {
  ja: {
    title: (tag) => `#${tag} の記事`,
    subtitle: "タグアーカイブ",
  },
  en: {
    title: (tag) => `#${tag} posts`,
    subtitle: "Tag archive",
  },
};

const decodeTag = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const generateStaticParams = () => {
  return SITE_LANGS.flatMap((lang) =>
    getAllTags(lang).map((tag) => ({ lang, tag })),
  );
};

type Props = {
  params: Promise<{ lang: string; tag: string }>;
};

const Image = async ({ params }: Props) => {
  const { lang, tag } = await params;

  if (!isSiteLang(lang)) {
    return generateOgImage({
      title: "Tags",
      subtitle: "kyre.moe",
    });
  }

  const decodedTag = decodeTag(tag);
  const hasTag = getAllTags(lang).includes(decodedTag);
  if (!hasTag) {
    return generateOgImage({
      title: TEXT_BY_LANG[lang].subtitle,
      subtitle: "kyre.moe",
    });
  }

  const text = TEXT_BY_LANG[lang];
  return generateOgImage({
    title: text.title(decodedTag),
    subtitle: text.subtitle,
    tags: [decodedTag],
  });
};

export default Image;
