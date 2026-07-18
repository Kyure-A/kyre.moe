"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { FaHome } from "react-icons/fa";
import { FaAt, FaFeatherPointed, FaTimeline, FaUser } from "react-icons/fa6";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";

export type DockItemData = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
};

const useDockItems = (): DockItemData[] => {
  const router = useRouter();
  const pathname = usePathname();
  const lang = getLangFromPath(pathname) ?? DEFAULT_LANG;
  const basePath = `/${lang}`;

  return useMemo(
    () => [
      {
        icon: <FaHome />,
        label: "Home",
        onClick: () => router.push(basePath),
      },
      {
        icon: <FaFeatherPointed />,
        label: "Blog",
        onClick: () => router.push(`${basePath}/blog`),
      },
      {
        icon: <FaAt />,
        label: "Accounts",
        onClick: () => router.push(`${basePath}/accounts`),
      },
      {
        icon: <FaTimeline style={{ transform: "rotate(90deg)" }} />,
        label: "History",
        onClick: () => router.push(`${basePath}/history`),
      },
      {
        icon: <FaUser />,
        label: "About me",
        onClick: () => router.push(`${basePath}/about`),
      },
    ],
    [basePath, router],
  );
};

export default useDockItems;
