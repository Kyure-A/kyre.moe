"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { srcPath } from "@/shared/lib/path";
import GlitchImage from "@/shared/ui/GlitchImage/GlitchImage";

const HERO_STYLE: CSSProperties = {
  width: "min(60vw, 1000px)",
  height: "auto",
  aspectRatio: "2305 / 4776",
  display: "block",
};

const HERO_WIDTH = 2305;
const HERO_HEIGHT = 4776;

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [useWebp, setUseWebp] = useState(process.env.NODE_ENV === "production");

  useEffect(() => {
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(max-width: 768px)")
        : null;
    if (!mq) return;
    const handleChange = () => setIsMobile(mq.matches);
    handleChange();
    if (mq.addEventListener) {
      mq.addEventListener("change", handleChange);
      return () => mq.removeEventListener("change", handleChange);
    }
    mq.addListener(handleChange);
    return () => mq.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    setUseWebp(!isLocalhost);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute flex flex-col z-10 pt-16 inset-0">
        {/* FadeTextRotator は App で同じレイアウトで描画されるため、同じスペースを確保 */}
        <div className="flex flex-col mb-6 z-20">
          {/* 空のスペース - App 側の FadeTextRotator と同じ高さを取る */}
          <div style={{ height: "auto" }} />
        </div>
        <div className="flex flex-col items-center center">
          <GlitchImage
            maskSrc={srcPath(
              useWebp
                ? isMobile
                  ? "/kyure_a-640.webp"
                  : "/kyure_a-1000.webp"
                : "/kyure_a.png",
            )}
            startDelayMs={1000}
            maskScale={1}
            ambientNoiseStrength={0.12}
            coolNoiseStrength={0.5}
            interval={1}
            probability={30}
            intensity={5}
          >
            <picture>
              {useWebp && (
                <source
                  type="image/webp"
                  srcSet={`${srcPath("/kyure_a-640.webp")} 640w, ${srcPath("/kyure_a-1000.webp")} 1000w, ${srcPath("/kyure_a-1600.webp")} 1600w, ${srcPath("/kyure_a.webp")} 2305w`}
                  sizes="(max-width: 768px) 60vw, 1000px"
                />
              )}
              <img
                alt="Kyure_A"
                src={srcPath("/kyure_a.png")}
                width={HERO_WIDTH}
                height={HERO_HEIGHT}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                style={HERO_STYLE}
              />
            </picture>
          </GlitchImage>
        </div>
      </div>
    </div>
  );
}
