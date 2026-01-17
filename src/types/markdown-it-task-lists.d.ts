declare module "markdown-it-task-lists" {
  const taskLists: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    md: any,
    options?: { label?: boolean; labelAfter?: boolean },
  ) => void;
  export default taskLists;
}
