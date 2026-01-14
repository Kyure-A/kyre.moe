import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "@/pages/Home/ui/Home";
import { isSiteLang, SITE_LANGS } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
	params: Promise<Params>;
};

export function generateStaticParams() {
	return SITE_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	if (!isSiteLang(lang)) return {};
	return {
		alternates: {
			canonical: `/${lang}`,
			languages: {
				ja: "/ja",
				en: "/en",
			},
		},
	};
}

export default async function HomeLangPage({ params }: Props) {
	const { lang } = await params;
	if (!isSiteLang(lang)) notFound();
	return <Home />;
}
