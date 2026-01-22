"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
	useState,
} from "react";
import useDockItems from "@/shared/hooks/useDockItems";
import HeaderControls from "@/shared/ui/HeaderControls/HeaderControls";
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

const ORBIT_VARS: CSSProperties = {
	"--home-orbit-size": "clamp(300px, 86vmin, 760px)",
	"--home-orbit-icon": "clamp(56px, 12vmin, 96px)",
	"--home-orbit-gap": "clamp(8px, 2.4vmin, 16px)",
} as CSSProperties;

const SHADER_MAX_FPS = 24;
const ASCII_MAX_FPS = 24;

type Props = { children: ReactNode };

function isHomePath(pathname: string | null): boolean {
	if (!pathname) return false;
	return pathname === "/ja" || pathname === "/en" || pathname === "/";
}

export default function App({ children }: Props) {
	const pathname = usePathname();
	const isHome = isHomePath(pathname);

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
	const [orbitHoveredIndex, setOrbitHoveredIndex] = useState<number | null>(
		null,
	);
	const [isMobile, setIsMobile] = useState(false);

	const orbitPaused = orbitHovered && !orbitDragging;
	const shaderResolution = isMobile ? 0.65 : 1;
	const startDelayMs = isMobile ? 450 : 200;

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

	// Home でのみ表示、ただしマウントは常に維持してアニメーション状態を保持
	const homeLayerStyle: CSSProperties = {
		visibility: isHome ? "visible" : "hidden",
		pointerEvents: isHome ? "auto" : "none",
	};

	return (
		<>
			<HeaderControls />

			{/* BackgroundShader - 常にマウント、Home でのみ表示 */}
			<div
				className="fixed inset-0 w-screen h-screen z-0"
				style={homeLayerStyle}
				aria-hidden={!isHome}
			>
				<BackgroundShader
					pixelFilter={250}
					fogDensity={0.3}
					isRotate={false}
					pulseFrequency={0.05}
					color1="#272822"
					color2="#F92672"
					color3="#000000"
					maxFps={SHADER_MAX_FPS}
					resolutionScale={shaderResolution}
					startDelayMs={startDelayMs}
					startOnIdle
				/>
			</div>

			{/* OrbitDock (back layer) - 常にマウント、Home でのみ表示 */}
			<div
				className="fixed left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2"
				style={{ ...ORBIT_VARS, ...homeLayerStyle }}
				aria-hidden={!isHome}
			>
				<OrbitDock
					items={orbitItems}
					layer="back"
					showDecorations
					speed={9}
					rotation={orbitRotation}
					size="var(--home-orbit-size)"
					paused={orbitPaused}
					hoveredIndex={orbitHoveredIndex}
				/>
			</div>

			{/* FadeTextRotator - 元の Home.tsx と同じレイアウト構造を再現、キャラ画像より前面 */}
			<div
				className="fixed inset-0 w-screen h-screen z-[15] overflow-hidden pointer-events-none"
				style={{ visibility: isHome ? "visible" : "hidden" }}
				aria-hidden={!isHome}
			>
				<div className="absolute flex flex-col pt-16 inset-0">
					<div className="flex flex-col mb-6 z-20 pointer-events-auto">
						<FadeTextRotator
							asciiMaxFps={ASCII_MAX_FPS}
							asciiStartDelayMs={startDelayMs}
							asciiStartOnIdle
						/>
					</div>
					{/* 画像のスペースを確保（実際の画像は children で描画） */}
					<div className="flex-1" />
				</div>
			</div>

			{/* OrbitDock (front layer) - 常にマウント、Home でのみ表示 */}
			<div
				className="fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
				style={{ ...ORBIT_VARS, ...homeLayerStyle }}
				aria-hidden={!isHome}
			>
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
					hoveredIndex={orbitHoveredIndex}
					onHoverIndexChange={setOrbitHoveredIndex}
					onHoverChange={setOrbitHovered}
					onDragChange={setOrbitDragging}
				/>
			</div>

			<main className="flex-1 flex flex-col justify-center items-center">
				{children}
			</main>
		</>
	);
}
