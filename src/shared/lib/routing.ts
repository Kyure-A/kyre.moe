import { notFound } from "@rshono/core/server";
import { isSiteLang } from "./i18n";

export const requireSiteLang = (lang: string) => {
  if (!isSiteLang(lang)) notFound();
  return lang;
};
