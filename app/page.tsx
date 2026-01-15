import type { Metadata } from "next";
import Home from "@/pages/Home/ui/Home";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

export const metadata: Metadata = {
	alternates: {
		canonical: `/${DEFAULT_LANG}`,
		languages: {
			ja: "/ja",
			en: "/en",
		},
	},
};

export default function RootPage() {
	return <Home />;
}
