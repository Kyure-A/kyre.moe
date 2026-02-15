import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

export const metadata: Metadata = {
  title: "アカウント",
  description: "キュレェのアカウント一覧",
  alternates: {
    canonical: `/${DEFAULT_LANG}/accounts`,
  },
  openGraph: {
    title: "アカウント",
    description: "キュレェのアカウント一覧",
    images: [`/${DEFAULT_LANG}/accounts/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    title: "アカウント",
    description: "キュレェのアカウント一覧",
    images: [`/${DEFAULT_LANG}/accounts/opengraph-image`],
  },
};

const AccountsRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/accounts`);
};

export default AccountsRedirectPage;
