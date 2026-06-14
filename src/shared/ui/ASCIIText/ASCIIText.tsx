/*
	Installed from https://reactbits.dev/ts/
 */

"use client";

import { useEffect, useRef } from "react";
import type { Camera } from "three/src/cameras/Camera.js";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera.js";
import { NearestFilter } from "three/src/constants.js";
import type { Object3D } from "three/src/core/Object3D.js";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry.js";
import { ShaderMaterial } from "three/src/materials/ShaderMaterial.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import { Scene } from "three/src/scenes/Scene.js";
import { CanvasTexture } from "three/src/textures/CanvasTexture.js";

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

const PX_RATIO = typeof window !== "undefined" ? window.devicePixelRatio : 1;

interface AsciiFilterOptions {
  fontSize?: number;
  fontFamily?: string;
  charset?: string;
  invert?: boolean;
}

class AsciiFilter {
  renderer: WebGLRenderer;
  domElement: HTMLDivElement;
  pre: HTMLPreElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  deg: number;
  invert: boolean;
  fontSize: number;
  fontFamily: string;
  charset: string;
  width: number = 0;
  height: number = 0;
  center: { x: number; y: number } = { x: 0, y: 0 };
  mouse: { x: number; y: number } = { x: 0, y: 0 };
  cols: number = 0;
  rows: number = 0;
  output: string[] = [];

  constructor(
    renderer: WebGLRenderer,
    { fontSize, fontFamily, charset, invert }: AsciiFilterOptions = {},
  ) {
    this.renderer = renderer;
    this.domElement = document.createElement("div");
    this.domElement.className = "ascii-text-root";
    this.domElement.style.position = "absolute";
    this.domElement.style.top = "0";
    this.domElement.style.left = "0";
    this.domElement.style.width = "100%";
    this.domElement.style.height = "100%";

    this.pre = document.createElement("pre");
    this.domElement.appendChild(this.pre);

    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.domElement.appendChild(this.canvas);

    this.deg = 0;
    this.invert = invert ?? true;
    this.fontSize = fontSize ?? 12;
    this.fontFamily = fontFamily ?? "'Courier New', monospace";
    this.charset =
      charset ??
      " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

    if (this.context) {
      this.context.imageSmoothingEnabled = false;
      this.context.imageSmoothingEnabled = false;
    }

    this.onMouseMove = this.onMouseMove.bind(this);
    document.addEventListener("mousemove", this.onMouseMove);
  }

  setSize(width: number, height: number) {
    const nextWidth = Math.floor(width);
    const nextHeight = Math.floor(height);
    if (nextWidth === this.width && nextHeight === this.height) return;

    this.width = nextWidth;
    this.height = nextHeight;
    this.renderer.setSize(nextWidth, nextHeight);
    this.reset();

    this.center = { x: nextWidth / 2, y: nextHeight / 2 };
    this.mouse = { x: this.center.x, y: this.center.y };
  }

  reset() {
    if (this.context) {
      this.context.font = `${this.fontSize}px ${this.fontFamily}`;
      const charWidth = this.context.measureText("A").width;

      this.cols = Math.floor(
        this.width / (this.fontSize * (charWidth / this.fontSize)),
      );
      this.rows = Math.floor(this.height / this.fontSize);

      this.canvas.width = this.cols;
      this.canvas.height = this.rows;
      this.output = new Array((this.cols + 1) * this.rows);
      this.pre.style.fontFamily = this.fontFamily;
      this.pre.style.fontSize = `${this.fontSize}px`;
      this.pre.style.margin = "0";
      this.pre.style.padding = "0";
      this.pre.style.lineHeight = "1em";
      this.pre.style.position = "absolute";
      this.pre.style.left = "50%";
      this.pre.style.top = "50%";
      this.pre.style.transform = "translate(-50%, -50%)";
      this.pre.style.zIndex = "9";
      this.pre.style.backgroundAttachment = "fixed";
      this.pre.style.mixBlendMode = "difference";
    }
  }

