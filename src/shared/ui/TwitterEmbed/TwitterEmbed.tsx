"use client";

import { useEffect } from "react";
import { useTheme } from "@/shared/ui/ThemeProvider/ThemeProvider";

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
  const { theme } = useTheme();

  useEffect(() => {
    const embeds = Array.from(
      document.querySelectorAll<HTMLElement>(".twitter-tweet"),
    );
    if (embeds.length === 0) return;

    for (const embed of embeds) {
      embed.setAttribute("data-theme", theme);
    }

    loadTwitterWidgets();
  }, [theme]);

  return null;
};

export default TwitterEmbedEnhancer;
