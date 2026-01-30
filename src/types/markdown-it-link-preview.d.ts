declare module "markdown-it-link-preview" {
  import type MarkdownIt from "markdown-it";
  const linkPreview: (md: MarkdownIt) => void;
  export default linkPreview;
}
