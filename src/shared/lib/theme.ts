export const THEME_STORAGE_KEY = "kyre-theme";

export const SITE_THEMES = ["dark", "light"] as const;

export type SiteTheme = (typeof SITE_THEMES)[number];

export const DEFAULT_THEME: SiteTheme = "dark";

export const isSiteTheme = (
  value: string | null | undefined,
): value is SiteTheme => {
  return value === "dark" || value === "light";
};
