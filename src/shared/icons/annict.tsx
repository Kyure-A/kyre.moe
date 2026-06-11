import type { CSSProperties } from "react";
import { css } from "styled-system/css";

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

const iconClass = css({
  display: "inline-block",
  width: { base: "icon-sm", sm: "icon-md" },
  height: { base: "icon-sm", sm: "icon-md" },
});

export const AnnictIcon = () => {
  return (
    <span
      aria-hidden="true"
      className={iconClass}
      style={iconStyle}
    />
  );
};
