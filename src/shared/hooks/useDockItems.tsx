import { useNavigation } from "@rshono/core/client";
import { useMemo } from "react";
import { FaHome } from "react-icons/fa";
import { FaAt, FaFeatherPointed, FaTimeline, FaUser } from "react-icons/fa6";
import { usePathname } from "@/shared/hooks/usePathname";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";

export type DockItemData = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
};

const useDockItems = (): DockItemData[] => {
  const { router } = useNavigation();
  const pathname = usePathname();
  const lang = getLangFromPath(pathname) ?? DEFAULT_LANG;

  return useMemo(
    () => [
      {
        icon: <FaHome />,
        label: "Home",
        onClick: () => router.push(`/${lang}`),
      },
      {
        icon: <FaFeatherPointed />,
        label: "Blog",
        onClick: () => router.push(`/${lang}/blog`),
      },
      {
        icon: <FaAt />,
        label: "Accounts",
        onClick: () => router.push(`/${lang}/accounts`),
      },
      {
        icon: <FaTimeline style={{ transform: "rotate(90deg)" }} />,
        label: "History",
        onClick: () => router.push(`/${lang}/history`),
      },
      {
        icon: <FaUser />,
        label: "About me",
        onClick: () => router.push(`/${lang}/about`),
      },
    ],
    [lang, router],
  );
};

export default useDockItems;
