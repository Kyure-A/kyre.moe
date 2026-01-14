"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { FaHome } from "react-icons/fa";
import { FaClock, FaPenNib, FaUser } from "react-icons/fa6";
import { MdDescription } from "react-icons/md";

export type DockItemData = {
	icon: React.ReactNode;
	label: React.ReactNode;
	onClick: () => void;
	className?: string;
};

export default function useDockItems(): DockItemData[] {
	const router = useRouter();

	return useMemo(
		() => [
			{ icon: <FaHome />, label: "Home", onClick: () => router.push("/") },
			{
				icon: <FaPenNib />,
				label: "Blog",
				onClick: () => router.push("/blog"),
			},
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
