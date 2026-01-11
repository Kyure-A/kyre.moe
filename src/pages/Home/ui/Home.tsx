"use client";

import Image from "next/image";
import { useState } from "react";
import { srcPath } from "@/shared/lib/path";
import Balatro from "@/shared/ui/Balatro/Balatro";
import MysteriousShader from "@/shared/ui/Mys/Mys";
import GlitchImage from "../../../shared/ui/GlitchImage/GlitchImage";
import FadeTextRotator from "./FadeTextRotator";
import OrbitDock from "@/shared/ui/OrbitDock/OrbitDock";
import useDockItems from "@/shared/hooks/useDockItems";

export default function Home() {
	const items = useDockItems();
	const [orbitRotation, setOrbitRotation] = useState(0);

	return (
		<div className="relative w-screen h-screen overflow-hidden">
			<div className="absolute w-screen h-screen z-0">
				<MysteriousShader
					pixelFilter={250}
					fogDensity={0.3}
					isRotate={false}
					pulseFrequency={0.05}
					color1="#272822"
					color2="#F92672"
					color3="#000000"
				/>
			</div>
			<div className="absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2">
				<OrbitDock
					items={items}
					layer="back"
					showDecorations
					speed={9}
					rotation={orbitRotation}
				/>
			</div>
			<div className="absolute flex flex-col z-10 pt-16 inset-0 ">
				<div className="flex flex-col mb-6 z-20">
					<FadeTextRotator />
				</div>
				<div className="flex flex-col items-center center">
					<GlitchImage interval={1} probability={10} intensity={5}>
						<Image
							alt="Kyure_A"
							src={srcPath("/kyure_a.png")}
							width={1000}
							height={1000}
						/>
					</GlitchImage>
				</div>
			</div>
			<div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
				<OrbitDock
					items={items}
					layer="front"
					showDecorations={false}
					speed={9}
					rotation={orbitRotation}
					onRotate={setOrbitRotation}
					dragEnabled
				/>
			</div>
		</div>
	);
}
