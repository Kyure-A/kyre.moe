"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "@/shared/ui/ThemeProvider/ThemeProvider";

type Props = {
  className: string;
  title: string;
  uri: string;
};

const HatenaStarContainer = ({ className, title, uri }: Props) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const requestRendering = () => {
      document.dispatchEvent(new Event("hatena:star:requestrendering"));
    };

    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", requestRendering, {
        once: true,
      });
      return () =>
        window.removeEventListener("DOMContentLoaded", requestRendering);
    }

    requestRendering();
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    const container = containerRef.current;
    if (!container) return;

    let shadowObserver: MutationObserver | undefined;

    const applyTheme = () => {
      const host = container.querySelector<HTMLElement>("[data-hatena-star]");
      const shadowRoot = host?.shadowRoot;
      const iframe = shadowRoot?.querySelector<HTMLIFrameElement>("iframe");

      if (iframe) {
        iframe.style.backgroundColor = "transparent";
        iframe.style.colorScheme = theme;
        iframe.style.filter =
          theme === "dark"
            ? "invert(1) hue-rotate(180deg) brightness(1.7)"
            : "none";
        return;
      }

      if (shadowRoot && !shadowObserver) {
        shadowObserver = new MutationObserver(applyTheme);
        shadowObserver.observe(shadowRoot, { childList: true, subtree: true });
      }
    };

    const containerObserver = new MutationObserver(applyTheme);
    containerObserver.observe(container, { childList: true, subtree: true });
    applyTheme();

    return () => {
      containerObserver.disconnect();
      shadowObserver?.disconnect();
    };
  }, [isMounted, theme]);

  if (!isMounted) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      data-hatena-star-container=""
      data-hatena-star-profile-url-template="https://blog.hatena.ne.jp/{username}/"
      data-hatena-star-title={title}
      data-hatena-star-url={uri}
      data-hatena-star-variant="profile-icon"
    />
  );
};

export default HatenaStarContainer;
