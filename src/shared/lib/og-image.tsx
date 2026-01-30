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
};

export const ogImageExports = {
  dynamic: "force-static" as const,
  size: OG_IMAGE_SIZE,
  contentType: OG_IMAGE_CONTENT_TYPE,
};

export const generateLangStaticParams = () => {
  return SITE_LANGS.map((lang) => ({ lang }));
};

export const generateOgImage = ({ title, subtitle }: OgImageProps) => {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
        padding: "60px",
        position: "relative",
      }}
    >
      {/* Accent border */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #f92672, #ff6b9d, #f92672)",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          maxWidth: "1000px",
        }}
      >
        <h1
          style={{
            fontSize: title.length > 30 ? "56px" : "72px",
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              fontSize: "28px",
              color: "rgba(237, 237, 237, 0.7)",
              margin: "24px 0 0 0",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Site name */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontSize: "24px",
            color: "#f92672",
            fontWeight: 600,
          }}
        >
          kyre.moe
        </span>
      </div>
    </div>,
    {
      ...OG_IMAGE_SIZE,
    },
  );
};
