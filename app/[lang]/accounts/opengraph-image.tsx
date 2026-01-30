import {
  generateLangStaticParams,
  generateOgImage,
  ogImageExports,
} from "@/shared/lib/og-image";

export const { dynamic, size, contentType } = ogImageExports;
export const generateStaticParams = generateLangStaticParams;

const Image = () => {
  return generateOgImage({
    title: "Accounts",
    subtitle: "Kyure_A / キュレェ",
  });
};

export default Image;
