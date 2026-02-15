"use client";

import { FaMoon, FaSun } from "react-icons/fa6";
import { useTheme } from "@/shared/ui/ThemeProvider/ThemeProvider";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isLight}
      aria-label="Toggle color theme"
      className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--control-bg)] text-[var(--control-fg)] shadow-md transition-all duration-500 hover:text-[var(--control-fg-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]/55"
    >
      <span
        className={`absolute h-24 w-24 rounded-full bg-[var(--control-orb)] transition-all duration-500 ${
          isLight ? "-top-16 -right-10" : "-top-16 -left-10"
        }`}
      />
      <span className="relative z-10 text-sm">
        {isLight ? <FaSun /> : <FaMoon />}
      </span>
    </button>
  );
};

export default ThemeToggle;
