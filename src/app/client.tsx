import { type Child, useState } from "hono/jsx";
import { flushSync, render } from "hono/jsx/dom";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";
import { installNavigation, NavigationProvider } from "@/shared/lib/navigation";
import AppShell from "@/shared/ui/AppShell/AppShell";
import "./globals.css";

let homeContainer: HTMLElement | undefined;
let notFoundContainer: HTMLElement | undefined;
let disposeEnhancers = () => {};
let pageVersion = 0;
let setEffects: (children: Child) => void = () => {};
const PageEffects = () => {
  const [children, update] = useState<Child>(null);
  setEffects = (next) => flushSync(() => update(next));
  return <>{children}</>;
};

const initializePage = async () => {
  const version = ++pageVersion;
  disposeEnhancers();
  disposeEnhancers = () => {};
  const cleanups: Array<() => void> = [];
  const notFound = document.getElementById("not-found-content");
  if (notFound) {
    const lang = getLangFromPath(window.location.pathname) ?? DEFAULT_LANG;
    document.documentElement.lang = lang;
    document
      .querySelector('meta[property="og:locale"]')
      ?.setAttribute("content", lang === "ja" ? "ja_JP" : "en_US");
    if (notFoundContainer) {
      notFound.replaceWith(notFoundContainer);
    } else {
      const { default: NotFound } = await import(
        "@/pages/NotFound/ui/NotFound"
      );
      if (version !== pageVersion) return;
      notFoundContainer = notFound;
      render(
        <NavigationProvider pathname={window.location.pathname}>
          <NotFound />
        </NavigationProvider>,
        notFound,
      );
    }
  }
  const home = document.getElementById("home-content");
  if (home) {
    if (homeContainer) {
      home.replaceWith(homeContainer);
    } else {
      const { default: Home } = await import("@/pages/Home/ui/Home");
      if (version !== pageVersion) return;
      homeContainer = home;
      render(
        <NavigationProvider pathname={window.location.pathname}>
          <Home />
        </NavigationProvider>,
        home,
      );
    }
  }
  if (document.querySelector("[data-live-age]")) {
    const { enhanceLiveAge } = await import("@/pages/AboutMe/ui/LiveAgeText");
    if (version !== pageVersion) return;
    cleanups.push(enhanceLiveAge());
  }
  if (document.querySelector("article.blog-content")) {
    const [copy, twitter, youtube, hatena] = await Promise.all([
      import("@/shared/ui/CopyCodeBlock/CopyCodeBlock"),
      import("@/shared/ui/TwitterEmbed/TwitterEmbed"),
      import("@/shared/ui/YouTubeEmbed/YouTubeEmbed"),
      import("@/shared/ui/HatenaStar/HatenaStarContainer"),
    ]);
    if (version !== pageVersion) return;
    const effects = document.getElementById("page-effects");
    if (effects) {
      const Copy = copy.default;
      const Twitter = twitter.default;
      const YouTube = youtube.default;
      setEffects(
        <div key={version}>
          <Copy />
          <Twitter />
          <YouTube />
        </div>,
      );
      cleanups.push(() => setEffects(null));
    }
    cleanups.push(hatena.enhanceHatenaStars());
    // HTML scripts are inert after DOMParser; load Hatena for a first soft visit.
    if (
      !document.querySelector(
        'script[src="https://s.hatena.ne.jp/js/widget/star.js"]',
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://s.hatena.ne.jp/js/widget/star.js";
      script.async = true;
      script.onload = () =>
        document.dispatchEvent(new Event("hatena:star:requestrendering"));
      document.body.appendChild(script);
    }
  }
  if (version !== pageVersion) {
    cleanups.forEach((cleanup) => {
      cleanup();
    });
    return;
  }
  disposeEnhancers = () =>
    cleanups.forEach((cleanup) => {
      cleanup();
    });
};

const chrome = document.getElementById("app-chrome");
if (chrome) {
  render(
    <NavigationProvider pathname={window.location.pathname}>
      <AppShell />
    </NavigationProvider>,
    chrome,
  );
}
const effects = document.getElementById("page-effects");
if (effects) render(<PageEffects />, effects);
installNavigation(initializePage);
document.body.dataset.pathname = window.location.pathname;
void initializePage();
