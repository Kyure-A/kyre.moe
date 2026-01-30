import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import FadeTransition from "@/shared/ui/FadeTransition/FadeTransition";

// dynamic import すればコードが独立したチャンクに分離され、初期バンドルサイズが削減されるらしい
const ASCIIText = dynamic(() => import("@/shared/ui/ASCIIText/ASCIIText"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" />
  ),
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
  active = true,
}: FadeTextRotatorProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [active, interval, texts.length]);

  return (
    <FadeTransition
      activeIndex={activeIndex}
      duration={fadeDuration}
      blur={false}
    >
      {texts.map((text) => (
        <ASCIIText
          key={text}
          text={text}
          asciiFontSize={asciiFontSize}
          textFontSize={textFontSize}
          maxFps={asciiMaxFps}
          startDelayMs={asciiStartDelayMs}
          startOnIdle={asciiStartOnIdle}
          active={active}
        />
      ))}
    </FadeTransition>
  );
};

export default FadeTextRotator;
