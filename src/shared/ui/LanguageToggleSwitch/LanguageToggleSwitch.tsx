import React, { useState } from "react";

type LanguageToggleProps = {
  onChange: (s: string) => void;
};

const LanguageToggle = ({ onChange }: LanguageToggleProps) => {
  const [language, setLanguage] = useState("ja"); // 'ja' for Japanese, 'en' for English

  const handleToggle = () => {
    const newLanguage = language === "ja" ? "en" : "ja";
    setLanguage(newLanguage);
    if (onChange) {
      onChange(newLanguage);
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-10 w-20 items-center justify-center rounded-full shadow-md transition-all duration-500 overflow-hidden bg-stone-800`}
        aria-pressed={language === "en"}
        aria-labelledby="language-toggle"
      >
        <span className="sr-only" id="language-toggle">
          Toggle language between Japanese and English
        </span>

        {/* 背景のアクセント（装飾要素） */}
        <span
          className={`absolute w-24 h-24 rounded-full bg-white opacity-5 transition-all duration-500 ${
            language === "ja" ? "-top-16 -left-10" : "-top-16 -right-10"
          }`}
        />

        {/* 言語ラベル - 活性側 */}
        <span
          className={`absolute left-3 text-xs font-bold z-10 transition-all duration-500 ${
            language === "ja"
              ? "text-gray-800 scale-110"
              : "text-white/10 scale-90"
          }`}
        >
          Ja
        </span>

        <span
          className={`absolute right-3 text-xs font-bold z-10 transition-all duration-500 ${
            language === "en"
              ? "text-gray-800 scale-110"
              : "text-white/10 scale-90"
          }`}
        >
          En
        </span>

        {/* トグルの丸 */}
        <span
          className={`absolute h-8 w-8 transform rounded-full bg-white shadow-lg transition-all duration-500 ease-in-out ${
            language === "en" ? "translate-x-5" : "-translate-x-5"
          }`}
        >
          {/* 丸の中のアクセント */}
          <span
            className={`absolute inset-0 rounded-full m-1 transition-all duration-500 bg-gray-100`}
          />
        </span>
      </button>
    </div>
  );
};

export default LanguageToggle;
