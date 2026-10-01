import { Camera } from "three/src/cameras/Camera.js";
import {
  LinearFilter,
  NearestFilter,
  NoBlending,
} from "three/src/constants.js";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry.js";
import { ShaderMaterial } from "three/src/materials/ShaderMaterial.js";
import { Vector2 } from "three/src/math/Vector2.js";
import { Mesh } from "three/src/objects/Mesh.js";
import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import { WebGLRenderTarget } from "three/src/renderers/WebGLRenderTarget.js";
import { Scene } from "three/src/scenes/Scene.js";
import { CanvasTexture } from "three/src/textures/CanvasTexture.js";

const DEFAULT_CHARSET =
  " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform sampler2D uSource;
uniform sampler2D uAtlas;
uniform vec2 uSize;
uniform vec2 uGrid;
uniform vec2 uCellSize;
uniform vec2 uBlockOrigin;
uniform vec2 uAtlasSize;
uniform vec2 uAtlasCellSize;
uniform vec2 uGlyphSize;
uniform vec2 uGradientCenter;
uniform float uGradientRadius;
uniform float uAtlasColumns;
uniform float uAtlasPadding;
uniform float uMaxCharIndex;
uniform bool uInvert;
uniform bool uPremultipliedAlpha;

vec3 straightColor(vec4 color) {
    // Transparent scene materials blend into a premultiplied RGBA target.
    return color.a > 0.0 ? clamp(color.rgb / color.a, 0.0, 1.0) : vec3(0.0);
}

