import { Link } from "next-view-transitions";
import { buildTagPath } from "@/shared/lib/blog";
import type { SiteLang } from "@/shared/lib/i18n";
import BlogSection from "@/pages/Blog/ui/BlogSection";

type TagItem = {
  tag: string;
  count: number;
};

type Props = {
  lang: SiteLang;
  tags: TagItem[];
};

const COPY: Record<
  SiteLang,
  {
    label: string;
    title: string;
    empty: string;
    count: (count: number) => string;
  }
> = {
  ja: {
    label: "タグ",
    title: "タグ一覧",
    empty: "タグがまだありません。",
    count: (count) => `タグ ${count} 件`,
  },
  en: {
    label: "Tags",
    title: "All tags",
    empty: "No tags yet.",
    count: (count) => `${count} tag${count === 1 ? "" : "s"}`,
  },
};

const BlogTagList = ({ lang, tags }: Props) => {
  const copy = COPY[lang];

  return (
    <BlogSection>
      <header className="mb-10">
        <p className="text-[11px] tracking-[0.08em] text-[var(--text-tertiary)]">
          {copy.label}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {copy.count(tags.length)}
        </p>
      </header>
      {tags.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">{copy.empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2 text-[11px] tracking-[0.08em] text-[var(--text-tertiary)]">
          {tags.map((item) => (
            <Link
              key={item.tag}
              href={buildTagPath(item.tag, lang)}
              className="inline-flex items-center gap-2 rounded-[11px] border border-[var(--border-subtle)] px-3 py-1 transition-colors duration-[300ms] ease-out hover:border-[var(--border-subtle-strong)] hover:text-[var(--text-primary)]"
            >
              <span>#{item.tag}</span>
              <span className="text-[var(--text-tertiary)]/80">
                {item.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </BlogSection>
  );
};

export default BlogTagList;
