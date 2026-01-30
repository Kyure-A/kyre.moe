import { getAllPosts, getPost } from "@/shared/lib/blog.server";
import { isSiteLang } from "@/shared/lib/i18n";
import {
  generateOgImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/shared/lib/og-image";

export const dynamic = "force-static";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export const generateStaticParams = () => {
  return getAllPosts().map((post) => ({
    lang: post.lang,
    slug: post.slug,
  }));
};

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

const Image = async ({ params }: Props) => {
  const { lang, slug } = await params;

  if (!isSiteLang(lang)) {
    return generateOgImage({
      title: "Blog",
      subtitle: "kyre.moe",
    });
  }

  const post = await getPost(slug, lang);

  if (!post) {
    return generateOgImage({
      title: "Blog",
      subtitle: "kyre.moe",
    });
  }

  return generateOgImage({
    title: post.title,
    subtitle: post.date || undefined,
  });
};

export default Image;