void main() {
    vec4 source = texture2D(uSource, vUv);
    vec3 sourceColor = straightColor(source);
    vec2 position = vec2(vUv.x, 1.0 - vUv.y) * uSize;
    vec2 glyphPosition = (position - uBlockOrigin) / uCellSize;
    vec2 cell = floor(glyphPosition);
    float glyphAlpha = 0.0;

    if (all(greaterThanEqual(cell, vec2(0.0))) && all(lessThan(cell, uGrid))) {
        vec2 cellUv = (cell + 0.5) / uGrid;
        cellUv.y = 1.0 - cellUv.y;
        vec4 cellColor = texture2D(uSource, cellUv);

        // getImageData previously selected a space for fully transparent cells.
        if (cellColor.a > 0.0) {
            vec3 rgb = straightColor(cellColor);
            float gray = dot(rgb, vec3(0.3, 0.6, 0.1));
            float index = floor((1.0 - gray) * uMaxCharIndex);
            if (uInvert) index = uMaxCharIndex - index;
            vec2 atlasCell = vec2(mod(index, uAtlasColumns), floor(index / uAtlasColumns));
            vec2 atlasPixel = atlasCell * uAtlasCellSize + uAtlasPadding
                + fract(glyphPosition) * uGlyphSize;
            glyphAlpha = texture2D(uAtlas, atlasPixel / uAtlasSize).a;
        }
    }

    float gradient = clamp(distance(position, uGradientCenter) / uGradientRadius, 0.0, 1.0);
    vec3 pink = vec3(255.0, 97.0, 136.0) / 255.0;
    vec3 orange = vec3(252.0, 152.0, 103.0) / 255.0;
    vec3 yellow = vec3(255.0, 216.0, 102.0) / 255.0;
    vec3 glyphColor = gradient < 0.5
        ? mix(pink, orange, gradient * 2.0)
        : mix(orange, yellow, gradient * 2.0 - 1.0);

    // Source-over with difference blending, including both layers' alpha.
    float alpha = source.a + glyphAlpha * (1.0 - source.a);
    vec3 color = sourceColor * source.a * (1.0 - glyphAlpha)
        + glyphColor * glyphAlpha * (1.0 - source.a)
        + abs(sourceColor - glyphColor) * source.a * glyphAlpha;
    if (!uPremultipliedAlpha && alpha > 0.0) color /= alpha;
    gl_FragColor = vec4(color, alpha);
}
`;

export interface GpuAsciiFilterOptions {
  fontSize?: number;
  fontFamily?: string;
  charset?: string;
  invert?: boolean;
}

export class GpuAsciiFilter {
  readonly domElement: HTMLDivElement;
  private readonly renderer: WebGLRenderer;
  private readonly fontSize: number;
  private readonly fontFamily: string;
  private readonly charset: string;
  private readonly atlasCanvas: HTMLCanvasElement;
  private readonly atlasContext: CanvasRenderingContext2D;
  private atlas: CanvasTexture | null = null;
  private readonly sourceTarget: WebGLRenderTarget;
  private readonly outputScene = new Scene();
  private readonly outputCamera = new Camera();
  private readonly outputGeometry = new PlaneGeometry(2, 2);
  private readonly outputMaterial: ShaderMaterial;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private cols = 0;
  private rows = 0;
  private rectLeft = 0;
  private rectTop = 0;
  private mouseX = 0;
  private mouseY = 0;
  private hueDegrees = 0;
  private lastHueDegrees = Infinity;

  constructor(
    renderer: WebGLRenderer,
    {
      fontSize = 12,
      fontFamily = "'Courier New', monospace",
      charset = DEFAULT_CHARSET,
      invert = true,
    }: GpuAsciiFilterOptions = {},
  ) {
    this.renderer = renderer;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.charset = charset || " ";
    this.domElement = document.createElement("div");
    this.domElement.className = "ascii-text-root";
    Object.assign(this.domElement.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
    });
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.domElement.appendChild(this.renderer.domElement);

    this.atlasCanvas = document.createElement("canvas");
    const atlasContext = this.atlasCanvas.getContext("2d");
    if (!atlasContext) throw new Error("Cannot create the ASCII glyph atlas.");
    this.atlasContext = atlasContext;

    this.sourceTarget = new WebGLRenderTarget(1, 1, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      generateMipmaps: false,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.outputMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uSource: { value: this.sourceTarget.texture },
        uAtlas: { value: null },
        uSize: { value: new Vector2() },
        uGrid: { value: new Vector2() },
        uCellSize: { value: new Vector2() },
        uBlockOrigin: { value: new Vector2() },
        uAtlasSize: { value: new Vector2() },
        uAtlasCellSize: { value: new Vector2() },
        uGlyphSize: { value: new Vector2() },
        uGradientCenter: { value: new Vector2() },
        uGradientRadius: { value: 1 },
        uAtlasColumns: { value: 1 },
        uAtlasPadding: { value: 1 },
        uMaxCharIndex: { value: this.charset.length - 1 },
        uInvert: { value: invert },
        uPremultipliedAlpha: {
          value:
            renderer.getContext().getContextAttributes()?.premultipliedAlpha ??
            true,
        },
      },
    });
    const outputMesh = new Mesh(this.outputGeometry, this.outputMaterial);
    outputMesh.frustumCulled = false;
    this.outputScene.add(outputMesh);
    this.rebuildAtlas();
    document.addEventListener("mousemove", this.onMouseMove);
  }

  setSize(width: number, height: number) {
    const nextWidth = Math.floor(width);
    const nextHeight = Math.floor(height);
    const nextDpr = window.devicePixelRatio || 1;
    if (nextWidth <= 0 || nextHeight <= 0) return;
    this.cacheBounds();
    if (
      nextWidth === this.width &&
      nextHeight === this.height &&
      nextDpr === this.dpr
    ) {
      return;
    }

    this.width = nextWidth;
    this.height = nextHeight;
    this.dpr = nextDpr;
    this.mouseX = nextWidth / 2;
    this.mouseY = nextHeight / 2;
    this.rebuildAtlas();
    this.renderer.setPixelRatio(nextDpr);
    this.renderer.setSize(nextWidth, nextHeight);
  }

  refreshFont() {
    this.cacheBounds();
    this.dpr = window.devicePixelRatio || 1;
    this.rebuildAtlas();
    if (this.width > 0 && this.height > 0) {
      this.renderer.setPixelRatio(this.dpr);
      this.renderer.setSize(this.width, this.height);
    }
  }

  private cacheBounds() {
    const rect = this.domElement.getBoundingClientRect();
    this.rectLeft = rect.left;
    this.rectTop = rect.top;
    const uniforms = this.outputMaterial.uniforms;
    uniforms.uGradientCenter.value.set(
      window.innerWidth / 2 - rect.left,
      window.innerHeight / 2 - rect.top,
    );
    uniforms.uGradientRadius.value = Math.max(
      1,
      Math.hypot(window.innerWidth / 2, window.innerHeight / 2),
    );
  }

  private rebuildAtlas() {
    const ctx = this.atlasContext;
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    const metrics = ctx.measureText("A");
    const charWidth = metrics.width || this.fontSize * 0.6;
    const ascent = metrics.fontBoundingBoxAscent || this.fontSize * 0.8;
    const descent = metrics.fontBoundingBoxDescent || this.fontSize * 0.2;
    const baseline = (this.fontSize - (ascent + descent)) / 2 + ascent;
    const padding = Math.ceil(this.dpr) + 1;
    const atlasCellWidth = Math.ceil(charWidth * this.dpr) + padding * 2;
    const atlasCellHeight = Math.ceil(this.fontSize * this.dpr) + padding * 2;
    const atlasColumns = Math.ceil(Math.sqrt(this.charset.length));
    const atlasRows = Math.ceil(this.charset.length / atlasColumns);

    this.atlasCanvas.width = atlasCellWidth * atlasColumns;
    this.atlasCanvas.height = atlasCellHeight * atlasRows;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ffffff";
    for (let index = 0; index < this.charset.length; index++) {
      const x = ((index % atlasColumns) * atlasCellWidth + padding) / this.dpr;
      const y =
        (Math.floor(index / atlasColumns) * atlasCellHeight + padding) /
          this.dpr +
        baseline;
      ctx.fillText(this.charset[index], x, y);
    }

    this.atlas?.dispose();
    this.atlas = new CanvasTexture(this.atlasCanvas);
    // Atlas coordinates use the same top-left origin as Canvas text drawing.
    this.atlas.flipY = false;
    this.atlas.minFilter = LinearFilter;
    this.atlas.magFilter = LinearFilter;
    this.atlas.generateMipmaps = false;

    this.cols = Math.floor(this.width / charWidth);
    this.rows = Math.floor(this.height / this.fontSize);
    this.sourceTarget.setSize(Math.max(1, this.cols), Math.max(1, this.rows));
    const uniforms = this.outputMaterial.uniforms;
    uniforms.uAtlas.value = this.atlas;
    uniforms.uSize.value.set(this.width, this.height);
    uniforms.uGrid.value.set(this.cols, this.rows);
    uniforms.uCellSize.value.set(charWidth, this.fontSize);
    uniforms.uBlockOrigin.value.set(
      (this.width - this.cols * charWidth) / 2,
      (this.height - this.rows * this.fontSize) / 2,
    );
    uniforms.uAtlasSize.value.set(
      this.atlasCanvas.width,
      this.atlasCanvas.height,
    );
    uniforms.uAtlasCellSize.value.set(atlasCellWidth, atlasCellHeight);
    uniforms.uGlyphSize.value.set(
      charWidth * this.dpr,
      this.fontSize * this.dpr,
    );
    uniforms.uAtlasColumns.value = atlasColumns;
    uniforms.uAtlasPadding.value = padding;
  }

  render(scene: Scene, camera: Camera) {
    if (this.cols <= 0 || this.rows <= 0) return;
    const previousTarget = this.renderer.getRenderTarget();
    try {
      this.renderer.setRenderTarget(this.sourceTarget);
      this.renderer.render(scene, camera);
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.outputScene, this.outputCamera);
    } finally {
      this.renderer.setRenderTarget(previousTarget);
    }
    this.updateHue();
  }

  private onMouseMove = (event: MouseEvent) => {
    this.mouseX = event.clientX - this.rectLeft;
    this.mouseY = event.clientY - this.rectTop;
  };

  private updateHue() {
    const degrees =
      (Math.atan2(this.mouseY - this.height / 2, this.mouseX - this.width / 2) *
        180) /
      Math.PI;
    this.hueDegrees += (degrees - this.hueDegrees) * 0.075;
    if (Math.abs(this.hueDegrees - this.lastHueDegrees) < 0.25) return;
    this.lastHueDegrees = this.hueDegrees;
    this.domElement.style.filter = `hue-rotate(${this.hueDegrees.toFixed(1)}deg)`;
  }

  dispose() {
    document.removeEventListener("mousemove", this.onMouseMove);
    this.sourceTarget.dispose();
    this.atlas?.dispose();
    this.outputMaterial.dispose();
    this.outputGeometry.dispose();
    this.outputScene.clear();
  }
}
