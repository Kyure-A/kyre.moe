"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LANG } from "@/shared/lib/i18n";

export default function HomePage() {
	const router = useRouter();

	useEffect(() => {
		router.replace(`/${DEFAULT_LANG}`);
	}, [router]);

	return null;
}
