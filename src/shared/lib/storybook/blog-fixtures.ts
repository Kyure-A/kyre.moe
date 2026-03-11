import type { BlogPost, BlogPostMeta } from "@/shared/lib/blog";

export const sampleBlogPostsJa: BlogPostMeta[] = [
  {
    slug: "hello-world",
    lang: "ja",
    title: "Hello World",
    description: "最初の投稿です。",
    date: "2025-01-10",
    tags: ["intro", "site"],
  },
  {
    slug: "exam-klis",
    lang: "ja",
    title: "KLIS 試験記録",
    description: "受験メモのまとめ。",
    date: "2025-02-01",
    tags: ["exam", "memo"],
  },
  {
    slug: "ouj-2025",
    lang: "ja",
    title: "OUJ 2025",
    description: "放送大学の学習ログ。",
    date: "2025-03-15",
    tags: ["study", "ouj"],
  },
];

export const sampleBlogPostsEn: BlogPostMeta[] = [
  {
    slug: "hello-world",
    lang: "en",
    title: "Hello World",
    description: "My first post.",
    date: "2025-01-10",
    tags: ["intro", "site"],
  },
  {
    slug: "study-log",
    lang: "en",
    title: "Study Log",
    description: "Weekly progress notes.",
    date: "2025-03-20",
    tags: ["study"],
  },
];

export const sampleTagItemsJa = [
  { slug: "intro", label: "intro", count: 1 },
  { slug: "site", label: "site", count: 1 },
  { slug: "exam", label: "exam", count: 1 },
  { slug: "memo", label: "memo", count: 1 },
  { slug: "study", label: "study", count: 1 },
  { slug: "ouj", label: "ouj", count: 1 },
];

export const sampleBlogPostJa: BlogPost = {
  slug: "hello-world",
  lang: "ja",
  title: "Hello World",
  description: "Storybook 表示用のダミー記事です。",
  date: "2025-01-10",
  tags: ["intro", "site"],
  canonical: "https://example.com/posts/hello-world",
  cover: "/kyure_a.png",
  content: "",
  html: `
<p>これは Storybook 表示用の本文です。</p>
<h2>コードブロック</h2>
<pre><code class="language-ts">const greet = (name: string) =&gt; \`Hello, \${name}\`;</code></pre>
<blockquote>
  <p>Reusable UI components speed up development.</p>
</blockquote>
  `.trim(),
};
