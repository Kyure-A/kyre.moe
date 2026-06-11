"use client";

import { usePathname, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { css, cx } from "styled-system/css";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";
import LanguageToggle from "@/shared/ui/LanguageToggleSwitch/LanguageToggleSwitch";
import ThemeToggle from "@/shared/ui/ThemeToggleSwitch/ThemeToggleSwitch";

const styles = {
  header: css({
    position: "fixed",
    top: "control-offset",
    left: "control-offset",
    right: "control-offset",
    zIndex: "header",
    display: "flex",
    alignItems: "center",
  }),
  spread: css({
    justifyContent: "space-between",
  }),
  end: css({
    justifyContent: "flex-end",
  }),
  backButton: css({
    position: "relative",
    display: "inline-flex",
    width: "control",
    height: "control",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: "control",
    backgroundColor: "control.bg",
    color: "control.fg",
    boxShadow: "md",
    transitionProperty: "common",
    transitionDuration: "toggle",
    _hover: {
      color: "control.fgStrong",
    },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "theme.accent",
      outlineOffset: "0.5",
    },
  }),
  backOrb: css({
    position: "absolute",
    width: "control-orb",
    height: "control-orb",
    borderRadius: "control",
    backgroundColor: "control.orb",
    transitionProperty: "common",
    transitionDuration: "toggle",
    top: "-16",
    left: "-10",
  }),
  backIcon: css({
    position: "relative",
    zIndex: "content",
    fontSize: "sm",
  }),
  controls: css({
    display: "flex",
    alignItems: "center",
    gap: "2",
  }),
};

const HeaderControls = () => {
  const router = useRouter();
  const pathname = usePathname();
  const lang = getLangFromPath(pathname) ?? DEFAULT_LANG;
  const homePath = `/${lang}`;
  const showBack = pathname !== "/" && pathname !== homePath;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(homePath);
  };

  return (
    <header
      className={cx(styles.header, showBack ? styles.spread : styles.end)}
    >
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className={styles.backButton}
        >
          <span className={styles.backOrb} />
          <FaArrowLeft className={styles.backIcon} />
        </button>
      )}
      <div className={styles.controls}>
        <ThemeToggle />
        <LanguageToggle onChange={() => {}} />
      </div>
    </header>
  );
};

export default HeaderControls;
