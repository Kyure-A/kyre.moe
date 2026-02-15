import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_LANGS } from "./i18n";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

export const OG_IMAGE_CONTENT_TYPE = "image/png";

export type OgImageProps = {
  title: string;
  subtitle?: string;
  tags?: string[];
};

export const ogImageExports = {
  dynamic: "force-static" as const,
  size: OG_IMAGE_SIZE,
  contentType: OG_IMAGE_CONTENT_TYPE,
};

export const generateLangStaticParams = () => {
  return SITE_LANGS.map((lang) => ({ lang }));
};

const OG_ICON_DATA_URL = (() => {
  try {
    const iconBuffer = readFileSync(join(process.cwd(), "public", "icon.jpg"));
    return `data:image/jpeg;base64,${iconBuffer.toString("base64")}`;
  } catch {
    return null;
  }
})();

const tryReadBuffer = (path: string) => {
  try {
    return readFileSync(path);
  } catch {
    return null;
  }
};

const OG_JP_FONT_PATHS = [
  process.env.OG_IMAGE_FONT_PATH,
  join(process.cwd(), "public", "fonts", "NotoSansCJKjp-Regular.otf"),
  join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.ttf"),
  "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Regular.otf",
  "/usr/share/fonts/truetype/noto/NotoSansJP-Regular.ttf",
  "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
].filter((path): path is string => Boolean(path));

const OG_JP_FONT_DATA = (() => {
  for (const path of OG_JP_FONT_PATHS) {
    const fontData = tryReadBuffer(path);
    if (fontData) return fontData;
  }
  return null;
})();

const OG_IMAGE_FONTS = OG_JP_FONT_DATA
  ? [
      {
        name: "OG Sans",
        data: OG_JP_FONT_DATA,
        style: "normal" as const,
        weight: 400 as const,
      },
      {
        name: "OG Sans",
        data: OG_JP_FONT_DATA,
        style: "normal" as const,
        weight: 700 as const,
      },
    ]
  : undefined;

const getTitleFontSize = (title: string) => {
  if (title.length > 44) return "46px";
  if (title.length > 28) return "58px";
  return "68px";
};

const normalizeTags = (tags?: string[]) => {
  return (tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 4);
};

export const generateOgImage = ({ title, subtitle, tags }: OgImageProps) => {
  const titleFontSize = getTitleFontSize(title);
  const displayTags = normalizeTags(tags);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        fontFamily: OG_IMAGE_FONTS ? "OG Sans" : "sans-serif",
        background:
          "linear-gradient(140deg, #f5f5f3 0%, #e9edf4 52%, #f5f5f3 100%)",
        padding: "44px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-80px",
          width: "420px",
          height: "420px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(249,38,114,0.24) 0%, rgba(249,38,114,0) 72%)",
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-140px",
          left: "-120px",
          width: "420px",
          height: "420px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(17,24,39,0.12) 0%, rgba(17,24,39,0) 72%)",
          opacity: 0.55,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          borderRadius: "28px",
          border: "2px solid rgba(17, 24, 39, 0.16)",
          background:
            "linear-gradient(165deg, rgba(255,255,255,0.88) 0%, rgba(245,245,243,0.9) 100%)",
          padding: "44px 52px",
          boxShadow:
            "0 28px 64px rgba(15, 23, 42, 0.16), 0 0 24px rgba(249, 38, 114, 0.1)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "980px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: titleFontSize,
              fontWeight: 800,
              color: "#1a1a1a",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: "34px",
                color: "#4f4f56",
                margin: 0,
                lineHeight: 1.35,
                fontWeight: 500,
              }}
            >
              {subtitle}
            </p>
          )}
          {displayTags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              {displayTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 14px",
                    borderRadius: "9999px",
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "#1f2937",
                    background: "rgba(15, 23, 42, 0.04)",
                    border: "2px solid rgba(15, 23, 42, 0.18)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: "18px",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 18px",
              borderRadius: "9999px",
              border: "2px solid rgba(17, 24, 39, 0.16)",
              background: "rgba(255, 255, 255, 0.86)",
              fontSize: "24px",
              color: "#111827",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {OG_ICON_DATA_URL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={OG_ICON_DATA_URL}
                width={40}
                height={40}
                style={{
                  borderRadius: "9999px",
                  border: "2px solid rgba(17, 24, 39, 0.2)",
                }}
                alt=""
              />
            ) : (
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "9999px",
                  background: "linear-gradient(145deg, #f92672 0%, #ff83ab 100%)",
                }}
              />
            )}
            kyre.moe
          </span>
        </div>
      </div>
    </div>,
    {
      ...OG_IMAGE_SIZE,
      ...(OG_IMAGE_FONTS ? { fonts: OG_IMAGE_FONTS } : {}),
    },
  );
};
