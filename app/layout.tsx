import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import App from "@/app/main";

const ibmPlexMono = IBM_Plex_Mono({
	subsets: ["latin"],
	weight: ["500"],
	variable: "--font-ibm-plex-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Kyure_A / キュレェ",
	description: "Kyure_A's portfolio. Powered by Next.js",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={ibmPlexMono.variable}>
			<body suppressHydrationWarning={true}>
				<App>{children}</App>
			</body>
		</html>
	);
}
