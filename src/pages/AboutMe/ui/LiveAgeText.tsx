"use client";

import { useEffect, useState } from "react";
import type { SiteLang } from "@/shared/lib/i18n";

const BIRTH_INSTANT_MS = Date.parse("2005-07-10T00:00:00+09:00");
const MILLISECONDS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const UPDATE_INTERVAL_MS = 50;
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
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setAge(getAgeInYears());
    update();

    const timer = window.setInterval(update, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (age === null) return <span>{dateLabel}</span>;

  return (
    <span>
      {dateLabel} ({AGE_FORMATTER[lang].format(age)} {AGE_SUFFIX[lang]})
    </span>
  );
};

export default LiveAgeText;
