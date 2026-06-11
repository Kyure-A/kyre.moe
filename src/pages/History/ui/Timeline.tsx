import { css } from "styled-system/css";

export type TimelineItem = {
  date: string;
  title: string;
  description: string;
  url?: string;
};

type TimelineProps = {
  items?: TimelineItem[];
};

const styles = {
  list: css({
    position: "relative",
    ml: "4",
    borderInlineStartWidth: "1px",
    borderColor: "timeline.line",
  }),
  dot: css({
    position: "absolute",
    insetInlineStart: "timeline-dot-offset",
    mt: "1.5",
    width: "timeline-dot",
    height: "timeline-dot",
    borderRadius: "full",
    borderWidth: "1px",
    borderColor: "timeline.dotBorder",
    backgroundColor: "timeline.dotBg",
  }),
  date: css({
    mb: "1",
    fontSize: "sm",
    fontWeight: "normal",
    lineHeight: "none",
    color: "timeline.date",
  }),
  title: css({
    textWrap: "balance",
    fontSize: "lg",
    fontWeight: "semibold",
    color: "timeline.title",
  }),
  description: css({
    mb: "4",
    textWrap: "wrap",
    fontSize: "sm",
    fontWeight: "normal",
    color: "timeline.description",
  }),
  item: css({
    mb: "10",
    marginInlineStart: "4",
  }),
  link: css({
    display: "block",
  }),
};

const Timeline = ({ items = [] }: TimelineProps) => {
  return (
    <ol className={styles.list}>
      {items.map((item) => {
        const key = `${item.date}-${item.title}-${item.url ?? "timeline"}`;
        const content = (
          <>
            {/* dot */}
            <div className={styles.dot} />

            <time className={styles.date}>
              {item.date}
            </time>

            <h2 className={styles.title}>
              {item.title}
            </h2>

            <p className={styles.description}>
              {item.description}
            </p>
          </>
        );

        return (
          <li className={styles.item} key={key}>
            {item.url ? (
              <a href={item.url} className={styles.link}>
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
