import type { CSSProperties } from "react";

const ANNICT_LOGO_URL =
  "https://annict.com/assets/logos/color-white-c040a9d74ad43dffd23d4ee25d19aa6518eea4c2.png";

const iconStyle: CSSProperties = {
  backgroundColor: "currentColor",
  WebkitMaskImage: `url("${ANNICT_LOGO_URL}")`,
  maskImage: `url("${ANNICT_LOGO_URL}")`,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  maskSize: "contain",
};

export const AnnictIcon = () => {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-5 w-5 sm:h-6 sm:w-6"
      style={iconStyle}
    />
  );
};
