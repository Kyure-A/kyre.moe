import { fileURLToPath } from "node:url";
import { defineConfig } from "@rshono/core";

type ExternalRule = (
  data: { request?: string; contextInfo?: { issuerLayer?: string | null } },
  callback: (error?: Error, result?: string | boolean) => void,
) => void;

export default defineConfig({
  siteUrl: "https://kyre.moe",
  rspack(config, { isServer, isDev }) {
    config.resolve ??= {};
    config.resolve.extensions = [...(config.resolve.extensions ?? []), ".mjs"];
    config.resolve.alias = {
      ...config.resolve.alias,
      "styled-system": fileURLToPath(
        new URL("./styled-system", import.meta.url),
      ),
    };
    config.module ??= {};
    config.module.rules ??= [];
    const fonts = /\.(woff2?|ttf|otf)$/i;
    config.module.rules = config.module.rules.flatMap((rule) => {
      if (
        !rule ||
        typeof rule !== "object" ||
        Array.isArray(rule) ||
        rule.type !== "asset" ||
        !(rule.test instanceof RegExp) ||
        !rule.test.test("font.woff2")
      ) {
        return [rule];
      }
      // Keep unused Unicode subsets and fallback fonts out of every initial CSS
      // response. The server rule's generator.emit:false is inherited here.
      return [
        { ...rule, exclude: fonts },
        { ...rule, test: fonts, type: "asset/resource" },
      ];
    });
    config.module.rules.push({
      test: /\.css$/i,
      use: ["postcss-loader"],
      type: "css/auto",
    });
    if (isServer) {
      // rshono externalizes server packages; CSS/font imports need its asset pipeline.
      const externals = config.externals as ExternalRule[];
      config.externals = externals.map((external) => (data, callback) => {
        if (/\.(css|woff2?|ttf|otf)$/i.test(data.request ?? "")) {
          callback(undefined, false);
          return;
        }
        external(data, callback);
      });
    }
    if (!isServer && !isDev) {
      const entry = config.entry as Record<string, string>;
      config.entry = {
        ...entry,
        main: [
          fileURLToPath(new URL("./src/app/static-flight.ts", import.meta.url)),
          entry.main,
        ],
      };
    }
    return config;
  },
});
