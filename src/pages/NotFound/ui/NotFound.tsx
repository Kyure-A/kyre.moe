"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { css } from "styled-system/css";
import {
  DEFAULT_LANG,
  getLangFromPath,
  type SiteLang,
} from "@/shared/lib/i18n";

const COPY: Record<
  SiteLang,
  { title: string; description: string; action: string }
> = {
  ja: {
    title: "ページが見つかりません",
    description: "んなページねえよ！",
    action: "ホームへ",
  },
  en: {
    title: "Page Not Found",
    description: "The page you requested could not be found.",
    action: "Back to Home",
  },
};

const styles = {
  section: css({
    position: "relative",
    height: "dvh",
    width: "full",
    overflow: "hidden",
    color: "white",
  }),
  blackLayer: css({
    position: "absolute",
    inset: "0",
    backgroundColor: "black",
  }),
  imageLayer: css({
    position: "absolute",
    inset: "0",
    overflow: "hidden",
  }),
  image: css({
    position: "absolute",
    left: "half",
    top: "half",
    width: "full",
    height: "full",
    transform: "translate(-50%, -50%)",
    transformOrigin: "center",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    // 縦画面では背景を 90 度回転させて全面に敷く
    "@media (orientation: portrait)": {
      width: "[100dvh]",
      height: "[100dvw]",
      transform: "translate(-50%, -50%) rotate(90deg)",
    },
  }),
  overlay: css({
    position: "absolute",
    inset: "0",
    backgroundColor: "notFoundOverlay",
  }),
  content: css({
    position: "relative",
    zIndex: "content",
    display: "flex",
    height: "full",
    width: "full",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4",
    px: "6",
    textAlign: "center",
  }),
  code: css({
    fontSize: "xs",
    letterSpacing: "notFound",
    color: "whiteAlpha80",
  }),
  title: css({
    fontSize: { base: "3xl", md: "5xl" },
    fontWeight: "semibold",
  }),
  description: css({
    maxWidth: "xl",
    fontSize: { base: "sm", md: "md" },
    color: "whiteAlpha90",
  }),
  action: css({
    mt: "2",
    display: "inline-flex",
    borderRadius: "control",
    borderWidth: "1px",
    borderColor: "whiteAlpha60",
    px: "5",
    py: "2",
    fontSize: "sm",
    fontWeight: "medium",
    transitionProperty: "colors",
    _hover: {
      backgroundColor: "white",
      color: "black",
    },
  }),
};

const NotFound = () => {
  const pathname = usePathname();
  const lang = getLangFromPath(pathname) ?? DEFAULT_LANG;
  const copy = COPY[lang];

  return (
    <section className={styles.section}>
      <div className={styles.blackLayer} />
      <div className={styles.imageLayer}>
        <div
          className={styles.image}
          style={{ backgroundImage: "url('/404.png')" }}
        />
      </div>
      <div className={styles.overlay} />

      <div className={styles.content}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.description}>{copy.description}</p>
        <Link href={`/${lang}`} className={styles.action}>
          {copy.action}
        </Link>
      </div>
    </section>
  );
};

export default NotFound;
