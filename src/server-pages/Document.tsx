import type { ReactNode } from "react";
import "../app/globals.css";
import DocumentLanguage from "@/app/DocumentLanguage";
import type { SiteLang } from "@/shared/lib/i18n";
import type { pageHead } from "@/shared/lib/root-metadata";
import AppShell from "@/shared/ui/AppShell/AppShell";
import HatenaStarScript from "@/shared/ui/HatenaStar/HatenaStarScript";
import ThemeScript from "@/shared/ui/ThemeProvider/ThemeScript";

type Head = ReturnType<typeof pageHead>;

export default function Document({
  head,
  lang = "ja",
  children,
  shell = true,
}: {
  head: Head;
  lang?: SiteLang;
  children: ReactNode;
  shell?: boolean;
}) {
  return (
    <html lang={lang} suppressHydrationWarning>
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
        <HatenaStarScript />
      </head>
      <body suppressHydrationWarning>
        <DocumentLanguage />
        {shell ? <AppShell>{children}</AppShell> : children}
      </body>
    </html>
  );
}
