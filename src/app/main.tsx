"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import useDockItems from "@/shared/hooks/useDockItems";
import useIsMobile from "@/shared/hooks/useIsMobile";
import useRuntimeProfile from "@/shared/hooks/useRuntimeProfile";
import HeaderControls from "@/shared/ui/HeaderControls/HeaderControls";
import OrbitDock from "@/shared/ui/OrbitDock/OrbitDock";
import { css, cx } from "styled-system/css";

const styles = {
  fullSize: css({
    width: "full",
    height: "full",
  }),
  fullWidth: css({
    width: "full",
  }),
  homeShader: css({
    position: "fixed",
    inset: "0",
    zIndex: "base",
  }),
  centeredBackLayer: css({
    position: "fixed",
    left: "half",
    top: "half",
    zIndex: "canvas",
    transform: "translate(-50%, -50%)",
  }),
  textOverlay: css({
    position: "fixed",
    inset: "0",
    zIndex: "overlay",
    overflow: "hidden",
    pointerEvents: "none",
  }),
  textOverlayInner: css({
    position: "absolute",
    inset: "0",
    display: "flex",
    flexDirection: "column",
    pt: "16",
  }),
  textSlot: css({
    display: "flex",
    flexDirection: "column",
    mb: "6",
    zIndex: "controls",
    pointerEvents: "auto",
  }),
  spacer: css({
    flex: "1",
  }),
  centeredFrontLayer: css({
    position: "fixed",
    left: "half",
    top: "half",
    zIndex: "controls",
    transform: "translate(-50%, -50%)",
  }),
  main: css({
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  }),
};

const BackgroundShader = dynamic(
  () => import("@/shared/ui/Background/Background"),
  {
    ssr: false,
    loading: () => <div className={styles.fullSize} />,
  },
);

const FadeTextRotator = dynamic(
  () => import("@/pages/Home/ui/FadeTextRotator"),
  {
    ssr: false,
    loading: () => <div className={styles.fullWidth} />,
  },
);

const ORBIT_VARS: CSSProperties = {
  "--home-orbit-size": "clamp(300px, 86vmin, 760px)",
  "--home-orbit-icon": "clamp(56px, 12vmin, 96px)",
  "--home-orbit-gap": "clamp(8px, 2.4vmin, 16px)",
} as CSSProperties;

const SHADER_MAX_FPS = 24;
const ASCII_MAX_FPS = 24;
const LOW_PERFORMANCE_SHADER_MAX_FPS = 12;
const LOW_PERFORMANCE_ASCII_MAX_FPS = 12;

type Props = { children: ReactNode };

const isHomePath = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return pathname === "/ja" || pathname === "/en" || pathname === "/";
};

const App = ({ children }: Props) => {
  const pathname = usePathname();
  const isHome = isHomePath(pathname);

  const items = useDockItems();
  const orbitItems = useMemo(
    () => items.filter((item) => item.label !== "Home"),
    [items],
  );

  const [orbitRotation, setOrbitRotation] = useState(0);
  const [orbitHovered, setOrbitHovered] = useState(false);
  const [orbitDragging, setOrbitDragging] = useState(false);
  const [orbitHoveredIndex, setOrbitHoveredIndex] = useState<number | null>(
    null,
  );
  const isMobile = useIsMobile();
  const { lowPerformanceMode } = useRuntimeProfile();

  const orbitPaused = !isHome || (orbitHovered && !orbitDragging);
  const shaderResolution = lowPerformanceMode
    ? isMobile
      ? 0.42
      : 0.36
    : isMobile
      ? 0.65
      : 1;
  const startDelayMs = lowPerformanceMode
    ? isMobile
      ? 700
      : 500
    : isMobile
      ? 450
      : 200;
  const shaderMaxFps = lowPerformanceMode
    ? LOW_PERFORMANCE_SHADER_MAX_FPS
    : SHADER_MAX_FPS;
  const asciiMaxFps = lowPerformanceMode
    ? LOW_PERFORMANCE_ASCII_MAX_FPS
    : ASCII_MAX_FPS;
  const shaderMouseInteraction = !lowPerformanceMode;
  const shaderFogDensity = lowPerformanceMode ? 0.24 : 0.3;
  const shaderNoiseStrength = lowPerformanceMode ? 0.015 : 0.03;

  // Home の表示/非表示を切り替える共通スタイル
  const homeLayerStyle: CSSProperties = {
    visibility: isHome ? "visible" : "hidden",
    pointerEvents: isHome ? "auto" : "none",
  };

  return (
    <>
      <HeaderControls />

      <div
        className={cx("home-shader", styles.homeShader)}
        style={homeLayerStyle}
        aria-hidden={!isHome}
      >
        <BackgroundShader
          pixelFilter={250}
          fogDensity={shaderFogDensity}
          noiseStrength={shaderNoiseStrength}
          mouseInteraction={shaderMouseInteraction}
          isRotate={false}
          pulseFrequency={0.05}
          color1="#272822"
          color2="#66d9ef"
          color3="#000000"
          maxFps={shaderMaxFps}
          resolutionScale={shaderResolution}
          startDelayMs={startDelayMs}
          startOnIdle
          active={isHome}
        />
      </div>

      <div
        className={styles.centeredBackLayer}
        style={{ ...ORBIT_VARS, ...homeLayerStyle }}
        aria-hidden={!isHome}
      >
        <OrbitDock
          items={orbitItems}
          layer="back"
          showDecorations
          speed={9}
          rotation={orbitRotation}
          size="var(--home-orbit-size)"
          paused={orbitPaused}
          hoveredIndex={orbitHoveredIndex}
        />
      </div>

      {/* FadeTextRotator - 元の Home.tsx と同じレイアウト構造を再現、キャラ画像より前面 */}
      <div
        className={styles.textOverlay}
        style={{ visibility: isHome ? "visible" : "hidden" }}
        aria-hidden={!isHome}
      >
        <div className={styles.textOverlayInner}>
          <div className={styles.textSlot}>
            <FadeTextRotator
              asciiMaxFps={asciiMaxFps}
              asciiStartDelayMs={startDelayMs}
              asciiStartOnIdle
              asciiEnabled
              active={isHome}
            />
          </div>
          {/* 画像のスペースを確保（実際の画像は children で描画） */}
          <div className={styles.spacer} />
        </div>
      </div>

      {/* OrbitDock (front layer) - 常にマウント、Home でのみ表示 */}
      <div
        className={styles.centeredFrontLayer}
        style={{ ...ORBIT_VARS, ...homeLayerStyle }}
        aria-hidden={!isHome}
      >
        <OrbitDock
          items={orbitItems}
          layer="front"
          showDecorations={false}
          speed={9}
          rotation={orbitRotation}
          onRotate={setOrbitRotation}
          dragEnabled
          size="var(--home-orbit-size)"
          paused={orbitPaused}
          hoveredIndex={orbitHoveredIndex}
          onHoverIndexChange={setOrbitHoveredIndex}
          onHoverChange={setOrbitHovered}
          onDragChange={setOrbitDragging}
        />
      </div>

      <main className={styles.main}>{children}</main>
    </>
  );
};

export default App;
