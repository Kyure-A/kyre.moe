import {
  generateLangStaticParams,
  generateOgImage,
  ogImageExports,
} from "@/shared/lib/og-image";

export const { dynamic, size, contentType } = ogImageExports;
export const generateStaticParams = generateLangStaticParams;

export default function Image() {
  return generateOgImage({
    title: "Blog",
    subtitle: "Kyure_A / キュレェ",
  });
}
