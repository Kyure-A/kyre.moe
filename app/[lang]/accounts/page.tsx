import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Accounts from "@/pages/Accounts/ui/Accounts";
import { isSiteLang, SITE_LANGS, type SiteLang } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
	params: Promise<Params>;
};

const META_BY_LANG: Record<SiteLang, { title: string; description: string }> = {
	ja: {
		title: "アカウント | Kyure_A",
		description: "キュレェのアカウント一覧",
	},
	en: {
		title: "Accounts | Kyure_A",
		description: "Links to Kyure_A's social and service accounts.",
	},
};

export function generateStaticParams() {
	return SITE_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { lang } = await params;
	if (!isSiteLang(lang)) return {};
	const meta = META_BY_LANG[lang];
	return {
		title: meta.title,
		description: meta.description,
		alternates: {
			canonical: `/${lang}/accounts`,
			languages: {
				ja: "/ja/accounts",
				en: "/en/accounts",
			},
		},
		openGraph: {
			title: meta.title,
			description: meta.description,
		},
	};
}

export default async function AccountsPage({ params }: Props) {
	const { lang } = await params;
	if (!isSiteLang(lang)) notFound();
	return <Accounts lang={lang} />;
}
