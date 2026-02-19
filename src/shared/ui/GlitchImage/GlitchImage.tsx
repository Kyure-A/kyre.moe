import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

interface GlitchBlock {
  id: string;
  top: string;
  height: string;
  offsetX: string;
  offsetY: string;
}

interface RgbShift {
  red: string;
  blue: string;
}

interface GlitchLine {
  id: string;
  top: number;
  height: number;
  offsetX: number;
  offsetY: number;
  skew: number;
  scaleX: number;
  opacity: number;
  blur: number;
  glow: number;
  colorLine: boolean;
  blendMode: "screen" | "difference" | "lighten";
  backgroundImage: string;
}

interface RandomState {
  seed: number;
}

// Pure function: returns next state and random value
const nextRandom = (state: RandomState): [RandomState, number] => {
  const nextSeed = (state.seed * 1103515245 + 12345) & 0x7fffffff;
  return [{ seed: nextSeed }, nextSeed / 0x7fffffff];
};

// Generate RGB shift purely
const generateRgbShift = (
  state: RandomState,
  intensity: number,
): [RandomState, RgbShift] => {
  const [s1, shiftX] = nextRandom(state);
  const [s2, shiftY] = nextRandom(s1);
  const scaledX = shiftX * intensity * 15;
  const scaledY = shiftY * intensity * 8;
  return [
    s2,
    {
      red: `${scaledX}px ${scaledY}px`,
      blue: `${-scaledX}px ${-scaledY}px`,
    },
  ];
};

// Generate glitch blocks purely
const generateGlitchBlocks = (
  state: RandomState,
  count: number,
  intensity: number,
): [RandomState, GlitchBlock[]] => {
  let currentState = state;
  const blocks: GlitchBlock[] = [];
  for (let i = 0; i < count; i += 1) {
    const [s1, heightVal] = nextRandom(currentState);
    const [s2, topVal] = nextRandom(s1);
    const [s3, offsetXVal] = nextRandom(s2);
    const [s4, offsetYVal] = nextRandom(s3);
    const blockId = `${topVal.toFixed(4)}-${heightVal.toFixed(4)}-${offsetXVal.toFixed(4)}-${offsetYVal.toFixed(4)}`;
    blocks.push({
      id: blockId,
      top: `${topVal * 100}%`,
      height: `${heightVal * 30 + 5}px`,
      offsetX: `${(offsetXVal - 0.5) * 2 * intensity * 40}px`,
      offsetY: `${(offsetYVal - 0.5) * 2 * intensity * 15}px`,
    });
    currentState = s4;
  }
  return [currentState, blocks];
};

// Generate glitch lines purely
const generateGlitchLines = (
  state: RandomState,
  count: number,
  intensity: number,
): [RandomState, GlitchLine[]] => {
  let currentState = state;
  const lines: GlitchLine[] = [];
  for (let i = 0; i < count; i += 1) {
    const [s1, topVal] = nextRandom(currentState);
    const [s2, heightVal] = nextRandom(s1);
    const [s3, offsetXVal] = nextRandom(s2);
    const [s4, offsetYVal] = nextRandom(s3);
    const [s5, skewVal] = nextRandom(s4);
    const [s6, scaleXVal] = nextRandom(s5);
    const [s7, opacityVal] = nextRandom(s6);
    const [s8, blurVal] = nextRandom(s7);
    const [s9, glowVal] = nextRandom(s8);
    const [s10, colorLineVal] = nextRandom(s9);
    const [s11, blendVal] = nextRandom(s10);

    const colorLine = colorLineVal < 0.5;
    const lineId = `${topVal.toFixed(4)}-${heightVal.toFixed(4)}-${offsetXVal.toFixed(4)}-${offsetYVal.toFixed(4)}-${skewVal.toFixed(4)}-${scaleXVal.toFixed(4)}-${opacityVal.toFixed(4)}-${blurVal.toFixed(4)}-${glowVal.toFixed(4)}-${colorLineVal.toFixed(4)}-${blendVal.toFixed(4)}`;
    lines.push({
      id: lineId,
      top: topVal * 100,
      height: heightVal * (intensity * 6 + 1) + 1,
      offsetX: (offsetXVal - 0.5) * intensity * 90,
      offsetY: (offsetYVal - 0.5) * intensity * 8,
      skew: (skewVal - 0.5) * intensity * 8,
      scaleX: 0.6 + scaleXVal * 0.8,
      opacity: 0.25 + opacityVal * 0.65,
      blur: blurVal * 0.8,
      glow: glowVal * 10 * intensity,
      colorLine,
      blendMode: colorLine
        ? "screen"
        : blendVal > 0.5
          ? "difference"
          : "lighten",
      backgroundImage: colorLine
        ? "linear-gradient(90deg, rgba(0, 0, 0, 0), rgba(0, 255, 255, 0.85), rgba(255, 0, 255, 0.85), rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0))"
        : "linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.2))",
    });
    currentState = s11;
  }
  return [currentState, lines];
};

