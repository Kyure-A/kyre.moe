import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";
import FadeTransition from "@/shared/ui/FadeTransition/FadeTransition";

const styles = {
  center: css({
    width: "full",
    height: "full",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  textFallback: css({
    width: "full",
    height: "full",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "rotator",
    color: "text.primary",
  }),
};

// dynamic import すればコードが独立したチャンクに分離され、初期バンドルサイズが削減されるらしい
const ASCIIText = dynamic(() => import("@/shared/ui/ASCIIText/ASCIIText"), {
  ssr: false,
  loading: () => <div className={styles.center} />,
});

type FadeTextRotatorProps = {
  texts?: string[];
  interval?: number;
  fadeDuration?: number;
  asciiFontSize?: number;
  textFontSize?: number;
  asciiMaxFps?: number;
  asciiStartDelayMs?: number;
  asciiStartOnIdle?: boolean;
  asciiEnabled?: boolean;
  active?: boolean;
};

export const FadeTextRotator = ({
  texts = ["キュレェ", "Kyure_A"],
  interval = 5000,
  fadeDuration = 300,
  asciiFontSize = 12,
  textFontSize = 20,
  asciiMaxFps = 60,
  asciiStartDelayMs = 0,
  asciiStartOnIdle = false,
  asciiEnabled = true,
  active = true,
}: FadeTextRotatorProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  // フェードアウト中のロゴだけ描画ループを生かし、完全に隠れたら止める
  const [fadingIndex, setFadingIndex] = useState<number | null>(null);
  const prevIndexRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [active, interval, texts.length]);

  useEffect(() => {
    if (prevIndexRef.current === activeIndex) return;
    setFadingIndex(prevIndexRef.current);
    prevIndexRef.current = activeIndex;
    const timer = setTimeout(() => setFadingIndex(null), fadeDuration + 100);
    return () => clearTimeout(timer);
  }, [activeIndex, fadeDuration]);

  return (
    <FadeTransition
      activeIndex={activeIndex}
      duration={fadeDuration}
      blur={false}
    >
      {texts.map((text, index) =>
        asciiEnabled ? (
          <ASCIIText
            key={text}
            text={text}
            asciiFontSize={asciiFontSize}
            textFontSize={textFontSize}
            maxFps={asciiMaxFps}
            startDelayMs={asciiStartDelayMs}
            startOnIdle={asciiStartOnIdle}
            active={active && (index === activeIndex || index === fadingIndex)}
          />
        ) : (
          <div key={text} className={styles.textFallback}>
            {text}
          </div>
        ),
      )}
    </FadeTransition>
  );
};

export default FadeTextRotator;
