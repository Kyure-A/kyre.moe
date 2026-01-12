"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import LanguageToggle from "@/shared/ui/LanguageToggleSwitch/LanguageToggleSwitch";

type Props = { children: ReactNode };

export default function App({ children }: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const showBack = pathname !== "/";

	const handleBack = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
			return;
		}
		router.push("/");
	};

	return (
		<>
			<header className="fixed top-0 right-0 p-10 z-40">
				<LanguageToggle onChange={() => {}} />
			</header>

			{showBack && (
				<button
					type="button"
					onClick={handleBack}
					aria-label="Go back"
					className="fixed left-6 top-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-700 bg-black/80 text-white/90 shadow-[0_0_16px_rgba(249,38,114,0.18)] transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F92672]/60"
				>
					<FaArrowLeft className="text-lg" />
				</button>
			)}

			<main className="flex-1 flex flex-col justify-center items-center">
				{children}
			</main>

		</>
	);
}
