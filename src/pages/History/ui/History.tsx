import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";
import Timeline, { type TimelineItem } from "@/pages/History/ui/Timeline";
import type { SiteLang } from "@/shared/lib/i18n";

type TimelineEntry = {
  date: Record<SiteLang, string>;
  title: Record<SiteLang, string>;
  description: Record<SiteLang, string>;
  url?: string;
};

const TIMELINE_DATA: TimelineEntry[] = [
  {
    date: { ja: "2005 年 7 月 10 日", en: "July 10, 2005" },
    title: { ja: "生誕", en: "Birth" },
    description: { ja: "納豆の日、約 2700 g", en: "Natto Day, about 2700 g" },
  },
  {
    date: { ja: "2021 年 4 月", en: "April, 2021" },
    title: {
      ja: "大阪府立大学工業高等専門学校 入学",
      en: "Enrolled in Osaka Prefecture University College of Technology",
    },
    description: {
      ja: "現: 大阪公立大学工業高等専門学校",
      en: "Now: Osaka Metropolitan University College of Technology",
    },
    url: "https://www.ct.omu.ac.jp",
  },
  {
    date: { ja: "2023 年 9 月", en: "September, 2023" },
    title: {
      ja: "パソコン甲子園 2023 プログラミング部門 (予選)",
      en: "PC Koshien 2023 Programming Division (Prelims)",
    },
    description: {
      ja: "大阪 1 位 (全体 35 位)",
      en: "Osaka #1 (35th overall)",
    },
    url: "http://web.archive.org/web/20230909072222/https://radon.u-aizu.ac.jp/pckosien/stats/pck2023pre_standings.html",
  },
  {
    date: { ja: "2023 年 10 月", en: "October, 2023" },
    title: {
      ja: "第34回 高専プロコン 競技部門",
      en: "34th KOSEN Procon (Competition Division)",
    },
    description: {
      ja: "ファイナルステージまで進出",
      en: "Advanced to the final stage",
    },
  },
  {
    date: { ja: "2023 年 11 月", en: "November, 2023" },
    title: {
      ja: "パソコン甲子園 2023 プログラミング部門 (本選)",
      en: "PC Koshien 2023 Programming Division (Finals)",
    },
    description: {
      ja: "24 位 / 29 チーム",
      en: "24th / 29 teams",
    },
    url: "https://web.archive.org/web/20231111083450/https://radon.u-aizu.ac.jp/pckosien/stats/pck2023final_standings.html",
  },
  {
    date: { ja: "2024 年 9 月", en: "September, 2024" },
    title: {
      ja: "BOOTH ショップ 開設",
      en: "Opened a BOOTH shop",
    },
    description: {
      ja: "VRChat アバター向けアクセサリーを販売",
      en: "Selling accessories for VRChat avatars",
    },
    url: "https://kyre.booth.pm",
  },
  {
    date: { ja: "2025 年 8 月", en: "August, 2025" },
    title: {
      ja: "第 1 回 さくらの AI ハッカソン with Kloud",
      en: "1st Sakura AI Hackathon with Kloud",
    },
    description: {
      ja: "最優秀賞",
      en: "Grand Prize",
    },
    url: "https://kloud-hackathon.connpass.com/event/361937/",
  },
  {
    date: { ja: "2026 年 3 月", en: "March, 2026" },
    title: {
      ja: "大阪公立大学工業高等専門学校 総合工学システム学科 電子情報コース 卒業",
      en: "Graduated from Osaka Metropolitan University College of Technology, Dept. of Technological Systems: Electronics and Information Course",
    },
    description: {
      ja: "準学士 (工学)",
      en: "Associate Degree in Engineering",
    },
    url: "https://www.ct.omu.ac.jp/info/news/entry-105601.html",
  },
  {
    date: { ja: "2026 年 4 月", en: "April, 2026" },
    title: {
      ja: "筑波大学 情報学群 知識情報・図書館学類 3 年次編入",
      en: "Transferred into the third year of the College of Knowledge and Library Sciences, School of Informatics, University of Tsukuba",
    },
    description: {
      ja: "図書館情報大学",
      en: "University of Library and Information Science",
    },
    url: "https://klis.tsukuba.ac.jp/",
  },
  {
    date: { ja: "2026 年 7 月", en: "July, 2026" },
    title: {
      ja: "Sansan 株式会社 インターンシップ",
      en: "Internship at Sansan, Inc.",
    },
    description: {
      ja: "Eight 事業部で 1 か月間の実務を経験",
      en: "One month of hands-on work in the Eight Division",
    },
    url: "https://newgradsevents.corp-sansan.com/engineer/200001",
  },
  {
    date: { ja: "2026 年 8 月", en: "August, 2026" },
    title: {
      ja: "株式会社 Progate インターンシップ",
      en: "Internship at Progate, Inc.",
    },
    description: {
      ja: "5 Days Git インターンに参加",
      en: "Took part in the five-day Git internship",
    },
    url: "https://prog-8.com/",
  },
];

const PAGE_TITLE: Record<SiteLang, string> = {
  ja: "来歴",
  en: "History",
};

const styles = {
  container: css({
    mx: "auto",
    width: "full",
    maxWidth: "content-4xl",
    borderRadius: "lg",
    p: "6",
    py: "history-y",
    boxShadow: "sm",
  }),
  title: visuallyHidden(),
};

const History = ({ lang }: { lang: SiteLang }) => {
  const items: TimelineItem[] = TIMELINE_DATA.map(
    ({ date, title, description, url }) => ({
      date: date[lang],
      title: title[lang],
      description: description[lang],
      url,
    }),
  );
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{PAGE_TITLE[lang]}</h1>
      <Timeline items={items} />
    </div>
  );
};

export default History;
