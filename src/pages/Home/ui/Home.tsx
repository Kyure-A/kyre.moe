"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import useRuntimeProfile from "@/shared/hooks/useRuntimeProfile";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";
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
const DEFAULT_GLITCH_INTERVAL = 1;
const DEFAULT_GLITCH_PROBABILITY = 30;
const DEFAULT_GLITCH_INTENSITY = 5;
const DEFAULT_AMBIENT_NOISE_STRENGTH = 0.12;
const DEFAULT_COOL_NOISE_STRENGTH = 0.5;
const LOW_PERFORMANCE_GLITCH_INTERVAL = 1.8;
const LOW_PERFORMANCE_GLITCH_PROBABILITY = 18;
const LOW_PERFORMANCE_GLITCH_INTENSITY = 3;
const LOW_PERFORMANCE_AMBIENT_NOISE_STRENGTH = 0.08;
const LOW_PERFORMANCE_COOL_NOISE_STRENGTH = 0.32;

const Home = () => {
  const { lowPerformanceMode } = useRuntimeProfile();
  const pathname = usePathname();
  const lang = getLangFromPath(pathname) ?? DEFAULT_LANG;
  const [useWebp, setUseWebp] = useState(process.env.NODE_ENV === "production");
  const [glitchReady, setGlitchReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const idleRef = useRef<{ id: number; type: "idle" | "timeout" } | null>(null);

  const clearIdle = useCallback(() => {
    if (!idleRef.current || typeof window === "undefined") return;
    const { id, type } = idleRef.current;
    if (type === "idle" && "cancelIdleCallback" in window) {
      (
        window as Window & {
          cancelIdleCallback?: (handle: number) => void;
        }
      ).cancelIdleCallback?.(id);
    } else {
      window.clearTimeout(id);
    }
    idleRef.current = null;
  }, []);

  const scheduleGlitchReady = useCallback(() => {
    if (typeof window === "undefined") {
      setGlitchReady(true);
      return;
    }
    setGlitchReady((prev) => {
      if (prev) return prev;
      clearIdle();
      const start = () => setGlitchReady(true);
      if ("requestIdleCallback" in window) {
        const requestIdle = (
          window as Window & {
            requestIdleCallback?: (cb: IdleRequestCallback) => number;
          }
        ).requestIdleCallback;
        if (requestIdle) {
          const id = requestIdle(start);
          idleRef.current = { id, type: "idle" };
          return prev;
        }
      }
      const id = window.setTimeout(start, 0);
      idleRef.current = { id, type: "timeout" };
      return prev;
    });
  }, [clearIdle]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    setUseWebp(!isLocalhost);
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete) {
      scheduleGlitchReady();
      return;
    }

    const handleLoad = () => scheduleGlitchReady();
    img.addEventListener("load", handleLoad, { once: true });
    return () => {
      img.removeEventListener("load", handleLoad);
    };
  }, [scheduleGlitchReady]);

  useEffect(() => {
    return () => {
      clearIdle();
    };
  }, [clearIdle]);

  const glitchInterval = lowPerformanceMode
    ? LOW_PERFORMANCE_GLITCH_INTERVAL
    : DEFAULT_GLITCH_INTERVAL;
  const glitchProbability = lowPerformanceMode
    ? LOW_PERFORMANCE_GLITCH_PROBABILITY
    : DEFAULT_GLITCH_PROBABILITY;
  const glitchIntensity = lowPerformanceMode
    ? LOW_PERFORMANCE_GLITCH_INTENSITY
    : DEFAULT_GLITCH_INTENSITY;
  const ambientNoiseStrength = lowPerformanceMode
    ? LOW_PERFORMANCE_AMBIENT_NOISE_STRENGTH
    : DEFAULT_AMBIENT_NOISE_STRENGTH;
  const coolNoiseStrength = lowPerformanceMode
    ? LOW_PERFORMANCE_COOL_NOISE_STRENGTH
    : DEFAULT_COOL_NOISE_STRENGTH;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <h1 className="sr-only">{lang === "ja" ? "ホーム" : "Home"}</h1>
      <div className="absolute flex flex-col z-10 pt-16 inset-0">
        {/* FadeTextRotator は App で同じレイアウトで描画されるため、同じスペースを確保 */}
        <div className="flex flex-col mb-6 z-20">
          {/* 空のスペース - App 側の FadeTextRotator と同じ高さを取る */}
          <div style={{ height: "auto" }} />
        </div>
        <div className="flex flex-col items-center center">
          <GlitchImage
            maskSrc={srcPath("/kyure_a.png")}
            startDelayMs={1000}
            maskScale={1}
            ambientNoiseStrength={ambientNoiseStrength}
            coolNoiseStrength={coolNoiseStrength}
            interval={glitchInterval}
            probability={glitchProbability}
            intensity={glitchIntensity}
            active={glitchReady}
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
                ref={imgRef}
              />
            </picture>
          </GlitchImage>
        </div>
      </div>
    </div>
  );
};

export default Home;
