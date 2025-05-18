import type { Metadata } from "next";
import "./globals.css";
import App from "@/app/main";

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
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <App>{children}</App>
      </body>
    </html>
  );
}
