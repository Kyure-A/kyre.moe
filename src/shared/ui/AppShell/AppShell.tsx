import type { ReactNode } from "react";
import App from "@/app/main";
import ThemeProvider from "@/shared/ui/ThemeProvider/ThemeProvider";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

const AppShell = ({ children }: AppShellProps) => {
  return (
    <ThemeProvider>
      <App>{children}</App>
    </ThemeProvider>
  );
};

export default AppShell;
