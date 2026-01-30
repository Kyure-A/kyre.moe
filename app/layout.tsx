import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import App from "@/app/main";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kyre.moe"),
  title: {
    default: "Kyure_A / キュレェ",
    template: "%s | Kyure_A",
  },
  description: "Kyure_A's portfolio. ",
  openGraph: {
    title: "Kyure_A / キュレェ",
    description: "Kyure_A's portfolio. ",
    url: "https://kyre.moe",
    siteName: "Kyure_A",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <ViewTransitions>
      <html lang="en" className={ibmPlexMono.variable}>
        <body suppressHydrationWarning={true}>
          <App>{children}</App>
        </body>
      </html>
    </ViewTransitions>
  );
};

export default RootLayout;
