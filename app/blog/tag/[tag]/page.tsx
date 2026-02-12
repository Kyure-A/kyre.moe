import { redirect } from "next/navigation";
import { getAllTags } from "@/shared/lib/blog.server";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

type Params = { tag: string };

type Props = {
  params: Promise<Params>;
};

export const generateStaticParams = () => {
  return getAllTags().map((tag) => ({ tag }));
};

const BlogTagItemRedirectPage = async ({ params }: Props) => {
  const { tag } = await params;
  redirect(`/${DEFAULT_LANG}/blog/tag/${encodeURIComponent(tag)}`);
};

export default BlogTagItemRedirectPage;