  render(scene: Scene, camera: Camera) {
    this.renderer.render(scene, camera);

    const w = this.canvas.width;
    const h = this.canvas.height;
    if (this.context) {
      this.context.clearRect(0, 0, w, h);
      if (this.context && w && h) {
        this.context.drawImage(this.renderer.domElement, 0, 0, w, h);
      }

      this.asciify(this.context, w, h);
      this.hue();
    }
  }

  onMouseMove(e: MouseEvent) {
    this.mouse = { x: e.clientX * PX_RATIO, y: e.clientY * PX_RATIO };
  }

  get dx() {
    return this.mouse.x - this.center.x;
  }

  get dy() {
    return this.mouse.y - this.center.y;
  }

  hue() {
    const deg = (Math.atan2(this.dy, this.dx) * 180) / Math.PI;
    this.deg += (deg - this.deg) * 0.075;
    this.domElement.style.filter = `hue-rotate(${this.deg.toFixed(1)}deg)`;
  }

  asciify(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (w && h) {
      const imgData = ctx.getImageData(0, 0, w, h).data;
      const output = this.output;
      const charset = this.charset;
      const maxCharIndex = charset.length - 1;
      let outputIndex = 0;

      for (let y = 0; y < h; y++) {
        const rowOffset = y * w * 4;
        for (let x = 0; x < w; x++) {
          const i = rowOffset + x * 4;
          const a = imgData[i + 3];

          if (a === 0) {
            output[outputIndex] = " ";
            outputIndex++;
            continue;
          }

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255;
          let idx = Math.floor((1 - gray) * maxCharIndex);
          if (this.invert) idx = maxCharIndex - idx;
          output[outputIndex] = charset[idx];
          outputIndex++;
        }
        output[outputIndex] = "\n";
        outputIndex++;
      }
      this.pre.textContent = output.join("");
    }
  }

  dispose() {
    document.removeEventListener("mousemove", this.onMouseMove);
  }
}

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
  filter!: AsciiFilter;
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

    this.camera = new PerspectiveCamera(45, this.width / this.height, 1, 1000);
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

    this.filter = new AsciiFilter(this.renderer, {
      fontFamily: this.fontFamily,
      fontSize: this.asciiFontSize,
      invert: true,
    });

    this.container.appendChild(this.filter.domElement);
    this.setSize(width, height);

    this.container.addEventListener("mousemove", this.onMouseMove);
    this.container.addEventListener("touchmove", this.onMouseMove);
  }

  setSize(w: number, h: number) {
    const nextWidth = Math.floor(w);
    const nextHeight = Math.floor(h);
    if (nextWidth <= 0 || nextHeight <= 0) return;
    if (nextWidth === this.width && nextHeight === this.height) return;

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
      if (activeRef.current && visibleRef.current) {
        asciiRef.current.start();
      }

      const ro = new ResizeObserver((entries) => {
        if (!entries[0]) return;
        const { width: w, height: h } = entries[0].contentRect;
        asciiRef.current?.scheduleSize(w, h);
      });
      ro.observe(containerRef.current);

      cleanup = () => {
        ro.disconnect();
        if (asciiRef.current) {
          asciiRef.current.dispose();
        }
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
          image-rendering: optimizeSpeed;
          image-rendering: -moz-crisp-edges;
          image-rendering: -o-crisp-edges;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: pixelated;
        }

        .ascii-text-root pre {
          margin: 0;
          user-select: none;
          padding: 0;
          line-height: 1em;
          text-align: left;
          position: absolute;
          left: 0;
          top: 0;
          background-image: radial-gradient(circle, #ff6188 0%, #fc9867 50%, #ffd866 100%);
          background-attachment: fixed;
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          z-index: 9;
          mix-blend-mode: difference;
        }
      `}</style>
    </div>
  );
};

export default ASCIIText;
