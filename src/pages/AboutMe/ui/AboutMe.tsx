import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";
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

const styles = {
  row: css({
    display: "grid",
    gap: { base: "4", md: "6" },
    borderTopWidth: "1px",
    borderColor: "border.subtle",
    py: "6",
    md: {
      gridTemplateColumns: "88px minmax(0, 1fr)",
    },
  }),
  rowTitle: css({
    pt: "1",
    fontFamily: "mono",
    fontSize: "2xs",
    textTransform: "uppercase",
    letterSpacing: "wideLabel",
    color: "text.secondary",
  }),
  list: css({
    listStyleType: "disc",
    spaceY: "1",
    pl: "5",
    fontSize: "account-lg",
    lineHeight: "section",
    color: "text.secondary",
  }),
  link: css({
    transitionProperty: "colors",
    transitionDuration: "medium",
    transitionTimingFunction: "easeOut",
    _hover: {
      color: "text.primary",
    },
  }),
  page: css({
    mx: "auto",
    width: "full",
    maxWidth: "content-4xl",
    px: { base: "4", sm: "6" },
    py: "page-y",
  }),
  title: visuallyHidden(),
};

const SectionRow = ({
  section,
  lang,
}: {
  section: Section;
  lang: SiteLang;
}) => {
  return (
    <div className={styles.row}>
      <h2 className={styles.rowTitle}>{section.label}</h2>

      <ul className={styles.list}>
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
                className={styles.link}
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
    <section className={styles.page}>
      <h1 className={styles.title}>{data.title}</h1>

      <div>
        {data.sections.map((section) => (
          <SectionRow key={section.label} lang={lang} section={section} />
        ))}
      </div>
    </section>
  );
};

export default AboutMe;
