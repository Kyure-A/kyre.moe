import type { SiteLang } from "@/shared/lib/i18n";
import LiveAgeText from "./LiveAgeText";

type SectionItem =
  | string
  | { type: "liveAge"; dateLabel: string }
  | { type: "link"; label: string; href: string };

type Section = {
  label: string;
  items: SectionItem[];
};

type AboutMeContent = {
  title: string;
  sections: Section[];
};

const ABOUTME_DATA: Record<SiteLang, AboutMeContent> = {
  ja: {
    title: "自己紹介",
    sections: [
      {
        label: "who",
        items: [
          "キュレェ (Kyure_A)",
          {
            type: "link",
            label: "INTP-T (16Personalities)",
            href: "https://www.16personalities.com/intp-personality",
          },
          "A 型",
        ],
      },
      {
        label: "when",
        items: [{ type: "liveAge", dateLabel: "2005 年 7 月 10 日" }],
      },
      {
        label: "where",
        items: ["Osaka ↔ Tsukuba"],
      },
      {
        label: "what",
        items: [
          "Emacs が好きです。7 年くらい使っています",
          "ローグライクをよくやります",
        ],
      },
    ],
  },
  en: {
    title: "About me",
    sections: [
      {
        label: "who",
        items: [
          "キュレェ (Kyure_A)",
          {
            type: "link",
            label: "MBTI: INTP-T (16Personalities)",
            href: "https://www.16personalities.com/intp-personality",
          },
          "Type A",
        ],
      },
      {
        label: "when",
        items: [{ type: "liveAge", dateLabel: "July 10, 2005" }],
      },
      {
        label: "where",
        items: ["Osaka ↔ Tsukuba"],
      },
      {
        label: "what",
        items: [
          "I love Emacs. I've been using it for about 7 years.",
          "I often play roguelikes.",
        ],
      },
    ],
  },
};

const SectionRow = ({
  section,
  lang,
}: {
  section: Section;
  lang: SiteLang;
}) => {
  return (
    <div className="grid gap-4 border-t border-[var(--border-subtle)] py-6 md:grid-cols-[88px_minmax(0,1fr)] md:gap-6">
      <h2 className="pt-1 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--text-secondary)]">
        {section.label}
      </h2>

      <ul className="list-disc space-y-1 pl-5 text-[15px] leading-7 text-[var(--text-secondary)]">
        {section.items.map((item, index) => (
          <li
            key={
              typeof item === "string"
                ? item
                : `${section.label}-${item.type}-${index}`
            }
          >
            {typeof item === "string" ? (
              item
            ) : item.type === "liveAge" ? (
              <LiveAgeText dateLabel={item.dateLabel} lang={lang} />
            ) : (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="transition-colors duration-[250ms] ease-out hover:text-[var(--text-primary)]"
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const AboutMe = ({ lang }: { lang: SiteLang }) => {
  const data = ABOUTME_DATA[lang];

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-24 sm:px-6">
      <h1 className="sr-only">{data.title}</h1>

      <div>
        {data.sections.map((section) => (
          <SectionRow key={section.label} lang={lang} section={section} />
        ))}
      </div>
    </section>
  );
};

export default AboutMe;
