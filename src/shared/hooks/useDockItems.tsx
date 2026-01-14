"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { FaHome } from "react-icons/fa";
import { FaClock, FaPenNib, FaUser } from "react-icons/fa6";
import { MdDescription } from "react-icons/md";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";

export type DockItemData = {
	icon: React.ReactNode;
	label: React.ReactNode;
	onClick: () => void;
	className?: string;
};

export default function useDockItems(): DockItemData[] {
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
				icon: <FaPenNib />,
				label: "Blog",
				onClick: () => router.push(`${basePath}/blog`),
			},
			{
				icon: <FaUser />,
				label: "Accounts",
				onClick: () => router.push(`${basePath}/accounts`),
			},
			{
				icon: <FaClock />,
				label: "History",
				onClick: () => router.push(`${basePath}/history`),
			},
			{
				icon: <MdDescription />,
				label: "About me",
				onClick: () => router.push(`${basePath}/about`),
			},
		],
		[basePath, router],
	);
}
