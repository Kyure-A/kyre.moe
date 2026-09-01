"use client";

import { useEffect, useLayoutEffect, useState } from "react";

type Props = {
  className: string;
  title: string;
  uri: string;
};

const HatenaStarContainer = ({ className, title, uri }: Props) => {
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

  if (!isMounted) return null;

  return (
    <div
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
