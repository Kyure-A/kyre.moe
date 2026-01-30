"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const handleChange = () => setIsMobile(mq.matches);
    handleChange();
    if (mq.addEventListener) {
      mq.addEventListener("change", handleChange);
      return () => mq.removeEventListener("change", handleChange);
    }
    mq.addListener(handleChange);
    return () => mq.removeListener(handleChange);
  }, []);

  return isMobile;
};

export default useIsMobile;
