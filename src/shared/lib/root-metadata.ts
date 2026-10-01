import type { SiteLang } from "./i18n";

export const SITE_ORIGIN = "https://kyre.moe";
export const siteOgImage = {
  url: `${SITE_ORIGIN}/og/home.jpg`,
  width: 1200,
  height: 630,
  alt: "Kyure_A",
};

type PageMetadata = {
  title: string;
  description: string;
  canonical: string;
  lang?: SiteLang;
  languages?: Partial<Record<SiteLang, string>>;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  noindex?: boolean;
};

export const pageHead = ({
  title,
  description,
  canonical,
  lang = "ja",
  languages = {},
  image = siteOgImage.url,
  type = "website",
  publishedTime,
  noindex = false,
}: PageMetadata) => {
  const canonicalUrl = new URL(canonical, SITE_ORIGIN).href;
  const imageUrl = new URL(image, SITE_ORIGIN).href;
  const meta: Array<
    | { title: string }
    | { name: string; content: string }
    | { property: string; content: string }
  > = [
    { title: `${title} | Kyure_A` },
    { name: "description", content: description },
    { name: "robots", content: noindex ? "noindex, follow" : "index, follow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonicalUrl },
    { property: "og:site_name", content: "Kyure_A" },
    { property: "og:type", content: type },
    { property: "og:locale", content: lang === "ja" ? "ja_JP" : "en_US" },
    { property: "og:image", content: imageUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];
  if (publishedTime) {
    meta.push({ property: "article:published_time", content: publishedTime });
  }
  return {
    meta,
    links: [
      { rel: "canonical", href: canonicalUrl },
      ...Object.entries(languages).map(([hrefLang, path]) => ({
        rel: "alternate",
        hrefLang,
        href: new URL(path, SITE_ORIGIN).href,
      })),
    ],
  };
};

export const sectionMetadata = {
  home: {
    ja: { title: "ホーム", description: "Kyure_A のポートフォリオ" },
    en: { title: "Home", description: "Kyure_A's portfolio." },
  },
  about: {
    ja: { title: "自己紹介", description: "キュレェの基本情報と自己紹介" },
    en: {
      title: "About me",
      description: "Profile and quick facts about Kyure_A.",
    },
  },
  accounts: {
    ja: { title: "アカウント", description: "キュレェのアカウント一覧" },
    en: {
      title: "Accounts",
      description: "Links to Kyure_A's social and service accounts.",
    },
  },
  history: {
    ja: { title: "来歴", description: "キュレェの来歴" },
    en: {
      title: "History",
      description: "A timeline of Kyure_A's milestones and activities.",
    },
  },
  blog: {
    ja: { title: "ブログ", description: "記事一覧" },
    en: { title: "Blog", description: "Kyure_A's blog index." },
  },
  "blog/tag": {
    ja: { title: "タグ一覧", description: "ブログのタグ一覧" },
    en: { title: "Tags", description: "All blog tags." },
  },
};

export const sectionHead = (
  lang: SiteLang,
  section: keyof typeof sectionMetadata,
  image?: string,
) => {
  const suffix = section === "home" ? "" : `/${section}`;
  return pageHead({
    ...sectionMetadata[section][lang],
    lang,
    canonical: `/${lang}${suffix}`,
    languages: { ja: `/ja${suffix}`, en: `/en${suffix}` },
    image,
  });
};
