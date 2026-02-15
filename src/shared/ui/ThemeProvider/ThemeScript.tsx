import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/shared/lib/theme";

const ThemeScript = () => {
  const script = `
(() => {
  try {
    const stored = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const theme = stored === "light" || stored === "dark" ? stored : system;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "${DEFAULT_THEME}";
    document.documentElement.style.colorScheme = "${DEFAULT_THEME}";
  }
})();
  `.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
};

export default ThemeScript;
