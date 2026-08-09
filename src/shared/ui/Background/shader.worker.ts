// Home 背景の渦シェーダーを OffscreenCanvas 上で描画する Worker。
// GLSL のコンパイルと毎フレーム描画を Worker スレッドへ逃がし、メインスレッドの
// ロングタスク(TBT)を解消する。バンドラ相性を避けるため OGL は使わず素の WebGL で、
// メインスレッド実装(Background.tsx)と同一のフルスクリーン三角形 + GLSL を描画する。

export type ShaderWorkerUniforms = {
  uSpinRotation: number;
  uSpinSpeed: number;
  uOffset: [number, number];
  uColor1: [number, number, number, number];
  uColor2: [number, number, number, number];
  uColor3: [number, number, number, number];
  uContrast: number;
  uLighting: number;
  uSpinAmount: number;
  uPixelFilter: number;
  uSpinEase: number;
  uIsRotate: boolean;
  uFogDensity: number;
  uNoiseStrength: number;
  uPulseFrequency: number;
};

export type ShaderWorkerMessage =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      width: number;
      height: number;
      dpr: number;
      maxFps: number;
      uniforms: ShaderWorkerUniforms;
    }
  | { type: "resize"; width: number; height: number; dpr: number }
  | { type: "mouse"; x: number; y: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "dispose" };

type ShaderWorkerInitMessage = Extract<ShaderWorkerMessage, { type: "init" }>;

// Background.tsx の vertexShader / fragmentShader と同一(Worker を自己完結にするため複製)
const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

#define PI 3.14159265359

uniform float iTime;
uniform vec3 iResolution;
uniform float uSpinRotation;
uniform float uSpinSpeed;
uniform vec2 uOffset;
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;
uniform float uContrast;
uniform float uLighting;
uniform float uSpinAmount;
uniform float uPixelFilter;
uniform float uSpinEase;
uniform bool uIsRotate;
uniform vec2 uMouse;
uniform float uFogDensity;
uniform float uNoiseStrength;
uniform float uPulseFrequency;

varying vec2 vUv;

// ノイズ関数
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // 4つの角のランダム値
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // スムーズ補間
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// FBM（フラクショナルブラウン運動）で複雑なノイズを生成
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    // オクターブを重ねる
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

vec4 effect(vec2 screenSize, vec2 screen_coords) {
    float pixel_size = length(screenSize.xy) / uPixelFilter;
    vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy) - uOffset;
    float uv_len = length(uv);

    // 時間に基づく回転速度
    float speed = (uSpinRotation * uSpinEase * 0.2);
    if(uIsRotate){
       speed = iTime * speed;
    }
    speed += 302.2;

    // マウスの影響を強化
    float mouseInfluence = (uMouse.x * 2.0 - 1.0) * 0.25;
    float mouseYInfluence = (uMouse.y * 2.0 - 1.0) * 0.15;
    speed += mouseInfluence * 0.5;

    // 回転角度の計算
    float pulseEffect = sin(iTime * uPulseFrequency) * 0.1;
    float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 *
        (uSpinAmount * (uv_len + pulseEffect) + (1.0 - uSpinAmount));

    vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
    uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);

    // スケーリングを調整
    uv *= 25.0 + 10.0 * sin(iTime * 0.2);

    // 基本速度
    float baseSpeed = iTime * uSpinSpeed;
    float modSpeed = baseSpeed + mouseInfluence * 3.0 + mouseYInfluence * 2.0;

    vec2 uv2 = vec2(uv.x + uv.y);

    // 複雑なパターン生成
    for(int i = 0; i < 5; i++) {
        float noiseVal = fbm(uv * 0.1 + iTime * 0.05);
        uv2 += sin(max(uv.x, uv.y) + noiseVal) + uv;
        uv += 0.5 * vec2(
            cos(5.1123314 + 0.353 * uv2.y + modSpeed * 0.131121 + noiseVal),
            sin(uv2.x - 0.113 * modSpeed + noiseVal * 2.0)
        );
        uv -= cos(uv.x + uv.y + iTime * 0.1) - sin(uv.x * 0.711 - uv.y);

        // より複雑なねじれを追加
        uv = vec2(
            uv.x * cos(noiseVal * 0.2) - uv.y * sin(noiseVal * 0.2),
            uv.x * sin(noiseVal * 0.2) + uv.y * cos(noiseVal * 0.2)
        );
    }

    // コントラスト調整
    float contrast_mod = (0.25 * uContrast + 0.5 * uSpinAmount + 1.2);
    float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));

    // フォグエフェクト
    float fogFactor = 1.0 - exp(-uv_len * uFogDensity);

    // カラーミックス
    float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
    float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
    float c3p = 1.0 - min(1.0, c1p + c2p);

    // 照明効果
    float light = (uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) +
                 uLighting * max(c2p * 5.0 - 4.0, 0.0);

    // 時間ベースの色の揺らぎ
    vec4 color1Mod = uColor1 + vec4(sin(iTime * 0.3) * 0.1, sin(iTime * 0.4) * 0.1, sin(iTime * 0.5) * 0.1, 0.0);
    vec4 color2Mod = uColor2 + vec4(sin(iTime * 0.4) * 0.1, sin(iTime * 0.5) * 0.1, sin(iTime * 0.6) * 0.1, 0.0);

    // ノイズの追加
    float noiseEffect = (random(uv + iTime) - 0.5) * uNoiseStrength;

    // 最終的な色の計算
    vec4 baseColor = (0.3 / uContrast) * color1Mod +
                    (1.0 - 0.3 / uContrast) * (color1Mod * c1p + color2Mod * c2p +
                    vec4(c3p * uColor3.rgb, c3p * uColor1.a)) + light;

    // フォグとノイズを適用
    vec4 fogColor = mix(baseColor, uColor3, fogFactor * 0.7);
    return fogColor + vec4(noiseEffect, noiseEffect, noiseEffect, 0.0);
}

