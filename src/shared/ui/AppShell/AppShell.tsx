import App from "@/app/main";
import ThemeProvider from "@/shared/ui/ThemeProvider/ThemeProvider";

const AppShell = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppShell;
