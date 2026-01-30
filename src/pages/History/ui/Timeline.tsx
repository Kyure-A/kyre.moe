export type TimelineItem = {
  date: string;
  title: string;
  description: string;
  url?: string;
};

type TimelineProps = {
  items?: TimelineItem[];
};

export default function Timeline({ items = [] }: TimelineProps) {
  return (
    <ol className="relative border-s border-gray-300 dark:border-gray-700 ml-4">
      {items.map((item) => {
        const key = `${item.date}-${item.title}-${item.url ?? "timeline"}`;
        return (
          <a href={item.url || "/"} key={key}>
            <li className="mb-10 ms-4">
              {/* dot */}
              <div className="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-white" />

              <time className="mb-1 text-sm font-normal leading-none text-gray-400">
                {item.date}
              </time>

              <h3 className="text-lg font-semibold text-white">{item.title}</h3>

              <p className="mb-4 text-sm font-normal text-gray-400">
                {item.description}
              </p>
            </li>
          </a>
        );
      })}
    </ol>
  );
}
