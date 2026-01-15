"use client";

import { useEffect } from "react";

const TWITTER_SCRIPT_SRC = "https://platform.twitter.com/widgets.js";

declare global {
	interface Window {
		twttr?: {
			widgets?: {
				load: (element?: HTMLElement) => void;
			};
		};
	}
}

function loadTwitterWidgets() {
	if (typeof window === "undefined") return;
	if (document.querySelector(`script[src="${TWITTER_SCRIPT_SRC}"]`)) {
		window.twttr?.widgets?.load();
		return;
	}

	const script = document.createElement("script");
	script.src = TWITTER_SCRIPT_SRC;
	script.async = true;
	script.onload = () => window.twttr?.widgets?.load();
	document.body.appendChild(script);
}

export default function TwitterEmbedEnhancer() {
	useEffect(() => {
		if (!document.querySelector(".twitter-tweet")) return;
		loadTwitterWidgets();
	}, []);

	return null;
}
