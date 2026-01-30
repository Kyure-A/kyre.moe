declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";
  const taskLists: (
    md: MarkdownIt,
    options?: { label?: boolean; labelAfter?: boolean },
  ) => void;
  export default taskLists;
}
