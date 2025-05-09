import type { Metadata } from "next";
import "./globals.css";

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
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
