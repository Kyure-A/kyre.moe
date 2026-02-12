import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

const AccountsRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/accounts`);
};

export default AccountsRedirectPage;
