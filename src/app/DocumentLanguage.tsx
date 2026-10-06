"use client";

import { useEffect } from "react";
import { usePathname } from "@/shared/hooks/usePathname";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";

export default function DocumentLanguage() {
  const pathname = usePathname();
  const lang = getLangFromPath(pathname) ?? DEFAULT_LANG;
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
