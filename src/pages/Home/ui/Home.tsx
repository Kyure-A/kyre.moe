"use client";

import dynamic from "next/dynamic";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import useDockItems from "@/shared/hooks/useDockItems";
import { srcPath } from "@/shared/lib/path";
import GlitchImage from "@/shared/ui/GlitchImage/GlitchImage";
import OrbitDock from "@/shared/ui/OrbitDock/OrbitDock";

const BackgroundShader = dynamic(
	() => import("@/shared/ui/Background/Background"),
	{
		ssr: false,
		loading: () => <div className="w-full h-full" />,
	},
);

const FadeTextRotator = dynamic(
	() => import("@/pages/Home/ui/FadeTextRotator"),
	{
		ssr: false,
		loading: () => <div className="w-full" />,
	},
);

export default function Home() {
	const items = useDockItems();
	const orbitItems = useMemo(
		() =>
			items.filter((item) =>
				typeof item.label === "string" ? item.label !== "Home" : true,
			),
		[items],
	);
	const [orbitRotation, setOrbitRotation] = useState(0);
	const [orbitHovered, setOrbitHovered] = useState(false);
	const [orbitDragging, setOrbitDragging] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [useWebp, setUseWebp] = useState(process.env.NODE_ENV === "production");
	const orbitVars = {
		"--home-orbit-size": "clamp(300px, 86vmin, 760px)",
		"--home-orbit-icon": "clamp(56px, 12vmin, 96px)",
		"--home-orbit-gap": "clamp(8px, 2.4vmin, 16px)",
	} as CSSProperties;
	const orbitPaused = orbitHovered && !orbitDragging;
	const shaderMaxFps = 24;
	const shaderResolution = isMobile ? 0.65 : 1;
	const asciiMaxFps = 24;
	const startDelayMs = isMobile ? 450 : 200;
	const heroWidth = 2305;
	const heroHeight = 4776;
	const heroStyle: CSSProperties = {
		width: "min(60vw, 1000px)",
		height: "auto",
		aspectRatio: "2305 / 4776",
		display: "block",
	};

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
		<div
			className="relative w-screen h-screen overflow-hidden"
			style={orbitVars}
		>
			<div className="absolute w-screen h-screen z-0">
				<BackgroundShader
					pixelFilter={250}
					fogDensity={0.3}
					isRotate={false}
					pulseFrequency={0.05}
					color1="#272822"
					color2="#F92672"
					color3="#000000"
					maxFps={shaderMaxFps}
					resolutionScale={shaderResolution}
					startDelayMs={startDelayMs}
					startOnIdle
				/>
			</div>
			<div className="absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2">
				<OrbitDock
					items={orbitItems}
					layer="back"
					showDecorations
					speed={9}
					rotation={orbitRotation}
					size="var(--home-orbit-size)"
					paused={orbitPaused}
				/>
			</div>
			<div className="absolute flex flex-col z-10 pt-16 inset-0 ">
				<div className="flex flex-col mb-6 z-20">
					<FadeTextRotator
						asciiMaxFps={asciiMaxFps}
						asciiStartDelayMs={startDelayMs}
						asciiStartOnIdle
					/>
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
								width={heroWidth}
								height={heroHeight}
								loading="eager"
								decoding="async"
								fetchPriority="high"
								style={heroStyle}
							/>
						</picture>
					</GlitchImage>
				</div>
			</div>
			<div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
				<OrbitDock
					items={orbitItems}
					layer="front"
					showDecorations={false}
					speed={9}
					rotation={orbitRotation}
					onRotate={setOrbitRotation}
					dragEnabled
					size="var(--home-orbit-size)"
					paused={orbitPaused}
					onHoverChange={setOrbitHovered}
					onDragChange={setOrbitDragging}
				/>
			</div>
		</div>
	);
}
