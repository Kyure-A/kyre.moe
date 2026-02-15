import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

export const metadata: Metadata = {
  title: "来歴",
  description: "キュレェの来歴",
  alternates: {
    canonical: `/${DEFAULT_LANG}/history`,
  },
  openGraph: {
    title: "来歴",
    description: "キュレェの来歴",
    images: [`/${DEFAULT_LANG}/history/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: "来歴",
    description: "キュレェの来歴",
    images: [`/${DEFAULT_LANG}/history/opengraph-image`],
  },
};

const HistoryRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/history`);
};

export default HistoryRedirectPage;
