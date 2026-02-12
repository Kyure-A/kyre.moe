import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

const BlogRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/blog`);
};

export default BlogRedirectPage;
