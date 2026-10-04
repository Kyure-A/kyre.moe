import {
  type Child,
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "hono/jsx";
import { flushSync } from "hono/jsx/dom";

const NAVIGATION_EVENT = "kyre:navigation";
const HISTORY_KEY = "kyreNavigationKey";
const NavigationContext = createContext({
  pathname: "/",
});

export const NavigationProvider = ({
  pathname,
  children,
}: {
  pathname: string;
  children: Child;
}) => (
  <NavigationContext.Provider value={{ pathname }}>
    {children}
  </NavigationContext.Provider>
);

const subscribe = (callback: () => void) => {
  window.addEventListener(NAVIGATION_EVENT, callback);
  return () => window.removeEventListener(NAVIGATION_EVENT, callback);
};

type NavigateOptions = { replace?: boolean; history?: boolean };
type PageChange = () => void | Promise<void>;
let changePage: PageChange | undefined;
let pendingRequest: AbortController | undefined;
let currentHref = "";
let currentKey = "";
let activeTransition: ViewTransition | undefined;
const scrollPositions = new Map<string, [number, number]>();

const historyKey = () => {
  let key = window.history.state?.[HISTORY_KEY] as string | undefined;
  if (!key) {
    key = crypto.randomUUID();
    window.history.replaceState(
      { ...window.history.state, [HISTORY_KEY]: key },
      "",
    );
  }
  return key;
};

const saveScroll = () => {
  if (currentKey)
    scrollPositions.set(currentKey, [window.scrollX, window.scrollY]);
};

const announceNavigation = () =>
  window.dispatchEvent(new Event(NAVIGATION_EVENT));

const restoreScroll = (url: URL, position?: [number, number]) => {
  if (position) {
    window.scrollTo({
      left: position[0],
      top: position[1],
      behavior: "instant",
    });
    return;
  }
  if (url.hash) {
    let id = url.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* malformed URL fragments remain literal */
    }
    const target =
      document.getElementById(id) ?? document.getElementsByName(id)[0];
    if (target) {
      target.scrollIntoView({ behavior: "instant" });
      return;
    }
  }
  window.scrollTo({ left: 0, top: 0, behavior: "instant" });
};

const updateMetadata = (next: Document) => {
  document.title = next.title;
  document.documentElement.lang = next.documentElement.lang;
  const selector =
    'meta[name], meta[property], link[rel="canonical"], link[rel="alternate"], script[type="application/ld+json"]';
  document.head.querySelectorAll(selector).forEach((element) => {
    element.remove();
  });
  next.head.querySelectorAll(selector).forEach((element) => {
    document.head.appendChild(document.importNode(element, true));
  });
};

