import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        viteConfigPath: fileURLToPath(
          new URL("./vite.config.ts", import.meta.url),
        ),
      },
    },
  },
  staticDirs: ["../public"],
  docs: {
    autodocs: "tag",
  },
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: [
        ...(Array.isArray(viteConfig.resolve?.alias)
          ? viteConfig.resolve.alias
          : Object.entries(viteConfig.resolve?.alias ?? {}).map(
              ([find, replacement]) => ({ find, replacement }),
            )),
        {
          find: "@rshono/core/client",
          replacement: path.resolve(
            projectRoot,
            ".storybook/rshono-navigation.tsx",
          ),
        },
        { find: "@", replacement: path.resolve(projectRoot, "src") },
        {
          find: "styled-system",
          replacement: path.resolve(projectRoot, "styled-system"),
        },
      ],
      dedupe: ["react", "react-dom"],
    },
  }),
};

export default config;
