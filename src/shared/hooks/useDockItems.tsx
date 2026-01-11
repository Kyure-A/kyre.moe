"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { FaHome } from "react-icons/fa";
import { FaClock, FaUser } from "react-icons/fa6";
import { MdDescription } from "react-icons/md";
import type { DockItemData } from "@/shared/ui/Dock/Dock";

export default function useDockItems(): DockItemData[] {
	const router = useRouter();

	return useMemo(
		() => [
			{ icon: <FaHome />, label: "Home", onClick: () => router.push("/") },
			{
				icon: <FaUser />,
				label: "Accounts",
				onClick: () => router.push("/accounts"),
			},
			{
				icon: <FaClock />,
				label: "History",
				onClick: () => router.push("/history"),
			},
			{
				icon: <MdDescription />,
				label: "About me",
				onClick: () => router.push("/about"),
			},
		],
		[router],
	);
}
