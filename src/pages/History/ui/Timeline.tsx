export type TimelineItem = {
  date: string;
  title: string;
  description: string;
  url?: string;
};

type TimelineProps = {
  items?: TimelineItem[];
};

const Timeline = ({ items = [] }: TimelineProps) => {
  return (
    <ol className="relative ml-4 border-s border-[var(--timeline-line)]">
      {items.map((item) => {
        const key = `${item.date}-${item.title}-${item.url ?? "timeline"}`;
        const content = (
          <>
            {/* dot */}
            <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border border-[var(--timeline-dot-border)] bg-[var(--timeline-dot-bg)]" />

            <time className="mb-1 text-sm font-normal leading-none text-[var(--timeline-date)]">
              {item.date}
            </time>

            <h2 className="text-lg font-semibold text-[var(--timeline-title)]">
              {item.title}
            </h2>

            <p className="mb-4 text-sm font-normal text-[var(--timeline-description)]">
              {item.description}
            </p>
          </>
        );

        return (
          <li className="mb-10 ms-4" key={key}>
            {item.url ? (
              <a href={item.url} className="block">
                {content}
              </a>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default Timeline;
