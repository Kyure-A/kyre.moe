import nextConfig from "../../../next.config";

const BASE_PATH = nextConfig.basePath || "";

export const srcPath = (path: string) => {
  return `${BASE_PATH}${path}`;
};
