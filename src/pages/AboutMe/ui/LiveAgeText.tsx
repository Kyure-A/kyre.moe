import { css } from "styled-system/css";
import type { SiteLang } from "@/shared/lib/i18n";

const BIRTH_INSTANT_MS = Date.parse("2005-07-10T00:00:00+09:00");
const MILLISECONDS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const UPDATE_INTERVAL_MS = 100;
const FRACTION_DIGITS = 9;

const AGE_FORMATTER: Record<SiteLang, Intl.NumberFormat> = {
  ja: new Intl.NumberFormat("ja-JP", {
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
  }),
  en: new Intl.NumberFormat("en-US", {
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
  }),
};

const AGE_SUFFIX: Record<SiteLang, string> = {
  ja: "歳",
  en: "y/o",
};

const getAgeInYears = () => {
  return (Date.now() - BIRTH_INSTANT_MS) / MILLISECONDS_PER_YEAR;
};

const LiveAgeText = ({
  dateLabel,
  lang,
}: {
  dateLabel: string;
  lang: SiteLang;
}) => {
  return (
    <span>
      {dateLabel} (
      <span
        className={css({ fontVariantNumeric: "tabular-nums" })}
        data-live-age={lang}
      >
        {AGE_FORMATTER[lang].format(getAgeInYears())}
      </span>{" "}
      {AGE_SUFFIX[lang]})
    </span>
  );
};

export const enhanceLiveAge = () => {
  const elements = document.querySelectorAll<HTMLElement>("[data-live-age]");
  if (!elements.length) return () => {};
  const update = () => {
    for (const element of elements) {
      const lang = element.dataset.liveAge === "en" ? "en" : "ja";
      element.textContent = AGE_FORMATTER[lang].format(getAgeInYears());
    }
  };
  update();
  const timer = window.setInterval(update, UPDATE_INTERVAL_MS);
  return () => window.clearInterval(timer);
};

export default LiveAgeText;
