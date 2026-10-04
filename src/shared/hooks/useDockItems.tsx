import { type Child, useMemo } from "hono/jsx";
import { usePathname } from "@/shared/hooks/usePathname";
import {
  FaAt,
  FaFeatherPointed,
  FaHome,
  FaTimeline,
  FaUser,
} from "@/shared/icons/site";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";
import { useNavigation } from "@/shared/lib/navigation";

export type DockItemData = {
  icon: Child;
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
