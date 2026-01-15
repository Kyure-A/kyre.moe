import type { ReactNode } from "react";
import HeaderControls from "@/shared/ui/HeaderControls/HeaderControls";

type Props = { children: ReactNode };

export default function App({ children }: Props) {
	return (
		<>
			<HeaderControls />

			<main className="flex-1 flex flex-col justify-center items-center">
				{children}
			</main>
		</>
	);
}
