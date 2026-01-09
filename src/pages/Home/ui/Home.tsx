"use client";

import Image from "next/image";
import { srcPath } from "@/shared/lib/path";
import Balatro from "@/shared/ui/Balatro/Balatro";
import MysteriousShader from "@/shared/ui/Mys/Mys";
import GlitchImage from "../../../shared/ui/GlitchImage/GlitchImage";
import FadeTextRotator from "./FadeTextRotator";

export default function Home() {
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
		</div>
	);
}
