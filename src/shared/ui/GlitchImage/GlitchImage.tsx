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
  green: string;
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

// Generate clip path points purely
const generateClipPath = (
  state: RandomState,
  segments: number,
  irregularity: number,
): [RandomState, string] => {
  const [finalState, points] = Array.from({ length: segments + 1 }).reduce<
    [RandomState, string[]]
  >(
    ([currentState, pts], _, i) => {
      const [s1, xOffset] = nextRandom(currentState);
      const [s2, yOffset] = nextRandom(s1);
      const [s3, yPos] = nextRandom(s2);
      const point = `${(i / segments) * 100 + (xOffset - 0.5) * irregularity}% ${yPos * 100 + (yOffset - 0.5) * irregularity}%`;
      return [s3, [...pts, point]];
    },
    [state, []],
  );
  return [finalState, `polygon(${points.join(", ")})`];
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
      green: `${scaledY}px ${-scaledX / 2}px`,
    },
  ];
};

// Generate glitch blocks purely
const generateGlitchBlocks = (
  state: RandomState,
  count: number,
  intensity: number,
): [RandomState, GlitchBlock[]] =>
  Array.from({ length: count }).reduce<[RandomState, GlitchBlock[]]>(
    ([currentState, blocks]) => {
      const [s1, heightVal] = nextRandom(currentState);
      const [s2, topVal] = nextRandom(s1);
      const [s3, offsetXVal] = nextRandom(s2);
      const [s4, offsetYVal] = nextRandom(s3);
      const blockId = `${topVal.toFixed(4)}-${heightVal.toFixed(4)}-${offsetXVal.toFixed(4)}-${offsetYVal.toFixed(4)}`;
      const block: GlitchBlock = {
        id: blockId,
        top: `${topVal * 100}%`,
        height: `${heightVal * 30 + 5}px`,
        offsetX: `${(offsetXVal - 0.5) * 2 * intensity * 40}px`,
        offsetY: `${(offsetYVal - 0.5) * 2 * intensity * 15}px`,
      };
      return [s4, [...blocks, block]];
    },
    [state, []],
  );

// Generate glitch lines purely
const generateGlitchLines = (
  state: RandomState,
  count: number,
  intensity: number,
): [RandomState, GlitchLine[]] =>
  Array.from({ length: count }).reduce<[RandomState, GlitchLine[]]>(
    ([currentState, lines]) => {
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
      const line: GlitchLine = {
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
      };
      return [s11, [...lines, line]];
    },
    [state, []],
  );

// Generate invert clip purely
const generateInvertClip = (state: RandomState): [RandomState, string] => {
  const [s1, v1] = nextRandom(state);
  const [s2, v2] = nextRandom(s1);
  return [s2, `inset(${v1 * 70}% 0 ${v2 * 70}% 0)`];
};

const FLICKER_OPACITIES = [1, 0.7, 1, 0.85] as const;

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
  const [flickerPhase, setFlickerPhase] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const normalizedIntensity = Math.max(1, Math.min(10, intensity)) / 10;

  // Use requestAnimationFrame for smoother flicker updates
  useEffect(() => {
    if (!isGlitching) return;

    const jitterInterval = Math.max(40, 120 - normalizedIntensity * 60);

    const tick = (time: number): void => {
      if (time - lastTimeRef.current >= jitterInterval) {
        setFlickerPhase((p) => (p + 1) % 4);
        lastTimeRef.current = time;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isGlitching, normalizedIntensity]);

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

    const [s1, clipPath] = generateClipPath(
      initialState,
      6,
      normalizedIntensity * 30,
    );
    const [s2, rgbShift] = generateRgbShift(s1, normalizedIntensity);

    const blockCount = Math.floor(2 + normalizedIntensity * 6);
    const [s3, glitchBlocks] = generateGlitchBlocks(
      s2,
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
      clipPath,
      rgbShift,
      glitchBlocks,
      glitchLines,
      invertClip,
    };
  }, [isGlitching, glitchSeed, normalizedIntensity]);

  const prismaticStrength = Math.max(0, Math.min(1, coolNoiseStrength));
  const maskSize = maskScale === 1 ? "contain" : `${maskScale * 100}% auto`;

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

  const maskedStyle: CSSProperties = maskStyle ?? {};

  const ambientMaskStyle: CSSProperties = {
    WebkitMaskImage:
      "radial-gradient(circle at center, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.9) 55%, rgba(0, 0, 0, 0) 85%)",
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskSize: "cover",
    maskImage:
      "radial-gradient(circle at center, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.9) 55%, rgba(0, 0, 0, 0) 85%)",
    maskPosition: "center",
    maskRepeat: "no-repeat",
    maskSize: "cover",
  };

  const originalOpacity =
    isGlitching && glitchData ? FLICKER_OPACITIES[flickerPhase] : 1;

  return (
    <div className="relative overflow-hidden">
      {/* Original image - visible but may flicker */}
      <div
        className="relative transition-opacity duration-100"
        style={{ opacity: originalOpacity }}
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
                ...ambientMaskStyle,
                opacity: ambientNoiseStrength * normalizedIntensity,
                mixBlendMode: "multiply",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                backgroundSize: "cover",
              }}
            />
          )}

          {/* Color channel separation - red */}
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              ...maskedStyle,
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
              ...maskedStyle,
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
              ...maskedStyle,
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
                ...maskedStyle,
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
            style={maskStyle}
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
                  opacity: line.opacity * (flickerPhase % 2 === 0 ? 0.85 : 1),
                  mixBlendMode: line.blendMode,
                  backgroundImage: line.backgroundImage,
                  backgroundSize: "200% 100%",
                  backgroundPosition: `${(flickerPhase * 25 + index * 19) % 100}% 50%`,
                  filter: `blur(${line.blur}px)`,
                  boxShadow: line.colorLine
                    ? `0 0 ${line.glow}px rgba(0, 255, 255, 0.7)`
                    : `0 0 ${line.glow}px rgba(255, 255, 255, 0.4)`,
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
                backgroundPosition: `0 ${((flickerPhase * 3) % 6) - 3}px`,
                mixBlendMode: "soft-light",
                opacity:
                  0.35 +
                  0.2 * normalizedIntensity +
                  (flickerPhase % 2 === 0 ? 0.1 : 0),
                filter: `contrast(${1.1 + normalizedIntensity * 0.6})`,
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