// Generate invert clip purely
const generateInvertClip = (state: RandomState): [RandomState, string] => {
  const [s1, v1] = nextRandom(state);
  const [s2, v2] = nextRandom(s1);
  return [s2, `inset(${v1 * 70}% 0 ${v2 * 70}% 0)`];
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

@keyframes glitch-line-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes glitch-scan-shift {
  0%, 100% { background-position: 0 0; }
  50% { background-position: 0 -3px; }
}
`.trim();

/**
 * GlitchImage Component
 *
 * A component that wraps an image and applies an intense horror-style glitch effect
 * with specified interval and probability.
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
}: GlitchImageProps): JSX.Element => {
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [glitchSeed, setGlitchSeed] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const normalizedIntensity = Math.max(1, Math.min(10, intensity)) / 10;

  const triggerGlitch = useCallback(() => {
    if (!active) return;

    if (Math.random() * 100 <= probability) {
      setGlitchSeed(Date.now());
      setIsGlitching(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsGlitching(false);
        timeoutRef.current = null;
      }, glitchDuration);
    }
  }, [active, probability, glitchDuration]);

  useEffect(() => {
    if (!active) return;

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
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [active, interval, startDelayMs, triggerGlitch]);

  // Pre-compute all random values once per glitch cycle using pure functions
  const glitchData = useMemo(() => {
    if (!isGlitching) return null;

    const initialState: RandomState = { seed: glitchSeed };
    const [s1, rgbShift] = generateRgbShift(initialState, normalizedIntensity);

    const blockCount = Math.floor(2 + normalizedIntensity * 6);
    const [s3, glitchBlocks] = generateGlitchBlocks(
      s1,
      blockCount,
      normalizedIntensity,
    );

    const lineCount = Math.floor(6 + normalizedIntensity * 18);
    const [s4, glitchLines] = generateGlitchLines(
      s3,
      lineCount,
      normalizedIntensity,
    );

    const [, invertClip] = generateInvertClip(s4);

    return {
      rgbShift,
      glitchBlocks,
      glitchLines,
      invertClip,
    };
  }, [isGlitching, glitchSeed, normalizedIntensity]);

  const prismaticStrength = Math.max(0, Math.min(1, coolNoiseStrength));
  const maskSize = maskScale === 1 ? "100% 100%" : `${maskScale * 100}% auto`;

  const maskStyle: CSSProperties | undefined = maskSrc
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
    : undefined;
  const effectsMaskStyle: CSSProperties = maskStyle ?? {};

  return (
    <div className="relative overflow-hidden">
      <style>{GLITCH_KEYFRAMES}</style>
      {/* Original image - visible but may flicker */}
      <div
        className="relative transition-opacity duration-100"
        style={{
          animation:
            isGlitching && glitchData
              ? "glitch-original-flicker 110ms steps(1, end) infinite"
              : undefined,
        }}
      >
        {children}
      </div>

      {/* Horror glitch effect layers */}
      {isGlitching && glitchData && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Ambient dark noise */}
          {ambientNoiseStrength > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                ...effectsMaskStyle,
                opacity: ambientNoiseStrength * normalizedIntensity,
                mixBlendMode: "multiply",
                backgroundImage:
                  "radial-gradient(circle at center, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.72) 55%, rgba(0, 0, 0, 0) 85%), url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                backgroundSize: "cover, cover",
                backgroundBlendMode: "multiply",
              }}
            />
          )}

          {/* Color channel separation - red */}
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              opacity: 0.7,
              filter:
                "brightness(1.5) contrast(1.3) hue-rotate(0deg) saturate(1.5)",
              transform: `translate(${glitchData.rgbShift.red})`,
            }}
          >
            {children}
          </div>

          {/* Color channel separation - blue */}
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              opacity: 0.7,
              filter:
                "brightness(1.5) contrast(1.3) hue-rotate(240deg) saturate(1.5)",
              transform: `translate(${glitchData.rgbShift.blue})`,
            }}
          >
            {children}
          </div>

          {/* Inverted section for horror effect */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.3 * normalizedIntensity * 10,
              filter: "invert(1) hue-rotate(180deg) contrast(1.2)",
              clipPath: glitchData.invertClip,
            }}
          >
            {children}
          </div>

          {/* Distorted blocks */}
          {glitchData.glitchBlocks.map((block) => (
            <div
              key={block.id}
              className="absolute left-0 w-full overflow-hidden"
              style={{
                top: block.top,
                height: block.height,
                transform: `translate(${block.offsetX}, ${block.offsetY})`,
              }}
            >
              <div style={{ marginTop: `-${block.top}` }}>{children}</div>
            </div>
          ))}

          {/* Noise + scanline layers */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={effectsMaskStyle}
          >
            {/* Sharp horizontal glitch lines */}
            {glitchData.glitchLines.map((line, index) => (
              <div
                key={line.id}
                className="absolute left-0 right-0"
                style={{
                  top: `${line.top}%`,
                  height: `${line.height}px`,
                  transform: `translate(${line.offsetX}px, ${line.offsetY}px) skewX(${line.skew}deg) scaleX(${line.scaleX})`,
                  opacity: line.opacity,
                  mixBlendMode: line.blendMode,
                  backgroundImage: line.backgroundImage,
                  backgroundSize: "200% 100%",
                  backgroundPosition: `${(index * 19) % 100}% 50%`,
                  filter: `blur(${line.blur}px)`,
                  boxShadow: line.colorLine
                    ? `0 0 ${line.glow}px rgba(0, 255, 255, 0.7)`
                    : `0 0 ${line.glow}px rgba(255, 255, 255, 0.4)`,
                  animation:
                    "glitch-line-flicker 120ms steps(2, end) infinite, glitch-line-shift 180ms steps(2, end) infinite",
                  animationDelay: `${(index % 4) * 24}ms`,
                }}
              />
            ))}

            {/* Noise overlay */}
            <div
              className="absolute inset-0 mix-blend-overlay"
              style={{
                opacity: 0.4 * normalizedIntensity,
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                backgroundSize: "cover",
              }}
            />

            {/* Prismatic noise */}
            {prismaticStrength > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: prismaticStrength * normalizedIntensity,
                  mixBlendMode: "screen",
                  filter: "contrast(1.5) saturate(2.1) hue-rotate(12deg)",
                  backgroundImage:
                    "linear-gradient(120deg, rgba(0, 255, 255, 0.5), rgba(255, 0, 255, 0.5), rgba(255, 210, 0, 0.18)), url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                  backgroundBlendMode: "soft-light",
                  backgroundSize: "200% 200%, cover",
                }}
              />
            )}

            {/* VHS-like scan lines */}
            <div
              className="absolute inset-0 pointer-events-none"
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
                animation: "glitch-scan-shift 120ms steps(2, end) infinite",
              }}
            />

            {/* Vignette effect */}
            <div
              className="absolute inset-0 pointer-events-none"
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
      )}
    </div>
  );
};

export default GlitchImage;
