import {
  generateLangStaticParams,
  generateOgImage,
  ogImageExports,
} from "@/shared/lib/og-image";

export const { dynamic, size, contentType } = ogImageExports;
export const generateStaticParams = generateLangStaticParams;

const Image = () => {
  return generateOgImage({
    title: "Kyure_A / キュレェ",
    subtitle: "Portfolio",
  });
};

export default Image;
