import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

interface GlitchImageProps {
	/** The image element to apply the glitch effect to */
	children: ReactNode;
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
}

interface GlitchBlock {
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

/**
 * GlitchImage Component
 *
 * A component that wraps an image and applies an intense horror-style glitch effect
 * with specified interval and probability.
 * Uses the most extreme glitch effect for maximum horror impact while still keeping
 * the original image recognizable.
 */
const GlitchImage = ({
	children,
	interval = 5,
	probability = 20,
	glitchDuration = 500,
	active = true,
	intensity = 5,
}: GlitchImageProps): JSX.Element => {
	const [isGlitching, setIsGlitching] = useState<boolean>(false);
	const [glitchType, setGlitchType] = useState<number>(3);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Normalize intensity to a scale (higher than before for horror effect)
	const normalizedIntensity = Math.max(1, Math.min(10, intensity)) / 10;

	// Function to apply glitch effect
	const triggerGlitch = useCallback(() => {
		if (!active) return;

		// Check probability
		if (Math.random() * 100 <= probability) {
			// Always use the most intense glitch type (type 3)
			setGlitchType(3);
			setIsGlitching(true);

			// Clear any existing timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Set timeout to remove glitch effect
			timeoutRef.current = setTimeout(() => {
				setIsGlitching(false);
				timeoutRef.current = null;
			}, glitchDuration);
		}
	}, [active, probability, glitchDuration]);

	// Setup interval to check for glitch
	useEffect(() => {
		if (active) {
			// Initial check after a short delay
			const initialTimeout = setTimeout(() => {
				triggerGlitch();
			}, 1000);

			// Regular interval checks
			intervalRef.current = setInterval(triggerGlitch, interval * 1000);

			return () => {
				clearTimeout(initialTimeout);
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
				}
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}
			};
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [active, interval, triggerGlitch]);

	// Generate random clip path for partial visibility (horror effect)
	const getRandomClipPath = (): string => {
		const segments = 6;
		const points: string[] = [];
		const irregularity = normalizedIntensity * 30; // More irregular for horror effect

		for (let i = 0; i <= segments; i++) {
			const xOffset = (Math.random() - 0.5) * irregularity;
			const yOffset = (Math.random() - 0.5) * irregularity;
			points.push(
				`${(i / segments) * 100 + xOffset}% ${Math.random() * 100 + yOffset}%`,
			);
		}

		return `polygon(${points.join(", ")})`;
	};

	// Generate RGB shift values - more pronounced for horror effect
	const getRgbShift = (): RgbShift => {
		const shiftX = Math.random() * normalizedIntensity * 15;
		const shiftY = Math.random() * normalizedIntensity * 8;
		return {
			red: `${shiftX}px ${shiftY}px`,
			blue: `${-shiftX}px ${-shiftY}px`,
			green: `${shiftY}px ${-shiftX / 2}px`,
		};
	};

	// Generate glitch blocks - creates displaced sections of the image
	const generateGlitchBlocks = (): GlitchBlock[] => {
		const blockCount = Math.floor(2 + normalizedIntensity * 6);
		const blocks: GlitchBlock[] = [];

		for (let i = 0; i < blockCount; i++) {
			const height = Math.random() * 30 + 5; // Taller blocks
			const top = Math.random() * 100;
			const offsetX = (Math.random() - 0.5) * 2 * normalizedIntensity * 40; // Larger offset
			const offsetY = (Math.random() - 0.5) * 2 * normalizedIntensity * 15; // Vertical offset

			blocks.push({
				top: `${top}%`,
				height: `${height}px`,
				offsetX: `${offsetX}px`,
				offsetY: `${offsetY}px`,
			});
		}

		return blocks;
	};

	const rgbShift = getRgbShift();
	const clipPath = getRandomClipPath();
	const glitchBlocks = generateGlitchBlocks();

	// Determine visibility of original image - flicker effect
	const originalOpacity =
		isGlitching && glitchType === 3 ? (Math.random() > 0.7 ? "0.7" : "1") : "1";

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
			{isGlitching && (
				<div className="absolute inset-0 pointer-events-none">
					{/* Color channel separation - more pronounced */}
					<div
						className="absolute inset-0 mix-blend-screen"
						style={{
							opacity: 0.7, // Higher opacity
							filter:
								"brightness(1.5) contrast(1.3) hue-rotate(0deg) saturate(1.5)",
							transform: `translate(${rgbShift.red})`,
							clipPath: glitchType === 0 ? clipPath : "none", // Only apply clip path for type 0
						}}
					>
						{children}
					</div>

					<div
						className="absolute inset-0 mix-blend-screen"
						style={{
							opacity: 0.7, // Higher opacity
							filter:
								"brightness(1.5) contrast(1.3) hue-rotate(240deg) saturate(1.5)",
							transform: `translate(${rgbShift.blue})`,
							clipPath: glitchType === 0 ? clipPath : "none",
						}}
					>
						{children}
					</div>

					{/* Inverted section for horror effect */}
					{(glitchType === 1 || glitchType === 3) && (
						<div
							className="absolute inset-0"
							style={{
								opacity: 0.3 * normalizedIntensity * 10,
								filter: "invert(1) hue-rotate(180deg) contrast(1.2)",
								clipPath: `inset(${Math.random() * 70}% 0 ${Math.random() * 70}% 0)`,
							}}
						>
							{children}
						</div>
					)}

					{/* Distorted blocks - creates "sliced" sections of the image */}
					{(glitchType === 2 || glitchType === 3) &&
						glitchBlocks.map((block, index) => (
							<div
								key={index}
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

					{/* Sharp horizontal glitch lines - brighter for horror */}
					{Array.from({ length: Math.floor(3 + normalizedIntensity * 7) }).map(
						(_, index) => {
							const top = Math.random() * 100;
							const height = Math.random() * normalizedIntensity * 4 + 1;
							const offsetX = (Math.random() - 0.5) * normalizedIntensity * 30;

							return (
								<div
									key={`line-${index}`}
									className="absolute left-0 right-0 bg-white mix-blend-lighten"
									style={{
										top: `${top}%`,
										height: `${height}px`,
										transform: `translateX(${offsetX}px)`,
										opacity: 0.8,
									}}
								/>
							);
						},
					)}

					{/* Noise overlay - stronger for horror effect */}
					<div
						className="absolute inset-0 mix-blend-overlay"
						style={{
							opacity: 0.3 * normalizedIntensity,
							backgroundImage:
								"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
							backgroundSize: "cover",
						}}
					/>

					{/* VHS-like scan lines */}
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							backgroundImage: `repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, ${0.15 * normalizedIntensity}),
                rgba(0, 0, 0, ${0.15 * normalizedIntensity}) 1px,
                transparent 1px,
                transparent 2px
              )`,
						}}
					/>

					{/* Vignette effect for horror mood */}
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
			)}
		</div>
	);
};

export default GlitchImage;
