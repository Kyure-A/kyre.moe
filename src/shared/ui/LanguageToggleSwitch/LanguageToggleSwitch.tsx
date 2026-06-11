import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { css, cx } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";
import {
  DEFAULT_LANG,
  getLangFromPath,
  replacePathLang,
  type SiteLang,
} from "@/shared/lib/i18n";

type LanguageToggleProps = {
  onChange: (s: string) => void;
};

const STORAGE_KEY = "kyre-lang";

const styles = {
  root: css({
    display: "flex",
    alignItems: "center",
  }),
  button: css({
    position: "relative",
    display: "inline-flex",
    width: "language-control",
    height: "control",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: "control",
    borderWidth: "1px",
    borderColor: "control.border",
    backgroundColor: "control.bg",
    boxShadow: "md",
    transitionProperty: "common",
    transitionDuration: "toggle",
  }),
  hiddenLabel: visuallyHidden(),
  orb: css({
    position: "absolute",
    width: "control-orb",
    height: "control-orb",
    borderRadius: "control",
    backgroundColor: "control.orb",
    transitionProperty: "common",
    transitionDuration: "toggle",
    top: "-16",
  }),
  orbJa: css({
    left: "-10",
  }),
  orbEn: css({
    right: "-10",
  }),
  label: css({
    position: "absolute",
    zIndex: "content",
    fontSize: "xs",
    fontWeight: "bold",
    transitionProperty: "common",
    transitionDuration: "toggle",
  }),
  labelJa: css({
    left: "3",
  }),
  labelEn: css({
    right: "3",
  }),
  labelActive: css({
    color: "control.labelActive",
    transform: "scale(1.1)",
  }),
  labelMuted: css({
    color: "control.labelMuted",
    transform: "scale(0.9)",
  }),
  knob: css({
    position: "absolute",
    width: "control-knob",
    height: "control-knob",
    transform: "translateX(-1.25rem)",
    borderRadius: "control",
    backgroundColor: "control.knob",
    boxShadow: "lg",
    transitionProperty: "common",
    transitionDuration: "toggle",
    transitionTimingFunction: "easeInOut",
  }),
  knobEn: css({
    transform: "translateX(1.25rem)",
  }),
  knobInner: css({
    position: "absolute",
    inset: "0",
    m: "1",
    borderRadius: "control",
    backgroundColor: "control.knobInner",
    transitionProperty: "common",
    transitionDuration: "toggle",
  }),
};

const LanguageToggle = ({ onChange }: LanguageToggleProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const pathLang = useMemo(() => {
    return getLangFromPath(pathname);
  }, [pathname]);
  const [language, setLanguage] = useState<SiteLang>(pathLang ?? DEFAULT_LANG);

  useEffect(() => {
    if (pathLang) {
      setLanguage(pathLang);
      return;
    }
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ja" || stored === "en") {
      setLanguage(stored);
    }
  }, [pathLang]);

  const getNextPath = (lang: SiteLang) => {
    if (!pathname) return `/${lang}`;
    return replacePathLang(pathname, lang);
  };

  const handleToggle = () => {
    const newLanguage = language === "ja" ? "en" : "ja";
    setLanguage(newLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, newLanguage);
    }
    router.replace(getNextPath(newLanguage));
    if (onChange) {
      onChange(newLanguage);
    }
  };

  return (
    <div className={styles.root}>
      <button
        type="button"
        onClick={handleToggle}
        className={styles.button}
        aria-pressed={language === "en"}
      >
        <span className={styles.hiddenLabel}>
          Toggle language between Japanese and English
        </span>

        {/* 背景のアクセント（装飾要素） */}
        <span
          className={cx(
            styles.orb,
            language === "ja" ? styles.orbJa : styles.orbEn,
          )}
        />

        {/* 言語ラベル - 活性側 */}
        <span
          className={cx(
            styles.label,
            styles.labelJa,
            language === "ja" ? styles.labelActive : styles.labelMuted,
          )}
        >
          Ja
        </span>

        <span
          className={cx(
            styles.label,
            styles.labelEn,
            language === "en" ? styles.labelActive : styles.labelMuted,
          )}
        >
          En
        </span>

        {/* トグルの丸 */}
        <span className={cx(styles.knob, language === "en" && styles.knobEn)}>
          {/* 丸の中のアクセント */}
          <span className={styles.knobInner} />
        </span>
      </button>
    </div>
  );
};

export default LanguageToggle;
