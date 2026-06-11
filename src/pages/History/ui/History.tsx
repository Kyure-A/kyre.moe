import Timeline, { type TimelineItem } from "@/pages/History/ui/Timeline";
import type { SiteLang } from "@/shared/lib/i18n";
import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

// FIXME: url と date は共通化する

const PAGE_TITLE: Record<SiteLang, string> = {
  ja: "来歴",
  en: "History",
};

const styles = {
  container: css({
    mx: "auto",
    maxWidth: "content-4xl",
    borderRadius: "lg",
    p: "6",
    py: "history-y",
    boxShadow: "sm",
  }),
  title: visuallyHidden(),
};

const History = ({ lang }: { lang: SiteLang }) => {
  const timelineData = TIMELINE_DATA[lang];
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{PAGE_TITLE[lang]}</h1>
      <Timeline items={timelineData} />
    </div>
  );
};

export default History;
