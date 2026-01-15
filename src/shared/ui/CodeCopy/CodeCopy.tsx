"use client";

import { useEffect } from "react";

const COPY_BUTTON_CLASS = "code-copy-button";
const COPY_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /><path d="M5 15V5a2 2 0 0 1 2-2h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
const CHECK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

export default function CodeCopyEnhancer() {
	useEffect(() => {
		const blocks = Array.from(
			document.querySelectorAll<HTMLPreElement>(".blog-content pre"),
		);

		for (const block of blocks) {
			if (block.dataset.copyBound === "true") continue;
			block.dataset.copyBound = "true";

			const button = document.createElement("button");
			button.type = "button";
			button.className = COPY_BUTTON_CLASS;
			button.innerHTML = COPY_ICON;
			button.setAttribute("aria-label", "Copy code");
			button.setAttribute("title", "Copy code");

			button.addEventListener("click", async () => {
				const code = block.querySelector("code");
				const text = code?.textContent ?? "";
				if (!text) return;

				try {
					await navigator.clipboard.writeText(text);
				} catch {
					const textarea = document.createElement("textarea");
					textarea.value = text;
					textarea.style.position = "fixed";
					textarea.style.left = "-9999px";
					document.body.appendChild(textarea);
					textarea.select();
					document.execCommand("copy");
					textarea.remove();
				}

				button.innerHTML = CHECK_ICON;
				button.setAttribute("data-copied", "true");
				window.setTimeout(() => {
					button.innerHTML = COPY_ICON;
					button.removeAttribute("data-copied");
				}, 1400);
			});

			block.appendChild(button);
		}
	}, []);

	return null;
}
