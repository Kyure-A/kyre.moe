import { redirect } from "next/navigation";
import { getAllPosts } from "@/shared/lib/blog.server";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

type Params = { slug: string };

type Props = {
  params: Promise<Params>;
};

export const generateStaticParams = () => {
  const slugs = new Set(getAllPosts().map((post) => post.slug));
  return Array.from(slugs).map((slug) => ({ slug }));
};

const BlogPostRedirectPage = async ({ params }: Props) => {
  const { slug } = await params;
  redirect(`/${DEFAULT_LANG}/blog/${slug}`);
};

export default BlogPostRedirectPage;
