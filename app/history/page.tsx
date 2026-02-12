import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

const HistoryRedirectPage = () => {
  redirect(`/${DEFAULT_LANG}/history`);
};

export default HistoryRedirectPage;
