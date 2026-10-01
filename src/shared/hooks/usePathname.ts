"use client";

import { useNavigation } from "@rshono/core/client";
import { useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};

export const usePathname = () => {
  const { url } = useNavigation();
  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => url.pathname,
  );
  // GitHub Pages serves the exported /404 document at the requested missing URL.
  return url.pathname === "/404" ? pathname : url.pathname;
};
