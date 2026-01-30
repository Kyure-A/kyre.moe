declare module "markdown-it-github-alerts" {
  import type MarkdownIt from "markdown-it";
  const alerts: (md: MarkdownIt) => void;
  export default alerts;
}
