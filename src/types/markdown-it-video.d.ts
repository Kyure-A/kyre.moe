declare module "markdown-it-video" {
	interface VideoOptions {
		youtube?: { width?: number; height?: number };
		vimeo?: { width?: number; height?: number };
		vine?: { width?: number; height?: number; embed?: string };
		prezi?: { width?: number; height?: number };
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const video: (md: any, options?: VideoOptions) => void;
	export default video;
}
