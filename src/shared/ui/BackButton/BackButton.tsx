"use client";

import { usePathname, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";

export default function BackButton() {
	const router = useRouter();
	const pathname = usePathname();
	const lang = getLangFromPath(pathname) ?? DEFAULT_LANG;
	const homePath = `/${lang}`;
	const showBack = pathname !== "/" && pathname !== homePath;

	const handleBack = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
			return;
		}
		router.push(homePath);
	};

	if (!showBack) return null;

	return (
		<button
			type="button"
			onClick={handleBack}
			aria-label="Go back"
			className="fixed left-6 top-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-700 bg-black/80 text-white/90 shadow-[0_0_16px_rgba(249,38,114,0.18)] transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F92672]/60"
		>
			<FaArrowLeft className="text-lg" />
		</button>
	);
}
