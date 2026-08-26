import {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { css } from "styled-system/css";

interface GlitchImageProps {
  /** The image element to apply the glitch effect to */
  children: ReactNode;
  /** Optional mask image to clip non-image glitch layers */
  maskSrc?: string;
  /** Mask scale (1 = original size, >1 expands) */
  maskScale?: number;
  /** Ambient noise intensity (0-1). Applies to full area without whitening */
  ambientNoiseStrength?: number;
  /** Prismatic noise intensity (0-1). Applied within masked area */
  coolNoiseStrength?: number;
  /** Interval in seconds to check for applying the glitch effect (default: 5) */
  interval?: number;
  /** Probability (0-100) percentage chance of glitch occurring at each interval (default: 20) */
  probability?: number;
  /** Duration of the glitch effect in milliseconds (default: 500ms) */
  glitchDuration?: number;
  /** Whether the glitch effect is active (default: true) */
  active?: boolean;
  /** Intensity of the glitch effect (1-10) (default: 5) */
  intensity?: number;
  /** Delay before starting glitch checks (ms) (default: 1000) */
  startDelayMs?: number;
}

const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")";
const PRISMATIC_NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")";

const styles = {
  root: css({
    position: "relative",
    overflow: "hidden",
  }),
  original: css({
    position: "relative",
    transitionProperty: "common",
    transitionDuration: "fast",
  }),
  layer: css({
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
  }),
  absolute: css({
    position: "absolute",
    inset: "0",
  }),
  screen: css({
    position: "absolute",
    inset: "0",
    mixBlendMode: "screen",
  }),
  block: css({
    position: "absolute",
    left: "0",
    width: "full",
    overflow: "hidden",
  }),
  line: css({
    position: "absolute",
    left: "0",
    right: "0",
  }),
  overlay: css({
    position: "absolute",
    inset: "0",
    mixBlendMode: "overlay",
  }),
};

const GLITCH_KEYFRAMES = `
@keyframes glitch-original-flicker {
  0%, 50%, 100% { opacity: 1; }
  25% { opacity: 0.7; }
  75% { opacity: 0.85; }
}

@keyframes glitch-line-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.82; }
}
`.trim();

const ORIGINAL_FLICKER_ANIMATION =
  "glitch-original-flicker 110ms steps(1, end) infinite";
const LINE_FLICKER_ANIMATION =
  "glitch-line-flicker 120ms steps(2, end) infinite";

/**
 * GlitchImage Component
 *
 * A component that wraps an image and applies an intense horror-style glitch effect
 * with specified interval and probability.
 *
 * パフォーマンスのため、エフェクト層は mount しっぱなしにして各バーストでは
 * opacity の切り替えとインラインスタイルの書き込みだけを行う。バーストごとに
 * DOM を作り直すと巨大画像のコピー数枚分のレイヤー生成・ラスタライズが毎回
 * 走ってしまう。表示の ON/OFF を共通の親の opacity でなく各レイヤー個別に
 * 行っているのは意図的: 親に opacity や will-change を与えると stacking
 * context が生まれ、mix-blend-mode の合成相手が原画像から切り離されて
 * 見た目が変わるため。
 */
const GlitchImage = ({
  children,
  maskSrc,
  maskScale = 1,
  ambientNoiseStrength = 0,
  coolNoiseStrength = 0,
  interval = 5,
  probability = 20,
  glitchDuration = 500,
  active = true,
  intensity = 5,
  startDelayMs = 1000,
}: GlitchImageProps): ReactElement => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibleRef = useRef(true);

  const originalRef = useRef<HTMLDivElement>(null);
  const effectsRootRef = useRef<HTMLDivElement>(null);
  const redRef = useRef<HTMLDivElement>(null);
  const blueRef = useRef<HTMLDivElement>(null);
  const invertRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blockInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const normalizedIntensity = Math.max(1, Math.min(10, intensity)) / 10;
  const blockCount = Math.floor(2 + normalizedIntensity * 4);
  const lineCount = Math.floor(4 + normalizedIntensity * 12);

  const clearGlitchTimeout = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  // 各レイヤーを非表示にしてアニメーションを止める(DOM は保持)
  const hideGlitch = useCallback(() => {
    const root = effectsRootRef.current;
    if (root) {
      for (const child of Array.from(root.children)) {
        (child as HTMLElement).style.opacity = "0";
      }
    }
    if (originalRef.current) {
      originalRef.current.style.animation = "";
    }
    for (const line of lineRefs.current) {
      if (line) line.style.animation = "none";
    }
  }, []);

  // バースト 1 回分の乱数値を常駐 DOM へ書き込み、レイヤーを表示する。
  // 各式の分布は旧実装(バーストごとに JSX を再生成していた頃)と同一
  const applyGlitch = useCallback(() => {
    const root = effectsRootRef.current;
    if (!root) return;

    const shiftX = Math.random() * normalizedIntensity * 15;
    const shiftY = Math.random() * normalizedIntensity * 8;
    if (redRef.current) {
      redRef.current.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
    }
    if (blueRef.current) {
      blueRef.current.style.transform = `translate(${-shiftX}px, ${-shiftY}px)`;
    }

    if (invertRef.current) {
      invertRef.current.style.clipPath = `inset(${Math.random() * 70}% 0 ${Math.random() * 70}% 0)`;
    }

    for (let i = 0; i < blockRefs.current.length; i += 1) {
      const block = blockRefs.current[i];
      const inner = blockInnerRefs.current[i];
      if (!block || !inner) continue;
      const topPct = Math.random() * 100;
      block.style.top = `${topPct}%`;
      block.style.height = `${Math.random() * 30 + 5}px`;
      block.style.transform = `translate(${(Math.random() - 0.5) * 2 * normalizedIntensity * 40}px, ${(Math.random() - 0.5) * 2 * normalizedIntensity * 15}px)`;
      inner.style.marginTop = `-${topPct}%`;
    }

    for (const line of lineRefs.current) {
      if (!line) continue;
      const colorLine = Math.random() < 0.5;
      const glow = Math.random() * 10 * normalizedIntensity;
      line.style.top = `${Math.random() * 100}%`;
      line.style.height = `${Math.random() * (normalizedIntensity * 6 + 1) + 1}px`;
      line.style.transform = `translate(${(Math.random() - 0.5) * normalizedIntensity * 90}px, ${(Math.random() - 0.5) * normalizedIntensity * 8}px) skewX(${(Math.random() - 0.5) * normalizedIntensity * 8}deg) scaleX(${0.6 + Math.random() * 0.8})`;
      line.style.opacity = `${0.25 + Math.random() * 0.65}`;
      line.style.mixBlendMode = colorLine
        ? "screen"
        : Math.random() > 0.5
          ? "difference"
          : "lighten";
      line.style.backgroundImage = colorLine
        ? "linear-gradient(90deg, rgba(0, 0, 0, 0), rgba(0, 255, 255, 0.85), rgba(255, 0, 255, 0.85), rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0))"
        : "linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.2))";
      line.style.filter = `blur(${Math.random() * 0.8}px)`;
      line.style.boxShadow = colorLine
        ? `0 0 ${glow}px rgba(0, 255, 255, 0.7)`
        : `0 0 ${glow}px rgba(255, 255, 255, 0.4)`;
      line.style.animation = LINE_FLICKER_ANIMATION;
    }

    for (const child of Array.from(root.children)) {
      const el = child as HTMLElement;
      el.style.opacity = el.dataset.baseOpacity ?? "1";
    }
    if (originalRef.current) {
      originalRef.current.style.animation = ORIGINAL_FLICKER_ANIMATION;
    }
  }, [normalizedIntensity]);

  const triggerGlitch = useCallback(() => {
    if (!active || !visibleRef.current) return;

    if (Math.random() * 100 <= probability) {
      applyGlitch();

      clearGlitchTimeout();
      timeoutRef.current = setTimeout(() => {
        hideGlitch();
        timeoutRef.current = null;
      }, glitchDuration);
    }
  }, [
    active,
    probability,
    glitchDuration,
    applyGlitch,
    hideGlitch,
    clearGlitchTimeout,
  ]);

  useEffect(() => {
    if (!active) {
      clearGlitchTimeout();
      hideGlitch();
      return;
    }

    const startTimer = setTimeout(
      () => {
        triggerGlitch();
        intervalRef.current = setInterval(triggerGlitch, interval * 1000);
      },
      Math.max(0, startDelayMs),
    );

    return () => {
      clearTimeout(startTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearGlitchTimeout();
    };
  }, [
    active,
    interval,
    startDelayMs,
    triggerGlitch,
    clearGlitchTimeout,
    hideGlitch,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (!visibleRef.current) {
        clearGlitchTimeout();
        hideGlitch();
      }
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearGlitchTimeout, hideGlitch]);

  const prismaticStrength = Math.max(0, Math.min(1, coolNoiseStrength));
  const maskSize = maskScale === 1 ? "100% 100%" : `${maskScale * 100}% auto`;

  const effectsMaskStyle: CSSProperties = useMemo(
    () =>
      maskSrc
        ? {
            WebkitMaskImage: `url(${maskSrc})`,
            WebkitMaskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskSize: maskSize,
            maskImage: `url(${maskSrc})`,
            maskMode: "alpha",
            maskPosition: "center",
            maskRepeat: "no-repeat",
            maskSize,
          }
        : {},
    [maskSrc, maskSize],
  );

  const invertOpacity = 0.3 * normalizedIntensity * 10;

  return (
    <div className={styles.root}>
      <style>{GLITCH_KEYFRAMES}</style>
      {/* Original image - visible but may flicker */}
      <div ref={originalRef} className={styles.original}>
        {children}
      </div>

      {/* Horror glitch effect layers - 常駐、バースト中のみ各レイヤーを表示 */}
      <div ref={effectsRootRef} className={styles.layer}>
        {/* Ambient dark noise */}
        {ambientNoiseStrength > 0 && (
          <div
            className={styles.layer}
            data-base-opacity={ambientNoiseStrength * normalizedIntensity}
            style={{
              ...effectsMaskStyle,
              opacity: 0,
              mixBlendMode: "multiply",
              backgroundImage: `radial-gradient(circle at center, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.72) 55%, rgba(0, 0, 0, 0) 85%), ${NOISE_TEXTURE}`,
              backgroundSize: "cover, cover",
              backgroundBlendMode: "multiply",
              willChange: "opacity",
            }}
          />
        )}

        {/* Color channel separation - red */}
        <div
          ref={redRef}
          className={styles.screen}
          data-base-opacity={0.7}
          style={{
            opacity: 0,
            filter:
              "brightness(1.5) contrast(1.3) hue-rotate(0deg) saturate(1.5)",
            willChange: "transform, opacity",
          }}
        >
          {children}
        </div>

        {/* Color channel separation - blue */}
        <div
          ref={blueRef}
          className={styles.screen}
          data-base-opacity={0.7}
          style={{
            opacity: 0,
            filter:
              "brightness(1.5) contrast(1.3) hue-rotate(240deg) saturate(1.5)",
            willChange: "transform, opacity",
          }}
        >
          {children}
        </div>

        {/* Inverted section for horror effect */}
        <div
          ref={invertRef}
          className={styles.absolute}
          data-base-opacity={invertOpacity}
          style={{
            opacity: 0,
            filter: "invert(1) hue-rotate(180deg) contrast(1.2)",
            willChange: "opacity",
          }}
        >
          {children}
        </div>

        {/* Distorted blocks */}
        {Array.from({ length: blockCount }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: 個数固定の常駐レイヤーで並べ替えは起きない
            key={i}
            ref={(el) => {
              blockRefs.current[i] = el;
            }}
            className={styles.block}
            style={{ opacity: 0, willChange: "transform, opacity" }}
          >
            <div
              ref={(el) => {
                blockInnerRefs.current[i] = el;
              }}
            >
              {children}
            </div>
          </div>
        ))}

        {/* Noise + scanline layers */}
        <div
          className={styles.layer}
          style={{ ...effectsMaskStyle, opacity: 0, willChange: "opacity" }}
        >
          {/* Sharp horizontal glitch lines */}
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: 個数固定の常駐レイヤーで並べ替えは起きない
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className={styles.line}
              style={{
                backgroundSize: "200% 100%",
                backgroundPosition: `${(i * 19) % 100}% 50%`,
                animationDelay: `${(i % 4) * 24}ms`,
              }}
            />
          ))}

          {/* Noise overlay */}
          <div
            className={styles.overlay}
            style={{
              opacity: 0.4 * normalizedIntensity,
              backgroundImage: NOISE_TEXTURE,
              backgroundSize: "cover",
            }}
          />

          {/* Prismatic noise */}
          {prismaticStrength > 0 && (
            <div
              className={styles.layer}
              style={{
                opacity: prismaticStrength * normalizedIntensity,
                mixBlendMode: "screen",
                filter: "contrast(1.5) saturate(2.1) hue-rotate(12deg)",
                backgroundImage: `linear-gradient(120deg, rgba(0, 255, 255, 0.5), rgba(255, 0, 255, 0.5), rgba(255, 210, 0, 0.18)), ${PRISMATIC_NOISE_TEXTURE}`,
                backgroundBlendMode: "soft-light",
                backgroundSize: "200% 200%, cover",
              }}
            />
          )}

          {/* VHS-like scan lines */}
          <div
            className={styles.layer}
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, ${0.22 * normalizedIntensity}),
                rgba(0, 0, 0, ${0.22 * normalizedIntensity}) 1px,
                transparent 1px,
                transparent 3px
              )`,
              backgroundPosition: "0 0",
              mixBlendMode: "soft-light",
              opacity: 0.35 + 0.2 * normalizedIntensity,
              filter: `contrast(${1.1 + normalizedIntensity * 0.6})`,
            }}
          />

          {/* Vignette effect */}
          <div
            className={styles.layer}
            style={{
              background: `radial-gradient(
                ellipse at center,
                transparent 50%,
                rgba(0, 0, 0, ${0.4 * normalizedIntensity}) 100%
              )`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GlitchImage;
