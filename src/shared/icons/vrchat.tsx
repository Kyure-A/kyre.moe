import Image from "next/image";
import { css } from "styled-system/css";

const iconClass = css({
  width: { base: "icon-sm", sm: "icon-md" },
  height: { base: "icon-sm", sm: "icon-md" },
});

export const VRChatIcon = () => {
  return (
    <Image
      src="https://images.squarespace-cdn.com/content/v1/5f0770791aaf57311515b23d/ceb65abe-afdd-480b-a285-bb066bc44239/favicon.ico"
      alt="VRChat"
      width={24}
      height={24}
      className={iconClass}
    />
  );
};
