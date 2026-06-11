"use client";

import { FaMoon, FaSun } from "react-icons/fa6";
import { css, cx } from "styled-system/css";
import { useTheme } from "@/shared/ui/ThemeProvider/ThemeProvider";

const styles = {
  button: css({
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
  orbLight: css({
    right: "-10",
  }),
  orbDark: css({
    left: "-10",
  }),
  icon: css({
    position: "relative",
    zIndex: "content",
    fontSize: "sm",
  }),
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isLight}
      aria-label="Toggle color theme"
      className={styles.button}
    >
      <span
        className={cx(styles.orb, isLight ? styles.orbLight : styles.orbDark)}
      />
      <span className={styles.icon}>{isLight ? <FaSun /> : <FaMoon />}</span>
    </button>
  );
};

export default ThemeToggle;
