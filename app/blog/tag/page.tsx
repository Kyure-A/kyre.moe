import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

const BlogTagRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/blog/tag`);
};

export default BlogTagRedirectPage;
