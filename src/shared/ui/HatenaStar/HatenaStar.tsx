"use client";

import { useEffect } from "react";

const HATENA_STAR_SCRIPT_SRC = "https://s.hatena.ne.jp/js/HatenaStar.js";

type HatenaStarEntryNodeConfig = {
  uri?: string;
  title?: string;
  container?: string;
};

type HatenaStarSiteConfig = {
  entryNodes: Record<string, HatenaStarEntryNodeConfig>;
};

declare global {
  interface Window {
    Hatena?: {
      Star?: {
        SiteConfig?: HatenaStarSiteConfig;
        EntryLoader?: new () => unknown;
      };
    };
  }
}

const configureHatenaStar = () => {
  if (typeof window === "undefined") return;
  const hatena = (window.Hatena ??= {});
  const star = (hatena.Star ??= {});
  star.SiteConfig = {
    entryNodes: {
      "[data-hatena-entry]": {
        uri: "[data-hatena-uri]",
        title: "[data-hatena-title]",
        container: "[data-hatena-container]",
      },
    },
  };
};

const renderHatenaStar = () => {
  if (!window.Hatena?.Star?.EntryLoader) return;
  configureHatenaStar();
  new window.Hatena.Star.EntryLoader();
};

const loadHatenaStar = () => {
  if (typeof document === "undefined") return;
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${HATENA_STAR_SCRIPT_SRC}"]`,
  );
  if (existing) {
    renderHatenaStar();
    return;
  }

  configureHatenaStar();
  const script = document.createElement("script");
  script.src = HATENA_STAR_SCRIPT_SRC;
  script.async = true;
  script.onload = () => renderHatenaStar();
  document.body.appendChild(script);
};

type HatenaStarProps = {
  entryKey: string;
};

const HatenaStar = ({ entryKey }: HatenaStarProps) => {
  useEffect(() => {
    if (!document.querySelector("[data-hatena-entry]")) return;
    loadHatenaStar();
  }, [entryKey]);

  return null;
};

export default HatenaStar;
