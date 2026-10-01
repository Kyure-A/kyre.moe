import type { Metadata } from "next";

export const siteOgImage = {
  url: "https://kyre.moe/og/home.jpg",
  width: 1200,
  height: 630,
  alt: "Kyure_A",
};

export const rootMetadata: Metadata = {
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
    images: [siteOgImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [siteOgImage],
  },
};
