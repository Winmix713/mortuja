// ========================================================================================
// TYPE DEFINITIONS
// ========================================================================================

export type BlendMode = "normal" | "screen" | "overlay" | "soft-light" | "color-dodge" | "multiply";

export type GradientType = "none" | "linear" | "radial" | "conic";
export type LayerAnimationType = "none" | "pulse" | "breathe" | "orbit" | "drift" | "flicker" | "colorShift";

export interface GradientStop {
  color: string;
  position: number; // 0–100
}

export interface LayerAnimation {
  type: LayerAnimationType;
  duration: number; // seconds
  delay: number; // seconds
  enabled: boolean;
}

export type ClipMaskFit = "cover" | "contain" | "fill" | "none";

export interface ClipMask {
  imageUrl: string;
  fit: ClipMaskFit;
}

export interface GlowLayer {
  id: string;
  name: string;
  active: boolean;
  color: string;
  blur: number;
  opacity: number;
  width: number;
  height: number;
  x: number;
  y: number;
  blendMode: BlendMode;
  groupId?: string;
  clipMask?: ClipMask;
  gradient?: GradientType;
  gradientAngle?: number;
  gradientStops?: GradientStop[];
  layerAnimation?: LayerAnimation;
}

export interface LayerGroup {
  id: string;
  name: string;
  active: boolean;
  opacity: number;
  blendMode: BlendMode;
  collapsed: boolean;
}

export interface CopiedLayerStyle {
  color: string;
  blur: number;
  opacity: number;
  blendMode: BlendMode;
  gradient?: GradientType;
  gradientAngle?: number;
  gradientStops?: GradientStop[];
  clipMask?: ClipMask;
}

export type CanvasBackground = "dark" | "light" | "gradient-sunset" | "gradient-ocean" | "gradient-aurora" | "mesh-dark" | "mesh-light" | "dots" | "transparent";

export interface AnimationConfig {
  enabled: boolean;
  type: LayerAnimationType; // Egységesítve a LayerAnimationType-al
  duration: number;
}

export interface GlowState {
  power: boolean;
  themeMode: "dark" | "light";
  globalScale: number;
  globalOpacity: number;
  noiseEnabled: boolean;
  noiseIntensity: number;
  layers: GlowLayer[];
  selectedLayerId: string | null;
  animation: AnimationConfig;
  canvasBackground?: CanvasBackground;
  groups?: LayerGroup[];
  selectedGroupId?: string | null;
  copiedStyle?: CopiedLayerStyle | null;
}

export interface Preset {
  id: string;
  name: string;
  timestamp: number;
  favorite: boolean;
  state: GlowState;
}

// ========================================================================================
// TYPE GUARDS / VALIDATION
// ========================================================================================

export function isValidGlowState(obj: any): obj is GlowState {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.power !== "boolean") return false;
  if (typeof obj.themeMode !== "string") return false;
  if (typeof obj.globalScale !== "number") return false;
  if (typeof obj.globalOpacity !== "number") return false;
  if (typeof obj.noiseEnabled !== "boolean") return false;
  if (typeof obj.noiseIntensity !== "number") return false;
  if (!Array.isArray(obj.layers)) return false;
  if (obj.animation && typeof obj.animation.enabled !== "boolean") return false;
  return true;
}

// ========================================================================================
// INITIAL STATE
// ========================================================================================

const DEFAULT_LAYERS: GlowLayer[] = [
{ id: "layer-1", name: "Base Glow", active: true, color: "#4ade80", blur: 180, opacity: 0.4, width: 600, height: 380, x: -50, y: -50, blendMode: "screen" },
{ id: "layer-2", name: "Core Glow", active: true, color: "#22c55e", blur: 120, opacity: 0.6, width: 440, height: 440, x: 30, y: 50, blendMode: "screen" },
{ id: "layer-3", name: "Inner Light", active: true, color: "#86efac", blur: 60, opacity: 1, width: 360, height: 300, x: 70, y: 100, blendMode: "screen" },
{ id: "layer-highlight", name: "Highlight", active: true, color: "#FFFFFF", blur: 80, opacity: 0.4, width: 240, height: 180, x: 130, y: 130, blendMode: "normal" }];


export const INITIAL_STATE: GlowState = {
  power: true,
  themeMode: "dark",
  globalScale: 0.9,
  globalOpacity: 1,
  noiseEnabled: true,
  noiseIntensity: 0.35,
  layers: DEFAULT_LAYERS,
  selectedLayerId: "layer-1",
  animation: { enabled: false, type: "breathe", duration: 3 },
  groups: [],
  selectedGroupId: null,
  copiedStyle: null,
  canvasBackground: "dark"
};

// ========================================================================================
// CSS EXPORT & HELPERS
// ========================================================================================

export function getLayerBackground(layer: GlowLayer): string {
  if (layer.gradient && layer.gradient !== "none" && layer.gradientStops && layer.gradientStops.length >= 2) {
    const stops = layer.gradientStops.map((s) => `${s.color} ${s.position}%`).join(", ");
    const angle = layer.gradientAngle ?? 90;
    switch (layer.gradient) {
      case "linear":return `linear-gradient(${angle}deg, ${stops})`;
      case "radial":return `radial-gradient(circle, ${stops})`;
      case "conic":return `conic-gradient(from ${angle}deg, ${stops})`;
    }
  }
  return layer.color;
}

