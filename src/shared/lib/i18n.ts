export const SITE_LANGS = ["ja", "en"] as const;
export type SiteLang = (typeof SITE_LANGS)[number];

export const DEFAULT_LANG: SiteLang = "ja";

const LANG_PATTERN = SITE_LANGS.join("|");
const LANG_PREFIX_REGEX = new RegExp(`^/(${LANG_PATTERN})(?=/|$)`);
const LANG_EXTRACT_REGEX = new RegExp(`^/(${LANG_PATTERN})(?:/|$)`);

export const isSiteLang = (value: string): value is SiteLang => {
  return SITE_LANGS.includes(value as SiteLang);
};

export const getLangFromPath = (pathname?: string | null): SiteLang | null => {
  if (!pathname) return null;
  const match = pathname.match(LANG_EXTRACT_REGEX);
  return match ? (match[1] as SiteLang) : null;
};

export const withLangPrefix = (path: string, lang: SiteLang): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${lang}`;
  return `/${lang}${normalized}`;
};

export const replacePathLang = (pathname: string, lang: SiteLang): string => {
  if (!pathname || pathname === "/") return `/${lang}`;
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (LANG_PREFIX_REGEX.test(normalized)) {
    return normalized.replace(LANG_PREFIX_REGEX, `/${lang}`);
  }
  return normalized === "/" ? `/${lang}` : `/${lang}${normalized}`;
};
