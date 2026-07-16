import { ViewTransitions } from "next-view-transitions";
import type { ReactNode } from "react";
import "../globals.css";
import { DEFAULT_LANG } from "@/shared/lib/i18n";
import { ibmPlexMono } from "@/shared/lib/root-font";
import { rootMetadata } from "@/shared/lib/root-metadata";
import AppShell from "@/shared/ui/AppShell/AppShell";
import ThemeScript from "@/shared/ui/ThemeProvider/ThemeScript";

export const metadata = rootMetadata;

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <ViewTransitions>
      <html
        lang={DEFAULT_LANG}
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

export default RootLayout;