export const navigate = async (href: string, options: NavigateOptions = {}) => {
  if (typeof window === "undefined") return;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin || !changePage) {
    if (options.replace) window.location.replace(url.href);
    else window.location.assign(url.href);
    return;
  }
  const previous = new URL(currentHref || window.location.href);
  saveScroll();
  pendingRequest?.abort();
  if (url.pathname === previous.pathname && url.search === previous.search) {
    if (!options.history && url.href !== window.location.href) {
      const key = options.replace ? currentKey : crypto.randomUUID();
      window.history[options.replace ? "replaceState" : "pushState"](
        { [HISTORY_KEY]: key },
        "",
        url.href,
      );
    }
    if (
      options.history &&
      window.history.state?.[HISTORY_KEY] === currentKey &&
      url.href !== previous.href
    ) {
      // Native fragment navigation can copy the prior entry's history state.
      window.history.replaceState(
        { ...window.history.state, [HISTORY_KEY]: crypto.randomUUID() },
        "",
      );
    }
    currentKey = historyKey();
    currentHref = url.href;
    announceNavigation();
    restoreScroll(
      url,
      options.history ? scrollPositions.get(currentKey) : undefined,
    );
    return;
  }

  const request = new AbortController();
  pendingRequest = request;
  try {
    const response = await fetch(url.href, {
      signal: request.signal,
      headers: { Accept: "text/html", "X-Kyre-Navigation": "1" },
    });
    if (!response.ok && response.status !== 404)
      throw new Error(`Navigation failed: ${response.status}`);
    if (!response.headers.get("content-type")?.includes("text/html"))
      throw new Error("Expected an HTML page");
    const next = new DOMParser().parseFromString(
      await response.text(),
      "text/html",
    );
    const nextContent = next.getElementById("page-content");
    const content = document.getElementById("page-content");
    if (!nextContent || !content) throw new Error("Missing page content");
    if (request.signal.aborted) return;
    const destination = new URL(response.url || url.href);
    destination.hash = url.hash;
    if (destination.origin !== window.location.origin)
      throw new Error("Cross-origin redirect");
    const onPageChange = changePage;
    const update = async () => {
      if (request.signal.aborted) return;
      saveScroll();
      if (!options.history) {
        const key = options.replace ? currentKey : crypto.randomUUID();
        window.history[options.replace ? "replaceState" : "pushState"](
          { [HISTORY_KEY]: key },
          "",
          destination.href,
        );
      }
      currentKey = historyKey();
      currentHref = destination.href;
      content.replaceWith(document.importNode(nextContent, true));
      const chrome = document.getElementById("app-chrome");
      if (chrome)
        chrome.hidden = next.getElementById("app-chrome")?.hidden ?? false;
      updateMetadata(next);
      document.body.dataset.pathname = destination.pathname;
      document.body.dataset.shell = next.body.dataset.shell;
      flushSync(announceNavigation);
      await onPageChange?.();
      if (request.signal.aborted) return;
      restoreScroll(
        destination,
        options.history ? scrollPositions.get(currentKey) : undefined,
      );
      const main = document.getElementById("page-content");
      if (main && !options.history && !destination.hash) {
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      }
    };
    activeTransition?.skipTransition();
    if (
      document.startViewTransition &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const transition = document.startViewTransition(update);
      activeTransition = transition;
      // Unsupported shared elements can reject ready while the page update succeeds.
      void transition.ready.catch(() => {});
      await transition.updateCallbackDone;
      void transition.finished
        .catch(() => {})
        .finally(() => {
          if (activeTransition === transition) activeTransition = undefined;
        });
    } else {
      await update();
    }
  } catch (error) {
    if (
      request.signal.aborted ||
      (error instanceof DOMException && error.name === "AbortError")
    )
      return;
    if (options.replace) window.location.replace(url.href);
    else window.location.assign(url.href);
  } finally {
    if (pendingRequest === request) pendingRequest = undefined;
  }
};

const router = {
  push: (href: string) => navigate(href),
  replace: (href: string) => navigate(href, { replace: true }),
  back: () => window.history.back(),
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  const href = useSyncExternalStore(
    subscribe,
    () => window.location.href,
    () => context.pathname,
  );
  const url = useMemo(() => new URL(href, "https://kyre.moe"), [href]);
  return { url, router };
};

export const installNavigation = (onPageChange: PageChange) => {
  changePage = onPageChange;
  currentHref = window.location.href;
  currentKey = historyKey();
  const previousRestoration = window.history.scrollRestoration;
  window.history.scrollRestoration = "manual";
  saveScroll();
  const handleClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (
      !link ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self") ||
      link.rel.includes("external") ||
      link.hasAttribute("data-native-navigation")
    )
      return;
    const url = new URL(link.href, window.location.href);
    if (
      url.origin !== window.location.origin ||
      !["http:", "https:"].includes(url.protocol)
    )
      return;
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.hash
    )
      return;
    event.preventDefault();
    void navigate(url.href);
  };
  const handlePopState = () => {
    void navigate(window.location.href, { history: true });
  };
  const handleHashChange = () => {
    if (
      currentHref !== window.location.href &&
      window.history.state?.[HISTORY_KEY] === currentKey
    ) {
      window.history.replaceState(
        { ...window.history.state, [HISTORY_KEY]: crypto.randomUUID() },
        "",
      );
    }
    currentHref = window.location.href;
    currentKey = historyKey();
    announceNavigation();
  };
  document.addEventListener("click", handleClick);
  window.addEventListener("popstate", handlePopState);
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("scroll", saveScroll, { passive: true });
  return () => {
    pendingRequest?.abort();
    changePage = undefined;
    document.removeEventListener("click", handleClick);
    window.removeEventListener("popstate", handlePopState);
    window.removeEventListener("hashchange", handleHashChange);
    window.removeEventListener("scroll", saveScroll);
    window.history.scrollRestoration = previousRestoration;
  };
};
