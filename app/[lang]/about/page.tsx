import { notFound } from "next/navigation";
import AboutMe from "@/pages/AboutMe/ui/AboutMe";
import { isSiteLang, SITE_LANGS } from "@/shared/lib/i18n";

type Params = { lang: string };

type Props = {
	params: Promise<Params>;
};

export function generateStaticParams() {
	return SITE_LANGS.map((lang) => ({ lang }));
}

export default async function AboutPage({ params }: Props) {
	const { lang } = await params;
	if (!isSiteLang(lang)) notFound();
	return <AboutMe lang={lang} />;
}
