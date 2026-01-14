"use client";

import { DockItemData } from "@/shared/hooks/useDockItems";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";

export type OrbitDockProps = {
	items: DockItemData[];
	className?: string;
	size?: number | string;
	radius?: number | string;
	speed?: number;
	startAngle?: number;
	tiltX?: number;
	tiltZ?: number;
	layer?: "front" | "back";
	showDecorations?: boolean;
	rotation?: number;
	onRotate?: (rotation: number) => void;
	dragEnabled?: boolean;
	paused?: boolean;
	onHoverChange?: (hovered: boolean) => void;
	onDragChange?: (dragging: boolean) => void;
};

export default function OrbitDock({
	items,
	className = "",
	size,
	radius,
	speed,
	startAngle = -90,
	tiltX = 64,
	tiltZ = -20,
	layer = "front",
	showDecorations = true,
	rotation,
	onRotate,
	dragEnabled = false,
	paused = false,
	onHoverChange,
	onDragChange,
}: OrbitDockProps) {
	const [internalRotation, setInternalRotation] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [isPressing, setIsPressing] = useState(false);
	const suppressClickRef = useRef(false);
	const hoverStateRef = useRef(false);
	const rotationValue = rotation ?? internalRotation;
	const setRotation = onRotate ?? setInternalRotation;
	const rootRef = useRef<HTMLDivElement>(null);
	const dragState = useRef({
		active: false,
		dragged: false,
		captured: false,
		pointerId: -1,
		pressedIndex: -1,
		startX: 0,
		startY: 0,
		baseAngle: 0,
		baseRotation: 0,
	});
	const duration = speed ?? 34;
	const sizeValue = typeof size === "number" ? `${size}px` : size;
	const radiusValue = typeof radius === "number" ? `${radius}px` : radius;
	const speedValue = `${duration}s`;
	const tiltXRad = (tiltX * Math.PI) / 180;
	const ellipseScale = Math.max(0.2, Math.cos(tiltXRad));
	const normalizedRotation = ((rotationValue % 360) + 360) % 360;

	const rootStyle = {
		"--orbit-size": sizeValue ?? "min(76vmin, 760px)",
		"--orbit-radius":
			radiusValue ??
			"calc(var(--orbit-size) / 2 - (var(--orbit-icon-size) / 2) - var(--orbit-icon-gap))",
		"--orbit-speed": speedValue,
		"--orbit-start": `calc(${startAngle}deg + ${normalizedRotation}deg)`,
		"--orbit-tilt-x": `${tiltX}deg`,
		"--orbit-tilt-z": `${tiltZ}deg`,
		"--orbit-tilt-z-inv": `${-tiltZ}deg`,
		"--orbit-phase": "0s",
		"--orbit-ellipse-y": `${ellipseScale}`,
		"--orbit-ellipse-inv": `${1 / ellipseScale}`,
	} as CSSProperties;

	const getAngle = (clientX: number, clientY: number) => {
		const rect = rootRef.current?.getBoundingClientRect();
		if (!rect) return 0;
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const dx = clientX - centerX;
		const dy = clientY - centerY;
		const tiltZRad = (tiltZ * Math.PI) / 180;
		const cosZ = Math.cos(-tiltZRad);
		const sinZ = Math.sin(-tiltZRad);
		const rx = dx * cosZ - dy * sinZ;
		const ry = dx * sinZ + dy * cosZ;
		const correctedY = ellipseScale === 0 ? ry : ry / ellipseScale;
		return (Math.atan2(correctedY, rx) * 180) / Math.PI;
	};

	const normalizeDelta = (delta: number) => {
		let value = delta;
		while (value > 180) value -= 360;
		while (value < -180) value += 360;
		return value;
	};

	const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!dragEnabled || layer !== "front") return;
		if (event.button !== 0) return;
		dragState.current.active = true;
		dragState.current.dragged = false;
		dragState.current.captured = false;
		setIsPressing(true);
		setIsDragging(false);
		dragState.current.pointerId = event.pointerId;
		dragState.current.startX = event.clientX;
		dragState.current.startY = event.clientY;
		const target = event.target as HTMLElement | null;
		const button = target?.closest<HTMLButtonElement>("[data-orbit-index]");
		dragState.current.pressedIndex =
			button?.dataset.orbitIndex !== undefined
				? Number(button.dataset.orbitIndex)
				: -1;
		dragState.current.baseAngle = getAngle(event.clientX, event.clientY);
		dragState.current.baseRotation = rotationValue;
	};

	const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!dragEnabled || layer !== "front") return;
		if (!dragState.current.active) return;
		const dx = event.clientX - dragState.current.startX;
		const dy = event.clientY - dragState.current.startY;
		const distance = Math.hypot(dx, dy);
		const currentAngle = getAngle(event.clientX, event.clientY);
		const delta = normalizeDelta(currentAngle - dragState.current.baseAngle);

		if (!dragState.current.dragged && distance < 6) {
			return;
		}

		dragState.current.dragged = true;
		if (!dragState.current.captured) {
			dragState.current.captured = true;
			event.currentTarget.setPointerCapture(event.pointerId);
		}
		if (!isDragging) {
			setIsDragging(true);
			onDragChange?.(true);
		}
		setRotation(dragState.current.baseRotation + delta);
		event.preventDefault();
	};

	const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!dragEnabled || layer !== "front") return;
		if (!dragState.current.active) return;
		dragState.current.active = false;
		setIsPressing(false);
		setIsDragging(false);
		if (dragState.current.captured) {
			event.currentTarget.releasePointerCapture(event.pointerId);
			dragState.current.captured = false;
		}
		if (!dragState.current.dragged && dragState.current.pressedIndex >= 0) {
			const index = dragState.current.pressedIndex;
			const item = items[index];
			if (item) {
				suppressClickRef.current = true;
				item.onClick();
				window.setTimeout(() => {
					suppressClickRef.current = false;
				}, 0);
			}
		}
		dragState.current.pressedIndex = -1;
		if (dragState.current.dragged) {
			window.setTimeout(() => {
				dragState.current.dragged = false;
			}, 0);
		} else {
			dragState.current.dragged = false;
		}
		if (isDragging) {
			onDragChange?.(false);
		}
	};

	const handlePointerOver = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!onHoverChange || layer !== "front") return;
		const target = event.target as HTMLElement | null;
		const isItem = target?.closest<HTMLButtonElement>("[data-orbit-index]");
		if (!isItem) return;
		if (!hoverStateRef.current) {
			hoverStateRef.current = true;
			onHoverChange(true);
		}
	};

	const handlePointerOut = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!onHoverChange || layer !== "front") return;
		const target = event.target as HTMLElement | null;
		const leftItem = target?.closest<HTMLButtonElement>("[data-orbit-index]");
		if (!leftItem) return;
		const related = event.relatedTarget as HTMLElement | null;
		const stillOnItem =
			related?.closest<HTMLButtonElement>("[data-orbit-index]");
		if (!stillOnItem && hoverStateRef.current) {
			hoverStateRef.current = false;
			onHoverChange(false);
		}
	};

	return (
		<div
			ref={rootRef}
			className={`orbit-dock ${className}`}
			style={rootStyle}
			data-layer={layer}
			data-draggable={dragEnabled ? "true" : "false"}
			data-dragging={isDragging ? "true" : "false"}
			data-pressing={isPressing ? "true" : "false"}
			data-paused={paused && !isDragging ? "true" : "false"}
			aria-hidden={layer === "back"}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			onPointerOver={handlePointerOver}
			onPointerOut={handlePointerOut}
		>
			{showDecorations && (
				<div className="orbit-dock__plane" aria-hidden="true">
					<div className="orbit-dock__ring" />
					<div className="orbit-dock__scan" />
				</div>
			)}
			<div className="orbit-dock__items" aria-hidden="false">
				{items.map((item, index) => {
					const delay = -(index / items.length) * duration;
					const label = typeof item.label === "string" ? item.label : undefined;

					return (
						<button
							key={`${label ?? "item"}-${index}`}
							type="button"
							data-orbit-index={index}
							className={`orbit-dock__item group pointer-events-auto ${item.className ?? ""}`}
							style={
								{
									"--orbit-delay": `${delay}s`,
								} as CSSProperties
							}
							aria-label={label}
							title={label}
							onClick={(event) => {
								if (suppressClickRef.current) {
									suppressClickRef.current = false;
									event.preventDefault();
									event.stopPropagation();
									return;
								}
								if (dragState.current.dragged) {
									event.preventDefault();
									event.stopPropagation();
									return;
								}
								item.onClick();
							}}
						>
							<span className="orbit-dock__billboard flex items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/90 shadow-[0_0_18px_rgba(249,38,114,0.22)] transition duration-200 group-hover:border-white/40 group-hover:text-white group-focus-visible:border-white/40 group-focus-visible:text-white">
								{item.icon}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