void main() {
    vec2 uv = vUv * iResolution.xy;
    gl_FragColor = effect(iResolution.xy, uv);
}
`;

// OGL Renderer のデフォルトに合わせたコンテキスト属性
const contextAttributes: WebGLContextAttributes = {
  alpha: false,
  depth: true,
  stencil: false,
  antialias: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  powerPreference: "default",
};

type UniformName =
  | "iTime"
  | "iResolution"
  | keyof ShaderWorkerUniforms
  | "uMouse";

const uniformNames: UniformName[] = [
  "iTime",
  "iResolution",
  "uSpinRotation",
  "uSpinSpeed",
  "uOffset",
  "uColor1",
  "uColor2",
  "uColor3",
  "uContrast",
  "uLighting",
  "uSpinAmount",
  "uPixelFilter",
  "uSpinEase",
  "uIsRotate",
  "uMouse",
  "uFogDensity",
  "uNoiseStrength",
  "uPulseFrequency",
];

let canvas: OffscreenCanvas | null = null;
// 使用する API は WebGL1 の範囲のみ(WebGL2 コンテキストでもそのまま動く)
let gl: WebGLRenderingContext | null = null;
const locations = new Map<UniformName, WebGLUniformLocation | null>();
let frameInterval = 0;
let timerId: ReturnType<typeof setTimeout> | null = null;
let timeOffset = 0;
let pausedAt: number | null = null;

const loc = (name: UniformName): WebGLUniformLocation | null =>
  locations.get(name) ?? null;

const renderFrame = () => {
  if (!gl) return;
  gl.uniform1f(loc("iTime"), (performance.now() - timeOffset) * 0.001);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
};

const tick = () => {
  timerId = setTimeout(tick, frameInterval);
  renderFrame();
};

const startLoop = () => {
  if (!gl || timerId !== null) return;
  timerId = setTimeout(tick, frameInterval);
};

const stopLoop = () => {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
};

const setSize = (width: number, height: number, dpr: number) => {
  if (!canvas) return;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  if (!gl) return;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform3f(
    loc("iResolution"),
    canvas.width,
    canvas.height,
    canvas.width / canvas.height,
  );
};

const compileShader = (
  context: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null => {
  const shader = context.createShader(type);
  if (!shader) return null;
  context.shaderSource(shader, source);
  context.compileShader(shader);
  return shader;
};

const init = (message: ShaderWorkerInitMessage) => {
  canvas = message.canvas;
  // OGL Renderer と同じく webgl2 → webgl の順で取得を試す
  gl = (message.canvas.getContext("webgl2", contextAttributes) ??
    message.canvas.getContext(
      "webgl",
      contextAttributes,
    )) as WebGLRenderingContext | null;
  if (!gl) return;

  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    gl = null;
    return;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      "shader.worker: program link failed",
      gl.getProgramInfoLog(program),
    );
    gl = null;
    return;
  }
  // biome-ignore lint/correctness/useHookAtTopLevel: WebGL の useProgram で React フックではない
  gl.useProgram(program);

  // OGL の Triangle 相当のフルスクリーン三角形
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const positionLocation = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 2, 0, 0, 2]),
    gl.STATIC_DRAW,
  );
  const uvLocation = gl.getAttribLocation(program, "uv");
  gl.enableVertexAttribArray(uvLocation);
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

  locations.clear();
  for (const name of uniformNames) {
    locations.set(name, gl.getUniformLocation(program, name));
  }

  const u = message.uniforms;
  gl.uniform1f(loc("iTime"), 0);
  gl.uniform1f(loc("uSpinRotation"), u.uSpinRotation);
  gl.uniform1f(loc("uSpinSpeed"), u.uSpinSpeed);
  gl.uniform2f(loc("uOffset"), u.uOffset[0], u.uOffset[1]);
  gl.uniform4f(
    loc("uColor1"),
    u.uColor1[0],
    u.uColor1[1],
    u.uColor1[2],
    u.uColor1[3],
  );
  gl.uniform4f(
    loc("uColor2"),
    u.uColor2[0],
    u.uColor2[1],
    u.uColor2[2],
    u.uColor2[3],
  );
  gl.uniform4f(
    loc("uColor3"),
    u.uColor3[0],
    u.uColor3[1],
    u.uColor3[2],
    u.uColor3[3],
  );
  gl.uniform1f(loc("uContrast"), u.uContrast);
  gl.uniform1f(loc("uLighting"), u.uLighting);
  gl.uniform1f(loc("uSpinAmount"), u.uSpinAmount);
  gl.uniform1f(loc("uPixelFilter"), u.uPixelFilter);
  gl.uniform1f(loc("uSpinEase"), u.uSpinEase);
  gl.uniform1i(loc("uIsRotate"), u.uIsRotate ? 1 : 0);
  gl.uniform2f(loc("uMouse"), 0.5, 0.5);
  gl.uniform1f(loc("uFogDensity"), u.uFogDensity);
  gl.uniform1f(loc("uNoiseStrength"), u.uNoiseStrength);
  gl.uniform1f(loc("uPulseFrequency"), u.uPulseFrequency);

  gl.clearColor(0, 0, 0, 1);
  setSize(message.width, message.height, message.dpr);

  frameInterval = message.maxFps > 0 ? 1000 / message.maxFps : 0;
  timeOffset = 0;
  pausedAt = null;
  startLoop();
};

const pause = () => {
  if (pausedAt === null) {
    pausedAt = performance.now();
  }
  stopLoop();
};

const resume = () => {
  if (pausedAt !== null) {
    // 停止中の経過時間を差し引いて iTime の連続性を保つ
    timeOffset += performance.now() - pausedAt;
    pausedAt = null;
  }
  startLoop();
};

const dispose = () => {
  stopLoop();
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  gl = null;
  canvas = null;
  self.close();
};

self.onmessage = (event: MessageEvent<ShaderWorkerMessage>) => {
  const message = event.data;
  switch (message.type) {
    case "init":
      init(message);
      break;
    case "resize":
      setSize(message.width, message.height, message.dpr);
      break;
    case "mouse":
      if (gl) {
        gl.uniform2f(loc("uMouse"), message.x, message.y);
      }
      break;
    case "pause":
      pause();
      break;
    case "resume":
      resume();
      break;
    case "dispose":
      dispose();
      break;
  }
};
