import type { ReactNode } from "react";
import BackButton from "@/shared/ui/BackButton/BackButton";
import LanguageToggleClient from "@/shared/ui/LanguageToggleSwitch/LanguageToggleClient";

type Props = { children: ReactNode };

export default function App({ children }: Props) {
	return (
		<>
			<header className="fixed top-0 right-0 p-10 z-40">
				<LanguageToggleClient />
			</header>

			<BackButton />

			<main className="flex-1 flex flex-col justify-center items-center">
				{children}
			</main>
		</>
	);
}
