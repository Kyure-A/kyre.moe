import type { Child } from "hono/jsx";
import { css } from "styled-system/css";
import type { SiteLang } from "@/shared/lib/i18n";
import { useNavigation } from "@/shared/lib/navigation";
import type { pageHead } from "@/shared/lib/root-metadata";
import AppShell from "@/shared/ui/AppShell/AppShell";
import HatenaStarScript from "@/shared/ui/HatenaStar/HatenaStarScript";
import ThemeScript from "@/shared/ui/ThemeProvider/ThemeScript";
import { useAssets } from "./Assets";

const mainClass = css({
  flex: "1",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
});
export default function Document({
  head,
  lang = "ja",
  children,
  shell = true,
}: {
  head: ReturnType<typeof pageHead>;
  lang?: SiteLang;
  children: Child;
  shell?: boolean;
}) {
  const assets = useAssets();
  const { url } = useNavigation();
  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ThemeScript />
        {head.meta.map((meta) =>
          "title" in meta ? (
            <title key="title">{meta.title}</title>
          ) : "name" in meta ? (
            <meta key={meta.name} name={meta.name} content={meta.content} />
          ) : (
            <meta
              key={meta.property}
              property={meta.property}
              content={meta.content}
            />
          ),
        )}
        {head.links.map((link) => (
          <link key={`${link.rel}-${link.href}`} {...link} />
        ))}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        {assets.styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <HatenaStarScript />
        <script type="module" src={assets.script} />
      </head>
      <body data-pathname={url.pathname} data-shell={String(shell)}>
        <div id="app-chrome" hidden={!shell}>
          <AppShell />
        </div>
        <main id="page-content" className={mainClass}>
          {children}
        </main>
        <div id="page-effects" />
      </body>
    </html>
  );
}
