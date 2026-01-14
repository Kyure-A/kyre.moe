export const SITE_LANGS = ["ja", "en"] as const;
export type SiteLang = (typeof SITE_LANGS)[number];

export const DEFAULT_LANG: SiteLang = "en";

export function isSiteLang(value: string): value is SiteLang {
	return SITE_LANGS.includes(value as SiteLang);
}

export function getLangFromPath(pathname?: string | null): SiteLang | null {
	if (!pathname) return null;
	const match = pathname.match(/^\/(ja|en)(?:\/|$)/);
	return match ? (match[1] as SiteLang) : null;
}

export function withLangPrefix(path: string, lang: SiteLang): string {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	if (normalized === "/") return `/${lang}`;
	return `/${lang}${normalized}`;
}

export function replacePathLang(pathname: string, lang: SiteLang): string {
	if (!pathname || pathname === "/") return `/${lang}`;
	if (pathname.startsWith("/ja/") || pathname.startsWith("/en/")) {
		return pathname.replace(/^\/(ja|en)(?=\/)/, `/${lang}`);
	}
	if (pathname === "/ja" || pathname === "/en") return `/${lang}`;
	const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
	return `/${lang}${normalized}`;
}
