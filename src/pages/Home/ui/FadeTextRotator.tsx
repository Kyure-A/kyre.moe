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

export const FadeTextRotator = ({
	texts = ["キュレェ", "Kyure_A"],
	interval = 5000,
	fadeDuration = 300,
	asciiFontSize = 12,
	textFontSize = 20,
	asciiMaxFps = 60,
	asciiStartDelayMs = 0,
	asciiStartOnIdle = false,
}) => {
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setActiveIndex((prevIndex) => (prevIndex + 1) % texts.length);
		}, interval);

		return () => clearInterval(timer);
	}, [interval, texts.length]);

	return (
		<FadeTransition
			activeIndex={activeIndex}
			duration={fadeDuration}
			blur={false}
		>
			{texts.map((text, index) => (
				<ASCIIText
					key={index}
					text={text}
					asciiFontSize={asciiFontSize}
					textFontSize={textFontSize}
					maxFps={asciiMaxFps}
					startDelayMs={asciiStartDelayMs}
					startOnIdle={asciiStartOnIdle}
				/>
			))}
		</FadeTransition>
	);
};

export default FadeTextRotator;
