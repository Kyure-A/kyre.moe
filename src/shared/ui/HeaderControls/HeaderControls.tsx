"use client";

import { usePathname, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { DEFAULT_LANG, getLangFromPath } from "@/shared/lib/i18n";
import LanguageToggle from "@/shared/ui/LanguageToggleSwitch/LanguageToggleSwitch";

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
      className={`fixed top-6 left-6 right-6 z-40 flex items-center ${
        showBack ? "justify-between" : "justify-end"
      }`}
    >
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-stone-800 text-white/90 shadow-md transition-all duration-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F92672]/60"
        >
          <span className="absolute h-24 w-24 rounded-full bg-white opacity-5 transition-all duration-500 -top-16 -left-10" />
          <FaArrowLeft className="relative z-10 text-sm" />
        </button>
      )}
      <LanguageToggle onChange={() => {}} />
    </header>
  );
};

export default HeaderControls;
