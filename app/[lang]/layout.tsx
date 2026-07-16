import { notFound } from "next/navigation";
import { ViewTransitions } from "next-view-transitions";
import type { ReactNode } from "react";
import "../globals.css";
import { isSiteLang } from "@/shared/lib/i18n";
import { ibmPlexMono } from "@/shared/lib/root-font";
import { rootMetadata } from "@/shared/lib/root-metadata";
import AppShell from "@/shared/ui/AppShell/AppShell";
import ThemeScript from "@/shared/ui/ThemeProvider/ThemeScript";

export const metadata = rootMetadata;

type Params = {
  lang: string;
};

type LangLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<Params>;
}>;

const LangLayout = async ({ children, params }: LangLayoutProps) => {
  const { lang } = await params;
  if (!isSiteLang(lang)) notFound();

  return (
    <ViewTransitions>
      <html
        lang={lang}
        className={ibmPlexMono.variable}
        suppressHydrationWarning={true}
      >
        <head>
          <ThemeScript />
        </head>
        <body suppressHydrationWarning={true}>
          <AppShell>{children}</AppShell>
        </body>
      </html>
    </ViewTransitions>
  );
};

export default LangLayout;
