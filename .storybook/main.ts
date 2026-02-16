import type { StorybookConfig } from "@storybook/nextjs-vite";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type AliasEntry = {
  find: RegExp | string;
  replacement: string;
};

type RuntimeAliasDefinition = {
  runtime: string;
  nextCompiledPatterns: RegExp[];
};

const RUNTIME_ALIAS_DEFINITIONS: RuntimeAliasDefinition[] = [
  {
    runtime: "react",
    nextCompiledPatterns: [
      /^next\/dist\/compiled\/react(?:\/index)?(?:\.js)?$/,
    ],
  },
  {
    runtime: "react/jsx-runtime",
    nextCompiledPatterns: [
      /^next\/dist\/compiled\/react\/jsx-runtime(?:\.js)?$/,
    ],
  },
  {
    runtime: "react/jsx-dev-runtime",
    nextCompiledPatterns: [
      /^next\/dist\/compiled\/react\/jsx-dev-runtime(?:\.js)?$/,
    ],
  },
  {
    runtime: "react-dom",
    nextCompiledPatterns: [
      /^next\/dist\/compiled\/react-dom(?:\/index)?(?:\.js)?$/,
    ],
  },
  {
    runtime: "react-dom/client",
    nextCompiledPatterns: [
      /^next\/dist\/compiled\/react-dom\/client(?:\.js)?$/,
    ],
  },
  {
    runtime: "react-dom/server",
    nextCompiledPatterns: [
      /^next\/dist\/compiled\/react-dom\/server(?:\.browser)?(?:\.js)?$/,
    ],
  },
  {
    runtime: "react-dom/test-utils",
    nextCompiledPatterns: [
      /^next\/dist\/compiled\/react-dom\/cjs\/react-dom-test-utils\.production\.js$/,
    ],
  },
];

const EXTRA_ALIAS_DEFINITIONS: Array<[RegExp, string]> = [
  [/^react-dom\/cjs\/react-dom\.development\.js$/, "react-dom"],
  [
    /^next\/dist\/compiled\/react-dom\/cjs\/react-dom\.development\.js$/,
    "react-dom",
  ],
];

const OPTIMIZE_DEPS_INCLUDE = [
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom",
  "react-dom/client",
];

const OPTIMIZE_DEPS_EXCLUDE = [
  "next/dist/compiled/react",
  "next/dist/compiled/react/jsx-runtime",
  "next/dist/compiled/react/jsx-dev-runtime",
  "next/dist/compiled/react-dom",
  "next/dist/compiled/react-dom/client",
  "next/dist/compiled/react-dom/server",
  "next/dist/compiled/react-dom/server.browser",
];

const escapeRegExp = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const dedupe = <T>(items: T[]): T[] => Array.from(new Set(items));

const normalizeAliases = (alias: unknown): AliasEntry[] => {
  if (!alias) return [];
  if (Array.isArray(alias)) return alias as AliasEntry[];
  if (typeof alias === "object") {
    return Object.entries(alias as Record<string, string>).map(
      ([find, replacement]) => ({
        find,
        replacement,
      }),
    );
  }
  return [];
};

const createReactRuntimeAliases = (): AliasEntry[] => {
  const runtimeAliases = RUNTIME_ALIAS_DEFINITIONS.flatMap((definition) => {
    const replacement = require.resolve(definition.runtime);
    return [
      {
        find: new RegExp(`^${escapeRegExp(definition.runtime)}$`),
        replacement,
      },
      ...definition.nextCompiledPatterns.map((find) => ({
        find,
        replacement,
      })),
    ];
  });

  const extraAliases = EXTRA_ALIAS_DEFINITIONS.map(([find, replacement]) => ({
    find,
    replacement: require.resolve(replacement),
  }));

  return [...runtimeAliases, ...extraAliases];
};

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
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
        ...normalizeAliases(viteConfig.resolve?.alias),
        ...createReactRuntimeAliases(),
      ],
      dedupe: dedupe([
        ...(viteConfig.resolve?.dedupe ?? []),
        "react",
        "react-dom",
      ]),
    },
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      include: dedupe([
        ...(viteConfig.optimizeDeps?.include ?? []),
        ...OPTIMIZE_DEPS_INCLUDE,
      ]),
      exclude: dedupe([
        ...(viteConfig.optimizeDeps?.exclude ?? []),
        ...OPTIMIZE_DEPS_EXCLUDE,
      ]),
    },
  }),
};

export default config;
