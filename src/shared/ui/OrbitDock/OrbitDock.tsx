"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
import type { DockItemData } from "@/shared/ui/Dock/Dock";

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
}: OrbitDockProps) {
	const [internalRotation, setInternalRotation] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const rotationValue = rotation ?? internalRotation;
	const setRotation = onRotate ?? setInternalRotation;
	const rootRef = useRef<HTMLDivElement>(null);
	const dragState = useRef({
		active: false,
		dragged: false,
		pointerId: -1,
		startX: 0,
		startY: 0,
		baseAngle: 0,
		baseRotation: 0,
	});
	const duration = speed ?? 34;
	const sizeValue = typeof size === "number" ? `${size}px` : size;
	const radiusValue = typeof radius === "number" ? `${radius}px` : radius;
	const speedValue = `${duration}s`;

	const rootStyle = {
		"--orbit-size": sizeValue ?? "min(76vmin, 760px)",
		"--orbit-radius":
			radiusValue ?? "calc(var(--orbit-size) / 2 - 56px)",
		"--orbit-speed": speedValue,
		"--orbit-start": `${startAngle}deg`,
		"--orbit-tilt-x": `${tiltX}deg`,
		"--orbit-tilt-z": `${tiltZ}deg`,
		"--orbit-tilt-x-inv": `${-tiltX}deg`,
		"--orbit-tilt-z-inv": `${-tiltZ}deg`,
		"--orbit-phase": `${(-rotationValue / 360) * duration}s`,
	} as CSSProperties;

	const getAngle = (clientX: number, clientY: number) => {
		const rect = rootRef.current?.getBoundingClientRect();
		if (!rect) return 0;
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const dx = clientX - centerX;
		const dy = clientY - centerY;
		const tiltZRad = (tiltZ * Math.PI) / 180;
		const tiltXRad = (tiltX * Math.PI) / 180;
		const cosZ = Math.cos(-tiltZRad);
		const sinZ = Math.sin(-tiltZRad);
		const rx = dx * cosZ - dy * sinZ;
		const ry = dx * sinZ + dy * cosZ;
		const correctedY = Math.cos(tiltXRad) === 0 ? ry : ry / Math.cos(tiltXRad);
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
		setIsDragging(false);
		dragState.current.pointerId = event.pointerId;
		dragState.current.startX = event.clientX;
		dragState.current.startY = event.clientY;
		dragState.current.baseAngle = getAngle(event.clientX, event.clientY);
		dragState.current.baseRotation = rotationValue;
		event.currentTarget.setPointerCapture(event.pointerId);
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
		if (!isDragging) {
			setIsDragging(true);
		}
		setRotation(dragState.current.baseRotation + delta);
		event.preventDefault();
	};

	const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!dragEnabled || layer !== "front") return;
		if (!dragState.current.active) return;
		dragState.current.active = false;
		setIsDragging(false);
		event.currentTarget.releasePointerCapture(event.pointerId);
		if (dragState.current.dragged) {
			window.setTimeout(() => {
				dragState.current.dragged = false;
			}, 0);
		} else {
			dragState.current.dragged = false;
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
			aria-hidden={layer === "back"}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
		>
			<div className="orbit-dock__plane">
				{showDecorations && (
					<>
						<div className="orbit-dock__ring" aria-hidden="true" />
						<div className="orbit-dock__scan" aria-hidden="true" />
					</>
				)}
				<div className="orbit-dock__items" aria-hidden="false">
					{items.map((item, index) => {
						const delay = -(index / items.length) * duration;
						const label =
							typeof item.label === "string" ? item.label : undefined;

						return (
							<button
								key={`${label ?? "item"}-${index}`}
								type="button"
								className={`orbit-dock__item group pointer-events-auto ${item.className ?? ""}`}
								style={
									{
										"--orbit-delay": `${delay}s`,
									} as CSSProperties
								}
								aria-label={label}
								title={label}
								onClick={(event) => {
									if (dragState.current.dragged) {
										event.preventDefault();
										event.stopPropagation();
										return;
									}
									item.onClick();
								}}
							>
								<span className="orbit-dock__label pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/80 px-3 py-0.5 text-[10px] uppercase tracking-[0.32em] text-white/80 opacity-0 translate-y-2 transition duration-200 group-hover:opacity-100 group-hover:-translate-y-1 group-focus-visible:opacity-100">
									{item.label}
								</span>
								<span className="orbit-dock__billboard flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/70 text-xl text-white/90 shadow-[0_0_18px_rgba(249,38,114,0.22)] transition duration-200 group-hover:scale-110 group-hover:border-white/40 group-hover:text-white group-focus-visible:scale-110">
									{item.icon}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
