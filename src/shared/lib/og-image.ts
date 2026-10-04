import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type ContainerNode,
  type FontDetails,
  type Node,
  Renderer,
  type TextNode,
} from "@takumi-rs/core";
import type { Properties } from "csstype";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

export type OgImageProps = {
  title: string;
  subtitle?: string;
  tags?: string[];
};

const tryReadBuffer = (path: string) => {
  try {
    return readFileSync(path);
  } catch {
    return null;
  }
};

const OG_ICON_DATA = tryReadBuffer(join(process.cwd(), "public", "icon.jpg"));

const OG_JP_FONT_PATHS = [
  process.env.OG_IMAGE_FONT_PATH,
  join(process.cwd(), "public", "fonts", "NotoSansCJKjp-Regular.otf"),
  join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.ttf"),
  "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Regular.otf",
  "/usr/share/fonts/truetype/noto/NotoSansJP-Regular.ttf",
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
  "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
].filter((path): path is string => Boolean(path));

const OG_IMAGE_FONTS: FontDetails[] = [];
const fontHashes = new Set<string>();
for (const path of new Set(OG_JP_FONT_PATHS)) {
  const data = tryReadBuffer(path);
  if (!data) continue;
  const hash = createHash("sha256").update(data).digest("hex");
  if (fontHashes.has(hash)) continue;
  fontHashes.add(hash);
  OG_IMAGE_FONTS.push({
    name: `OG Sans ${OG_IMAGE_FONTS.length}`,
    data,
    style: "normal",
    weight: 400,
  });
}

const rendererVersion = JSON.parse(
  readFileSync(
    new URL("../package.json", import.meta.resolve("@takumi-rs/core")),
    "utf8",
  ),
).version as string;

// Include the actual fonts and renderer so cached images follow their output.
export const OG_IMAGE_FINGERPRINT = createHash("sha256")
  .update(rendererVersion)
  .update([...fontHashes].join("\n"))
  .update(OG_ICON_DATA ?? "")
  .digest("hex");

const renderer = new Renderer();
const fontFamily = OG_IMAGE_FONTS.map((font) => `"${font.name}"`).join(", ");

type OgStyle = Properties<string | number> &
  Record<`--${string}`, string | number | undefined>;

const container = (style: OgStyle, children: Node[] = []): ContainerNode => ({
  type: "container",
  style,
  children,
});

const text = (content: string, style: OgStyle): TextNode => ({
  type: "text",
  text: content,
  style,
});

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

export const generateOgImage = async ({
  title,
  subtitle,
  tags,
}: OgImageProps) => {
  if (OG_IMAGE_FONTS.length === 0) {
    throw new Error(
      "OGP generation requires a Japanese font. Set OG_IMAGE_FONT_PATH or install Noto Sans JP.",
    );
  }

  const content: Node[] = [
    text(title, {
      fontSize: getTitleFontSize(title),
      fontWeight: 800,
      color: "#1a1a1a",
      margin: 0,
      lineHeight: 1.15,
      letterSpacing: "-0.03em",
      overflowWrap: "break-word",
    }),
  ];

  if (subtitle) {
    content.push(
      text(subtitle, {
        fontSize: "34px",
        color: "#4f4f56",
        margin: 0,
        lineHeight: 1.35,
        fontWeight: 500,
      }),
    );
  }

  const displayTags = normalizeTags(tags);
  if (displayTags.length > 0) {
    content.push(
      container(
        {
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "8px",
        },
        displayTags.map((tag) =>
          text(`#${tag}`, {
            display: "flex",
            alignItems: "center",
            padding: "8px 14px",
            borderRadius: "9999px",
            fontSize: "24px",
            fontWeight: 600,
            color: "#1f2937",
            background: "rgba(15, 23, 42, 0.04)",
            border: "2px solid rgba(15, 23, 42, 0.18)",
          }),
        ),
      ),
    );
  }

  const icon: Node = OG_ICON_DATA
    ? {
        type: "image",
        src: OG_ICON_DATA,
        width: 40,
        height: 40,
        style: {
          borderRadius: "9999px",
          border: "2px solid rgba(17, 24, 39, 0.2)",
        },
      }
    : container({
        width: "40px",
        height: "40px",
        borderRadius: "9999px",
        background: "linear-gradient(145deg, #66d9ef 0%, #a6e7f7 100%)",
      });

  const node = container(
    {
      width: "100%",
      height: "100%",
      display: "flex",
      fontFamily,
      background:
        "linear-gradient(140deg, #f5f5f3 0%, #e9edf4 52%, #f5f5f3 100%)",
      padding: "44px",
      position: "relative",
    },
    [
      container({
        position: "absolute",
        top: "-120px",
        right: "-80px",
        width: "420px",
        height: "420px",
        borderRadius: "9999px",
        background:
          "radial-gradient(circle, rgba(102,217,239,0.24) 0%, rgba(102,217,239,0) 72%)",
        opacity: 0.8,
      }),
      container({
        position: "absolute",
        bottom: "-140px",
        left: "-120px",
        width: "420px",
        height: "420px",
        borderRadius: "9999px",
        background:
          "radial-gradient(circle, rgba(17,24,39,0.12) 0%, rgba(17,24,39,0) 72%)",
        opacity: 0.55,
      }),
      container(
        {
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
            "0 28px 64px rgba(15, 23, 42, 0.16), 0 0 24px rgba(102, 217, 239, 0.1)",
        },
        [
          container(
            {
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              maxWidth: "980px",
              flex: 1,
              justifyContent: "center",
            },
            content,
          ),
          container(
            {
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              marginTop: "18px",
            },
            [
              container(
                {
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
                },
                [icon, text("kyre.moe", {})],
              ),
            ],
          ),
        ],
      ),
    ],
  );

  return renderer.render(node, {
    ...OG_IMAGE_SIZE,
    format: "png",
    fonts: OG_IMAGE_FONTS,
    lang: "ja",
  });
};
