import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

const AboutRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/about`);
};

export default AboutRedirectPage;
