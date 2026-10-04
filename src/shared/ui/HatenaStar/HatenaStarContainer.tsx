type Props = { className: string; title: string; uri: string };

const HatenaStarContainer = ({ className, title, uri }: Props) => (
  <div
    className={className}
    data-hatena-star-container=""
    data-hatena-star-profile-url-template="https://blog.hatena.ne.jp/{username}/"
    data-hatena-star-title={title}
    data-hatena-star-url={uri}
    data-hatena-star-variant="profile-icon"
  />
);

export const enhanceHatenaStars = () => {
  const containers = document.querySelectorAll<HTMLElement>(
    "[data-hatena-star-container]",
  );
  if (!containers.length) return () => {};
  const shadowObservers = new Map<ShadowRoot, MutationObserver>();
  const applyTheme = () => {
    const theme =
      document.documentElement.dataset.theme === "light" ? "light" : "dark";
    for (const container of containers) {
      const host = container.querySelector<HTMLElement>("[data-hatena-star]");
      const shadow = host?.shadowRoot;
      if (!shadow) continue;
      const iframe = shadow.querySelector("iframe");
      if (iframe) {
        iframe.style.backgroundColor = "transparent";
        iframe.style.colorScheme = theme;
        iframe.style.filter =
          theme === "dark"
            ? "invert(1) hue-rotate(180deg) brightness(1.7)"
            : "none";
      } else if (!shadowObservers.has(shadow)) {
        const observer = new MutationObserver(applyTheme);
        observer.observe(shadow, { childList: true, subtree: true });
        shadowObservers.set(shadow, observer);
      }
    }
  };
  const observers = Array.from(containers, (container) => {
    const observer = new MutationObserver(applyTheme);
    observer.observe(container, { childList: true, subtree: true });
    return observer;
  });
  document.addEventListener("kyre:theme", applyTheme);
  applyTheme();
  document.dispatchEvent(new Event("hatena:star:requestrendering"));
  return () => {
    observers.forEach((observer) => {
      observer.disconnect();
    });
    shadowObservers.forEach((observer) => {
      observer.disconnect();
    });
    document.removeEventListener("kyre:theme", applyTheme);
  };
};

export default HatenaStarContainer;
