import {
	generateLangStaticParams,
	generateOgImage,
	ogImageExports,
} from "@/shared/lib/og-image";

export const { dynamic, size, contentType } = ogImageExports;
export const generateStaticParams = generateLangStaticParams;

export default function Image() {
	return generateOgImage({
		title: "History",
		subtitle: "Kyure_A / キュレェ",
	});
}
