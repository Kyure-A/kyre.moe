import type { SiteLang } from "@/shared/lib/i18n";
import List from "@/shared/ui/List/List";

type Section =
  | { label: string; bullets: string[] }
  | { label: string; text: string };

type SectionProps = {
  section: Section;
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

const PAGE_TITLE: Record<SiteLang, string> = {
  ja: "自己紹介",
  en: "About me",
};

const Section = ({ section }: SectionProps) => {
  return (
    <>
      <h2 className="md:col-span-3 font-mono text-[var(--text-secondary)] text-right md:text-left">
        {section.label}
      </h2>

      <div className="md:col-span-9 max-w-none text-[var(--text-primary)]">
        {"bullets" in section ? (
          <List items={section.bullets} />
        ) : (
          <p>{section.text}</p>
        )}
      </div>
    </>
  );
};

const AboutMe = ({ lang }: { lang: SiteLang }) => {
  const data = ABOUTME_DATA[lang];
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <h1 className="sr-only">{PAGE_TITLE[lang]}</h1>
      <div className="grid md:grid-cols-12 gap-y-12">
        {data.map((section) => (
          <Section section={section} key={section.label} />
        ))}
      </div>
    </section>
  );
};

export default AboutMe;
