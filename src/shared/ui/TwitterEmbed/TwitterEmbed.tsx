"use client";

import { useEffect } from "react";
import { DEFAULT_THEME, isSiteTheme } from "@/shared/lib/theme";

const TWITTER_SCRIPT_SRC = "https://platform.twitter.com/widgets.js";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

const loadTwitterWidgets = () => {
  if (typeof window === "undefined") return;
  if (document.querySelector(`script[src="${TWITTER_SCRIPT_SRC}"]`)) {
    window.twttr?.widgets?.load();
    return;
  }

  const script = document.createElement("script");
  script.src = TWITTER_SCRIPT_SRC;
  script.async = true;
  script.onload = () => window.twttr?.widgets?.load();
  document.body.appendChild(script);
};

const TwitterEmbedEnhancer = () => {
  useEffect(() => {
    const embeds = Array.from(
      document.querySelectorAll<HTMLElement>("blockquote.twitter-tweet"),
    );
    if (embeds.length === 0) return;

    // ThemeScript が起動時に設定した実テーマを widgets.js の処理前に反映する
    const domTheme = document.documentElement.dataset.theme;
    const theme = isSiteTheme(domTheme) ? domTheme : DEFAULT_THEME;

    for (const embed of embeds) {
      embed.setAttribute("data-theme", theme);
    }

    loadTwitterWidgets();
  }, []);

  return null;
};

export default TwitterEmbedEnhancer;
