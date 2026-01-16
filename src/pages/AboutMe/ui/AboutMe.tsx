import React from "react";
import type { SiteLang } from "@/shared/lib/i18n";
import AnimatedContent from "@/shared/ui/AnimatedContent/AnimatedContent";
import List from "@/shared/ui/List/List";

type Section =
	| { label: string; bullets: string[] }
	| { label: string; text: string };

type SectionProps = {
	section: Section;
	index: number;
};

const ABOUTME_DATA: Record<SiteLang, Section[]> = {
	ja: [
		{
			label: "who",
			bullets: ["Kyure_A / キュレェ", "INTP-T"],
		},
		{
			label: "where",
			bullets: ["Osaka, Japan"],
		},
		{
			label: "what",
			bullets: [
				"Emacs が好きです。7 年くらい使っています",
				"ローグライクをよくやります",
			],
		},
	],
	en: [
		{
			label: "who",
			bullets: ["Kyure_A / キュレェ", "INTP-T"],
		},
		{
			label: "where",
			bullets: ["Osaka, Japan"],
		},
		{
			label: "what",
			bullets: [
				"I love Emacs. I've been using it for about 7 years.",
				"I often play roguelikes.",
			],
		},
	],
};

function Section({ section, index }: SectionProps) {
	return (
		<>
			{/* 見出し側（3カラム） */}
			<AnimatedContent
				delay={index * 100}
				className="md:col-span-3 font-mono text-gray-400 text-right md:text-left"
			>
				<h3>{section.label}</h3>
			</AnimatedContent>

			{/* 本文側（9カラム） */}
			<AnimatedContent
				delay={index * 100}
				className="md:col-span-9 prose prose-invert max-w-none"
			>
				{"bullets" in section ? (
					<List items={section.bullets} />
				) : (
					<p>{section.text}</p>
				)}
			</AnimatedContent>
		</>
	);
}

export default function AboutMe({ lang }: { lang: SiteLang }) {
	const data = ABOUTME_DATA[lang];
	return (
		<section className="py-24 px-6 max-w-6xl mx-auto">
			<div className="grid md:grid-cols-12 gap-y-12">
				{data.map((section, idx) => (
					<Section section={section} index={idx} key={section.label} />
				))}
			</div>
		</section>
	);
}
