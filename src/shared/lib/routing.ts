import { HTTPException } from "hono/http-exception";
import { isSiteLang } from "./i18n";

export const requireSiteLang = (lang: string) => {
  if (!isSiteLang(lang)) notFound();
  return lang;
};

export function notFound(): never {
  throw new HTTPException(404);
}
