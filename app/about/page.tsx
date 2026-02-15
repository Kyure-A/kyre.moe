import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

export const metadata: Metadata = {
  title: "自己紹介",
  description: "キュレェの基本情報と自己紹介",
  alternates: {
    canonical: `/${DEFAULT_LANG}/about`,
  },
  openGraph: {
    title: "自己紹介",
    description: "キュレェの基本情報と自己紹介",
    images: [`/${DEFAULT_LANG}/about/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: "自己紹介",
    description: "キュレェの基本情報と自己紹介",
    images: [`/${DEFAULT_LANG}/about/opengraph-image`],
  },
};

const AboutRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/about`);
};

export default AboutRedirectPage;
