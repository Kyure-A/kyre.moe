import type { StorybookConfig } from "@storybook/nextjs-vite";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const NEXT_VIEW_TRANSITIONS_MOCK = fileURLToPath(
  new URL("./mocks/next-view-transitions.tsx", import.meta.url),
);

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
      /^next\/dist\/compiled\/react\/cjs\/react\.(?:development|production(?:\.min)?)\.js$/,
    ],
  },
  {
    runtime: "react/jsx-runtime",
    nextCompiledPatterns: [
      /^next\/dist\/compiled\/react\/jsx-runtime(?:\.js)?$/,
      /^next\/dist\/compiled\/react\/cjs\/react-jsx-runtime\.(?:development|production(?:\.min)?)\.js$/,
    ],
  },
  {
    runtime: "react/jsx-dev-runtime",
    nextCompiledPatterns: [
      /^next\/dist\/compiled\/react\/jsx-dev-runtime(?:\.js)?$/,
      /^next\/dist\/compiled\/react\/cjs\/react-jsx-dev-runtime\.development\.js$/,
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
  "next/dist/compiled/react/cjs/react.development.js",
  "next/dist/compiled/react/cjs/react.production.min.js",
  "next/dist/compiled/react/cjs/react-jsx-runtime.development.js",
  "next/dist/compiled/react/cjs/react-jsx-runtime.production.min.js",
  "next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js",
  "next/dist/compiled/react-dom",
  "next/dist/compiled/react-dom/client",
  "next/dist/compiled/react-dom/server",
  "next/dist/compiled/react-dom/server.browser",
];

const escapeRegExp = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const createStorybookOnlyAliases = (): AliasEntry[] => [
  {
    find: /^next-view-transitions$/,
    replacement: NEXT_VIEW_TRANSITIONS_MOCK,
  },
];

const forceSingleReactRuntime = () => ({
  name: "force-single-react-runtime",
  enforce: "post" as const,
  config: () => ({
    resolve: {
      alias: [...createReactRuntimeAliases(), ...createStorybookOnlyAliases()],
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: OPTIMIZE_DEPS_INCLUDE,
      exclude: OPTIMIZE_DEPS_EXCLUDE,
    },
  }),
});

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
    plugins: [...(viteConfig.plugins ?? []), forceSingleReactRuntime()],
  }),
};

export default config;
