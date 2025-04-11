import { Renderer, Program, Mesh, Triangle } from "ogl";
import { useEffect, useRef } from "react";

interface MysteriousShaderProps {
    spinRotation?: number;
    spinSpeed?: number;
    offset?: [number, number];
    color1?: string; // HEX e.g., "#41009c"
    color2?: string; // HEX e.g., "#8a00c2"
    color3?: string; // HEX e.g., "#000516"
    contrast?: number;
    lighting?: number;
    spinAmount?: number;
    pixelFilter?: number;
    spinEase?: number;
    isRotate?: boolean;
    mouseInteraction?: boolean;
    fogDensity?: number;
    noiseStrength?: number;
    pulseFrequency?: number;
}

function hexToVec4(hex: string): [number, number, number, number] {
    const hexStr = hex.replace("#", "");
    let r = 0,
        g = 0,
        b = 0,
        a = 1;
    if (hexStr.length === 6) {
        r = parseInt(hexStr.slice(0, 2), 16) / 255;
        g = parseInt(hexStr.slice(2, 4), 16) / 255;
        b = parseInt(hexStr.slice(4, 6), 16) / 255;
    } else if (hexStr.length === 8) {
        r = parseInt(hexStr.slice(0, 2), 16) / 255;
        g = parseInt(hexStr.slice(2, 4), 16) / 255;
        b = parseInt(hexStr.slice(4, 6), 16) / 255;
        a = parseInt(hexStr.slice(6, 8), 16) / 255;
    }
    return [r, g, b, a];
}

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

export default function MysteriousShader({
    spinRotation = -1.5,
    spinSpeed = 5.0,
    offset = [0.0, 0.0],
    color1 = "#41009c", // 深い紫
    color2 = "#8a00c2", // 明るい紫
    color3 = "#000516", // 暗い青紫
    contrast = 4.0,
    lighting = 0.5,
    spinAmount = 0.35,
    pixelFilter = 820.0,
    spinEase = 1.2,
    isRotate = true,
    mouseInteraction = true,
    fogDensity = 0.15,
    noiseStrength = 0.03,
    pulseFrequency = 0.4
}: MysteriousShaderProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const renderer = new Renderer();
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 1);

        const geometry = new Triangle(gl);
        const program = new Program(gl, {
            vertex: vertexShader,
            fragment: fragmentShader,
            uniforms: {
                iTime: { value: 0 },
                iResolution: {
                    value: [
                        gl.canvas.width,
                        gl.canvas.height,
                        gl.canvas.width / gl.canvas.height,
                    ],
                },
                uSpinRotation: { value: spinRotation },
                uSpinSpeed: { value: spinSpeed },
                uOffset: { value: offset },
                uColor1: { value: hexToVec4(color1) },
                uColor2: { value: hexToVec4(color2) },
                uColor3: { value: hexToVec4(color3) },
                uContrast: { value: contrast },
                uLighting: { value: lighting },
                uSpinAmount: { value: spinAmount },
                uPixelFilter: { value: pixelFilter },
                uSpinEase: { value: spinEase },
                uIsRotate: { value: isRotate },
                uMouse: { value: [0.5, 0.5] },
                uFogDensity: { value: fogDensity },
                uNoiseStrength: { value: noiseStrength },
                uPulseFrequency: { value: pulseFrequency }
            },
        });

        function resize() {
            renderer.setSize(container.offsetWidth, container.offsetHeight);
            if (program) {
                program.uniforms.iResolution.value = [
                    gl.canvas.width,
                    gl.canvas.height,
                    gl.canvas.width / gl.canvas.height,
                ];
            }
        }
        window.addEventListener("resize", resize);
        resize();

        const mesh = new Mesh(gl, { geometry, program });
        let animationFrameId: number;

        function update(time: number) {
            animationFrameId = requestAnimationFrame(update);
            program.uniforms.iTime.value = time * 0.001;
            renderer.render({ scene: mesh });
        }
        animationFrameId = requestAnimationFrame(update);
        container.appendChild(gl.canvas);

        function handleMouseMove(e: MouseEvent) {
            if (!mouseInteraction) return;
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - (e.clientY - rect.top) / rect.height;
            program.uniforms.uMouse.value = [x, y];
        }
        container.addEventListener("mousemove", handleMouseMove);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resize);
            container.removeEventListener("mousemove", handleMouseMove);
            container.removeChild(gl.canvas);
            gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
    }, [
        spinRotation,
        spinSpeed,
        offset,
        color1,
        color2,
        color3,
        contrast,
        lighting,
        spinAmount,
        pixelFilter,
        spinEase,
        isRotate,
        mouseInteraction,
        fogDensity,
        noiseStrength,
        pulseFrequency
    ]);

    return <div ref={containerRef} className="w-full h-full" />;
}
