/*
	Installed from https://reactbits.dev/ts/
 */

"use client";

import { useEffect, useRef } from "react";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera.js";
import { NearestFilter } from "three/src/constants.js";
import type { Object3D } from "three/src/core/Object3D.js";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry.js";
import { ShaderMaterial } from "three/src/materials/ShaderMaterial.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import { Scene } from "three/src/scenes/Scene.js";
import { CanvasTexture } from "three/src/textures/CanvasTexture.js";
import { GpuAsciiFilter } from "./GpuAsciiFilter";

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float mouse;
uniform float uEnableWaves;

void main() {
    vUv = uv;
    float time = uTime * 5.;

    float waveFactor = uEnableWaves;

    vec3 transformed = position;

    transformed.x += sin(time + position.y) * 0.5 * waveFactor;
    transformed.y += cos(time + position.z) * 0.15 * waveFactor;
    transformed.z += sin(time + position.x) * waveFactor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float mouse;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
    float time = uTime;
    vec2 pos = vUv;

    float move = sin(time + mouse) * 0.01;
    float r = texture2D(uTexture, pos + cos(time * 2. - time + pos.x) * .01).r;
    float g = texture2D(uTexture, pos + tan(time * .5 + pos.x - time) * .01).g;
    float b = texture2D(uTexture, pos - cos(time * 2. + time + pos.y) * .01).b;
    float a = texture2D(uTexture, pos).a;
    gl_FragColor = vec4(r, g, b, a);
}
`;

const map = (
  n: number,
  start: number,
  stop: number,
  start2: number,
  stop2: number,
): number => {
  return ((n - start) / (stop - start)) * (stop2 - start2) + start2;
};

interface CanvasTxtOptions {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

class CanvasTxt {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  txt: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  font: string;

  constructor(
    txt: string,
    {
      fontSize = 200,
      fontFamily = "system-ui",
      color = "#fdf9f3",
    }: CanvasTxtOptions = {},
  ) {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.txt = txt;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.color = color;

    this.font = `500 ${this.fontSize}px ${this.fontFamily}`;
  }

  resize() {
    if (this.context) {
      this.context.font = this.font;
      const metrics = this.context.measureText(this.txt);

      const textWidth = Math.ceil(metrics.width) + 20;
      const textHeight =
        Math.ceil(
          metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        ) + 20;

      this.canvas.width = textWidth;
      this.canvas.height = textHeight;
    }
  }

  render() {
    if (this.context) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.fillStyle = this.color;
      this.context.font = this.font;

      const metrics = this.context.measureText(this.txt);
      const yPos = 10 + metrics.actualBoundingBoxAscent;

      this.context.fillText(this.txt, 10, yPos);
    }
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  get texture() {
    return this.canvas;
  }
}

interface CanvAsciiOptions {
  text: string;
  asciiFontSize: number;
  textFontSize: number;
  textColor: string;
  planeBaseHeight: number;
  enableWaves: boolean;
  fontFamily: string;
  maxFps: number;
}

class CanvAscii {
  textString: string;
  asciiFontSize: number;
  textFontSize: number;
  textColor: string;
  planeBaseHeight: number;
  container: HTMLElement;
  width: number;
  height: number;
  enableWaves: boolean;
  fontFamily: string;
  maxFps: number;
  camera: PerspectiveCamera;
  scene: Scene;
  mouse: { x: number; y: number };
  textCanvas!: CanvasTxt;
  texture!: CanvasTexture;
  geometry!: PlaneGeometry;
  material!: ShaderMaterial;
  mesh!: Mesh;
  renderer!: WebGLRenderer;
  filter!: GpuAsciiFilter;
  center!: { x: number; y: number };
  animationFrameId: number = 0;
  resizeFrameId: number = 0;
  frameInterval: number = 0;
  lastFrameTime: number = 0;
  isRunning: boolean = false;
  timeOffset: number = 0;
  pausedAt: number | null = null;

  constructor(
    {
      text,
      asciiFontSize,
      textFontSize,
      textColor,
      planeBaseHeight,
      enableWaves,
      fontFamily,
      maxFps,
    }: CanvAsciiOptions,
    containerElem: HTMLElement,
    width: number,
    height: number,
  ) {
    this.textString = text;
    this.asciiFontSize = asciiFontSize;
    this.textFontSize = textFontSize;
    this.textColor = textColor;
    this.planeBaseHeight = planeBaseHeight;
    this.container = containerElem;
    this.width = 0;
    this.height = 0;
    this.enableWaves = enableWaves;
    this.fontFamily = fontFamily;
    this.maxFps = maxFps;
    this.frameInterval = this.maxFps > 0 ? 1000 / this.maxFps : 0;
    this.lastFrameTime = 0;

    this.camera = new PerspectiveCamera(
      45,
      width / Math.max(height, 1),
      1,
      1000,
    );
    this.camera.position.z = 30;

    this.scene = new Scene();
    this.mouse = { x: 0, y: 0 };

    this.onMouseMove = this.onMouseMove.bind(this);

    this.setMesh();
    this.setRenderer(width, height);
  }

  setMesh() {
    this.textCanvas = new CanvasTxt(this.textString, {
      fontSize: this.textFontSize,
      fontFamily: this.fontFamily,
      color: this.textColor,
    });
    this.textCanvas.resize();
    this.textCanvas.render();

    this.texture = new CanvasTexture(this.textCanvas.texture);
    this.texture.minFilter = NearestFilter;
    this.texture.needsUpdate = true;

    const textAspect = this.textCanvas.width / this.textCanvas.height;
    const baseH = this.planeBaseHeight;
    const planeW = baseH * textAspect;
    const planeH = baseH;

    this.geometry = new PlaneGeometry(planeW, planeH, 36, 36);
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        mouse: { value: 1.0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 },
      },
    });

    this.mesh = new Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  setRenderer(width: number, height: number) {
    this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);

    this.filter = new GpuAsciiFilter(this.renderer, {
      fontFamily: this.fontFamily,
      fontSize: this.asciiFontSize,
      invert: true,
    });

    this.container.appendChild(this.filter.domElement);
    this.setSize(width, height);

    this.container.addEventListener("mousemove", this.onMouseMove);
    this.container.addEventListener("touchmove", this.onMouseMove);
  }

  refreshFont() {
    this.textCanvas.resize();
    this.textCanvas.render();
    const previousTexture = this.texture;
    this.texture = new CanvasTexture(this.textCanvas.texture);
    this.texture.minFilter = NearestFilter;
    this.material.uniforms.uTexture.value = this.texture;
    previousTexture.dispose();

    const textAspect = this.textCanvas.width / this.textCanvas.height;
    this.geometry.dispose();
    this.geometry = new PlaneGeometry(
      this.planeBaseHeight * textAspect,
      this.planeBaseHeight,
      36,
      36,
    );
    this.mesh.geometry = this.geometry;
    this.filter.refreshFont();
  }

  setSize(w: number, h: number) {
    const nextWidth = Math.floor(w);
    const nextHeight = Math.floor(h);
    if (nextWidth <= 0 || nextHeight <= 0) return;
    if (nextWidth === this.width && nextHeight === this.height) {
      this.filter.setSize(nextWidth, nextHeight);
      return;
    }

    this.width = nextWidth;
    this.height = nextHeight;

    this.camera.aspect = nextWidth / nextHeight;
    this.camera.updateProjectionMatrix();

    this.filter.setSize(nextWidth, nextHeight);

    this.center = { x: nextWidth / 2, y: nextHeight / 2 };
  }

  scheduleSize(w: number, h: number) {
    cancelAnimationFrame(this.resizeFrameId);
    this.resizeFrameId = requestAnimationFrame(() => {
      this.setSize(w, h);
    });
  }

  load() {
    this.start();
  }

  start() {
    if (this.isRunning) return;
    if (this.pausedAt !== null) {
      this.timeOffset += performance.now() - this.pausedAt;
      this.pausedAt = null;
    }
    this.isRunning = true;
    this.lastFrameTime = 0;
    this.animationFrameId = requestAnimationFrame(this.animateFrame);
  }

  stop() {
    if (this.isRunning && this.pausedAt === null) {
      this.pausedAt = performance.now();
    }
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  onMouseMove(evt: MouseEvent | TouchEvent) {
    const e = (evt as TouchEvent).touches
      ? (evt as TouchEvent).touches[0]
      : (evt as MouseEvent);
    const bounds = this.container.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    this.mouse = { x, y };
  }

  animateFrame = (time: number) => {
    if (!this.isRunning) return;
    if (this.frameInterval && time - this.lastFrameTime < this.frameInterval) {
      this.animationFrameId = requestAnimationFrame(this.animateFrame);
      return;
    }
    this.lastFrameTime = time;
    this.render(time);
    this.animationFrameId = requestAnimationFrame(this.animateFrame);
  };

  render(timeMs?: number) {
    const adjustedTimeMs = (timeMs ?? performance.now()) - this.timeOffset;
    const time = adjustedTimeMs * 0.001;
    (this.mesh.material as ShaderMaterial).uniforms.uTime.value =
      Math.sin(time);

    this.updateRotation();
    this.filter.render(this.scene, this.camera);
  }

  updateRotation() {
    const x = map(this.mouse.y, 0, this.height, 0.5, -0.5);
    const y = map(this.mouse.x, 0, this.width, -0.5, 0.5);

    this.mesh.rotation.x += (x - this.mesh.rotation.x) * 0.05;
    this.mesh.rotation.y += (y - this.mesh.rotation.y) * 0.05;
  }

  clear() {
    this.scene.traverse((object: Object3D) => {
      const obj = object as unknown as Mesh;
      if (!obj.isMesh) return;
      [obj.material].flat().forEach((material) => {
        material.dispose();
        Object.keys(material).forEach((key) => {
          const matProp = material[key as keyof typeof material];
          if (
            matProp &&
            typeof matProp === "object" &&
            "dispose" in matProp &&
            typeof matProp.dispose === "function"
          ) {
            matProp.dispose();
          }
        });
      });
      obj.geometry.dispose();
    });
    this.scene.clear();
  }

  dispose() {
    this.stop();
    cancelAnimationFrame(this.resizeFrameId);
    this.filter.dispose();
    this.container.removeChild(this.filter.domElement);
    this.container.removeEventListener("mousemove", this.onMouseMove);
    this.container.removeEventListener("touchmove", this.onMouseMove);
    this.clear();
    this.texture.dispose();
    this.renderer.dispose();
  }
}

interface ASCIITextProps {
  text?: string;
  asciiFontSize?: number;
  textFontSize?: number;
  textColor?: string;
  planeBaseHeight?: number;
  enableWaves?: boolean;
  fontFamily?: string;
  maxFps?: number;
  startDelayMs?: number;
  startOnIdle?: boolean;
  active?: boolean;
}

const ASCIIText = ({
  text = "David!",
  asciiFontSize = 8,
  textFontSize = 200,
  textColor = "#fdf9f3",
  planeBaseHeight = 8,
  enableWaves = true,
  fontFamily,
  maxFps = 60,
  startDelayMs = 0,
  startOnIdle = false,
  active = true,
}: ASCIITextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<CanvAscii | null>(null);
  const activeRef = useRef(active);
  const visibleRef = useRef(true);

  useEffect(() => {
    activeRef.current = active;
    if (active && visibleRef.current) {
      asciiRef.current?.start();
    } else {
      asciiRef.current?.stop();
    }
  }, [active]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (activeRef.current && visibleRef.current) {
        asciiRef.current?.start();
      } else {
        asciiRef.current?.stop();
      }
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    let cleanup: (() => void) | null = null;
    let startTimer: number | null = null;
    let idleId: number | null = null;
    const idle =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? (window as Window & {
            requestIdleCallback?: (cb: IdleRequestCallback) => number;
            cancelIdleCallback?: (id: number) => void;
          })
        : null;

    const setup = () => {
      if (!containerRef.current) return;
      const cssFontFamily = fontFamily
        ? fontFamily
        : typeof window !== "undefined"
          ? getComputedStyle(document.documentElement)
              .getPropertyValue("--font-ibm-plex-mono")
              .trim()
          : "";
      const resolvedFontFamily = cssFontFamily
        ? `${cssFontFamily}, "IBM Plex Mono", monospace`
        : '"IBM Plex Mono", monospace';
      const { width, height } = containerRef.current.getBoundingClientRect();

      asciiRef.current = new CanvAscii(
        {
          text,
          asciiFontSize,
          textFontSize,
          textColor,
          planeBaseHeight,
          enableWaves,
          fontFamily: resolvedFontFamily,
          maxFps,
        },
        containerRef.current,
        width,
        height,
      );
      const ascii = asciiRef.current;
      let disposed = false;
      const refreshFont = () => ascii.refreshFont();
      document.fonts.addEventListener("loadingdone", refreshFont);
      void document.fonts.ready.then(() => {
        if (!disposed) refreshFont();
      });
      if (activeRef.current && visibleRef.current) {
        asciiRef.current.start();
      }

      const ro = new ResizeObserver((entries) => {
        if (!entries[0]) return;
        const { width: w, height: h } = entries[0].contentRect;
        asciiRef.current?.scheduleSize(w, h);
      });
      ro.observe(containerRef.current);
      const handleResize = () => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        ascii.scheduleSize(width, height);
      };
      // DPR can change when moving between displays without changing CSS size.
      window.addEventListener("resize", handleResize);

      cleanup = () => {
        disposed = true;
        document.fonts.removeEventListener("loadingdone", refreshFont);
        window.removeEventListener("resize", handleResize);
        ro.disconnect();
        ascii.dispose();
        if (asciiRef.current === ascii) asciiRef.current = null;
      };
    };

    const scheduleStart = () => {
      if (startDelayMs > 0) {
        startTimer = window.setTimeout(setup, startDelayMs);
      } else {
        setup();
      }
    };

    if (startOnIdle && idle?.requestIdleCallback) {
      idleId = idle.requestIdleCallback(() => scheduleStart());
    } else {
      scheduleStart();
    }

    return () => {
      if (idleId && idle?.cancelIdleCallback) {
        idle.cancelIdleCallback(idleId);
      }
      if (startTimer) {
        window.clearTimeout(startTimer);
      }
      if (cleanup) cleanup();
    };
  }, [
    text,
    asciiFontSize,
    textFontSize,
    textColor,
    planeBaseHeight,
    enableWaves,
    fontFamily,
    maxFps,
    startDelayMs,
    startOnIdle,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
      }}
    >
      <style>{`
        .ascii-text-root canvas {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }

      `}</style>
    </div>
  );
};

export default ASCIIText;
