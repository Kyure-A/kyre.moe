import Timeline, { type TimelineItem } from "@/pages/History/ui/Timeline";
import type { SiteLang } from "@/shared/lib/i18n";

// FIXME: url と date は共通化する

const PAGE_TITLE: Record<SiteLang, string> = {
  ja: "来歴",
  en: "History",
};

const History = ({ lang }: { lang: SiteLang }) => {
  const timelineData = TIMELINE_DATA[lang];
  return (
    <div className="max-w-2xl mx-auto p-6 py-20 rounded-lg shadow-sm">
      <h1 className="sr-only">{PAGE_TITLE[lang]}</h1>
      <Timeline items={timelineData} />
    </div>
  );
};

export default History;