export function getLayerAnimationKeyframes(name: string, type: LayerAnimationType, layer: GlowLayer): string {
  switch (type) {
    case "pulse":return `@keyframes ${name} {\n  0%, 100% { transform: translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) scale(1); opacity: ${layer.opacity}; }\n  50% { transform: translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) scale(1.15); opacity: ${layer.opacity * 0.7}; }\n}`;
    case "breathe":return `@keyframes ${name} {\n  0%, 100% { transform: translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) scale(1); filter: blur(${layer.blur}px); }\n  50% { transform: translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) scale(1.08); filter: blur(${layer.blur * 1.3}px); }\n}`;
    case "orbit":return `@keyframes ${name} {\n  0% { transform: translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) rotate(0deg) translateX(30px) rotate(0deg); }\n  100% { transform: translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) rotate(360deg) translateX(30px) rotate(-360deg); }\n}`;
    case "drift":return `@keyframes ${name} {\n  0%, 100% { transform: translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px); }\n  25% { transform: translate(-50%, -50%) translate(${layer.x + 20}px, ${layer.y - 15}px); }\n  50% { transform: translate(-50%, -50%) translate(${layer.x - 10}px, ${layer.y + 20}px); }\n  75% { transform: translate(-50%, -50%) translate(${layer.x + 15}px, ${layer.y + 10}px); }\n}`;
    case "flicker":return `@keyframes ${name} {\n  0%, 100% { opacity: ${layer.opacity}; }\n  10% { opacity: ${layer.opacity * 0.4}; }\n  20% { opacity: ${layer.opacity}; }\n  40% { opacity: ${layer.opacity * 0.6}; }\n  60% { opacity: ${layer.opacity * 0.9}; }\n  80% { opacity: ${layer.opacity * 0.3}; }\n  90% { opacity: ${layer.opacity}; }\n}`;
    case "colorShift":return `@keyframes ${name} {\n  0%, 100% { filter: blur(${layer.blur}px) hue-rotate(0deg); }\n  50% { filter: blur(${layer.blur}px) hue-rotate(60deg); }\n}`;
    default:return "";
  }
}

export function exportAsCSS(state: GlowState): string {
  const layersCss = state.layers.filter((l) => l.active).map((layer, i) => {
    const bg = getLayerBackground(layer);
    const isGradient = layer.gradient && layer.gradient !== "none";
    const anim = layer.layerAnimation;
    const hasAnim = anim && anim.enabled && anim.type !== "none";
    const animName = hasAnim ? `glow-layer-${i + 1}-anim` : "";
    const group = layer.groupId ? (state.groups || []).find((g) => g.id === layer.groupId) : null;
    const effectiveOpacity = group ? layer.opacity * group.opacity : layer.opacity;
    const effectiveBlend = group ? group.blendMode : layer.blendMode;
    const clipMaskCss = layer.clipMask?.imageUrl ?
    `\n  -webkit-mask-image: url(${layer.clipMask.imageUrl});\n  mask-image: url(${layer.clipMask.imageUrl});\n  -webkit-mask-size: ${layer.clipMask.fit};\n  mask-size: ${layer.clipMask.fit};\n  -webkit-mask-repeat: no-repeat;\n  mask-repeat: no-repeat;\n  -webkit-mask-position: center;\n  mask-position: center;` :
    "";

    return `
.glow-layer-${i + 1} {
  /* ${layer.name} */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px);
  width: ${layer.width}px;
  height: ${layer.height}px;
  ${isGradient ? `background: ${bg}` : `background-color: ${bg}`};
  filter: blur(${layer.blur}px);
  opacity: ${effectiveOpacity};
  border-radius: 9999px;
  mix-blend-mode: ${effectiveBlend};
  z-index: ${i};
  pointer-events: auto;${hasAnim ? `\n  animation: ${animName} ${anim!.duration}s ease-in-out ${anim!.delay}s infinite;` : ""}${clipMaskCss}
}${hasAnim ? `\n${getLayerAnimationKeyframes(animName, anim!.type, layer)}` : ""}`;
  }).join("\n");

  const globalAnimRule = state.animation.enabled ? `\n  animation: breathe ${state.animation.duration}s ease-in-out infinite;` : "";
  const animationKeyframes = state.animation.enabled ? `\n@keyframes breathe {\n  0%, 100% { opacity: ${state.globalOpacity}; transform: scale(${state.globalScale}); }\n  50% { opacity: ${state.globalOpacity * 0.8}; transform: scale(${state.globalScale * 1.05}); }\n}\n` : "";

  return `/* Glow Effect CSS */${animationKeyframes}
.glow-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform: scale(${state.globalScale});
  opacity: ${state.globalOpacity};${globalAnimRule}
}
${layersCss}
${state.noiseEnabled ? `
.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.15'/></svg>");
  background-repeat: repeat;
  background-size: 200px 200px;
  opacity: ${state.noiseIntensity};
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 100;
}` : ""}`;
}

// ========================================================================================
// DEBOUNCE
// ========================================================================================

export function debounce<T extends (...args: any[]) => any>(
func: T,
wait: number)
: (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}