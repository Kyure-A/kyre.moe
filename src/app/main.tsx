"use client";

import type { ReactNode } from "react";
import LanguageToggle from "@/shared/ui/LanguageToggleSwitch/LanguageToggleSwitch";

type Props = { children: ReactNode };

export default function App({ children }: Props) {
	return (
		<>
			<header className="fixed top-0 right-0 p-10 z-40">
				<LanguageToggle onChange={() => {}} />
			</header>

			<main className="flex-1 flex flex-col justify-center items-center">
				{children}
			</main>

		</>
	);
}
