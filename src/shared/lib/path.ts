import nextConfig from "../../../next.config";

const BASE_PATH = nextConfig.basePath || "";

export function srcPath(path: string) {
	return `${BASE_PATH}${path}`;
}
