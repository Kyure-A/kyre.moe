"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

export default function HomePage() {
	const router = useRouter();

	useEffect(() => {
		router.replace(`/${DEFAULT_LANG}`);
	}, [router]);

	return null;
}
