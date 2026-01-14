declare module "markdown-it-task-lists" {
	const taskLists: (md: any, options?: { label?: boolean; labelAfter?: boolean }) => void;
	export default taskLists;
}
