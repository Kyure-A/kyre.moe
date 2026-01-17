import { SITE_LANGS } from "@/shared/lib/i18n";
import {
	generateOgImage,
	OG_IMAGE_CONTENT_TYPE,
	OG_IMAGE_SIZE,
} from "@/shared/lib/og-image";

export const dynamic = "force-static";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export function generateStaticParams() {
	return SITE_LANGS.map((lang) => ({ lang }));
}

export default function Image() {
	return generateOgImage({
		title: "Blog",
		subtitle: "Kyure_A / キュレェ",
	});
}
