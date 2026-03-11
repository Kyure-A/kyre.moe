import { DEFAULT_LANG, SITE_LANGS } from "@/shared/lib/i18n";

const HtmlLangScript = () => {
  const script = `
(() => {
  const path = window.location.pathname;
  const lang =
    ${JSON.stringify(SITE_LANGS)}.find((item) => path === "/" + item || path.startsWith("/" + item + "/")) ??
    "${DEFAULT_LANG}";
  document.documentElement.lang = lang;
})();
  `.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
};

export default HtmlLangScript;
