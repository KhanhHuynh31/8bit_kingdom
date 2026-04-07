import { TILE_SIZE, BUILDINGS } from "@/constants/map";
import { worldToScreen } from "@/utils/coords";
import type { Camera, Building } from "@/types";
import { torchStates } from "@/utils/torchManager";
import { drawWeatherEffects } from "@/utils/drawWeatherEffects";

// ─── IMAGE CACHE ────────────────────────────────────────────────────────────
const imageCache = new Map<string, HTMLImageElement>();

function getImage(src: string): HTMLImageElement {
  if (!imageCache.has(src)) {
    const img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  return imageCache.get(src)!;
}

// ─── OFFSCREEN FOG CANVAS ───────────────────────────────────────────────────
let fogOffscreen: OffscreenCanvas | null = null;
let fogCtx: OffscreenCanvasRenderingContext2D | null = null;
let fogW = 0;
let fogH = 0;

function getFogCanvas(width: number, height: number) {
  if (!fogOffscreen || fogW !== width || fogH !== height) {
    fogOffscreen = new OffscreenCanvas(width, height);
    fogCtx = fogOffscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
    fogW = width;
    fogH = height;
  }
  return { fogOffscreen, fogCtx: fogCtx! };
}

// ─── SHAKE NOISE TABLE ──────────────────────────────────────────────────────
const NOISE_TABLE = new Float32Array(256);
for (let i = 0; i < 256; i++) NOISE_TABLE[i] = (Math.random() - 0.5) * 2;
let noiseIdx = 0;
function nextNoise(): number {
  noiseIdx = (noiseIdx + 1) & 255;
  return NOISE_TABLE[noiseIdx];
}

// ─── COLORS ─────────────────────────────────────────────────────────────────
const GLOBAL_COLORS = {
  grass: ["#5a9e3a", "#4d8c30"],
  fog: "rgba(15, 25, 35, 0.9)",
};

// ─── DRAW BUILDING ──────────────────────────────────────────────────────────
export const drawBuilding = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number,
  h: number,
  imageSrc?: string,
  name?: string,
  type?: string,
) => {
  if (!imageSrc || typeof window === "undefined") return;

  const img = getImage(imageSrc);

  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, w, h);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, w, h);
  }

  if (name && w >= 32 && type !== "secondary" && type !== "torch") {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = 3;
    const fontSize = Math.max(10, Math.floor(w * 0.15));
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.strokeText(name, w / 2, -6);
    ctx.fillText(name, w / 2, -6);
    ctx.restore();
  }
};

// ─── FOG OF WAR ─────────────────────────────────────────────────────────────
function drawFogOfWar(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  width: number,
  height: number,
  sTile: number,
  cX: number,
  cY: number,
  time: number,
  // Nhận visible buildings để fog tính đúng (bao gồm tuna khi visible)
  visibleBuildings: Building[],
) {
  const { fogOffscreen, fogCtx: fctx } = getFogCanvas(width, height);

  fctx.fillStyle = GLOBAL_COLORS.fog;
  fctx.fillRect(0, 0, width, height);
  fctx.globalCompositeOperation = "destination-out";

  for (let i = 0; i < visibleBuildings.length; i++) {
    const b = visibleBuildings[i];
    const { x, y } = worldToScreen(b.worldX, b.worldY, camera, cX, cY);
    const bW = b.width * sTile;
    const bH = b.height * sTile;

    const maxVision = Math.max(bW, bH) * 2.5;
    if (
      x + bW + maxVision < 0 ||
      x - maxVision > width ||
      y + bH + maxVision < 0 ||
      y - maxVision > height
    ) continue;

    const centerX = x + bW / 2;
    const centerY = y + bH / 2;

    let visionRadius = maxVision;
    if (b.type === "torch") {
      const flicker = Math.sin(time / 200) * (4 * camera.zoom);
      visionRadius = sTile * 4 + flicker;
    }

    const grad = fctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, visionRadius);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.6)");
    grad.addColorStop(1, "rgba(255,255,255,0)");

    fctx.fillStyle = grad;
    fctx.beginPath();
    fctx.arc(centerX, centerY, visionRadius, 0, Math.PI * 2);
    fctx.fill();
  }

  fctx.globalCompositeOperation = "source-over";
  ctx.drawImage(fogOffscreen, 0, 0);
}

// ─── BACKGROUND ─────────────────────────────────────────────────────────────
function drawBackground(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  w: number,
  h: number,
  sTile: number,
  cX: number,
  cY: number,
) {
  const startCol = Math.floor((-cX - cam.offsetX) / sTile) - 1;
  const endCol   = Math.ceil((w - cX - cam.offsetX) / sTile) + 1;
  const startRow = Math.floor((-cY - cam.offsetY) / sTile) - 1;
  const endRow   = Math.ceil((h - cY - cam.offsetY) / sTile) + 1;
  const tileW = Math.ceil(sTile) + 1;

  for (let col = startCol; col <= endCol; col++) {
    const x = Math.floor(cX + cam.offsetX + col * sTile);
    for (let row = startRow; row <= endRow; row++) {
      const y = Math.floor(cY + cam.offsetY + row * sTile);
      ctx.fillStyle = GLOBAL_COLORS.grass[(Math.abs(col + row)) % 2 === 0 ? 1 : 0];
      ctx.fillRect(x, y, tileW, tileW);
    }
  }
}

// ─── TORCH EFFECT ───────────────────────────────────────────────────────────
function drawTorchEffect(
  ctx: CanvasRenderingContext2D,
  flameX: number,
  flameY: number,
  size: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  ctx.arc(flameX, flameY, size * 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,140,0,0.2)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(flameX, flameY, size * 1.4, 0, Math.PI * 2);
  ctx.fillStyle = "#ff6600";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(flameX, flameY, size, 0, Math.PI * 2);
  ctx.fillStyle = "#ffcc00";
  ctx.fill();

  ctx.restore();
}

// ─── RENDER PARAMS ──────────────────────────────────────────────────────────
// Truyền tuna state xuống renderMap để renderer biết cách vẽ tuna
export interface TunaRenderState {
  visible: boolean;       // tuna đã trồi lên xong
  animating: boolean;     // đang trong animation trồi lên
  animOffsetY: number;    // world-unit offset (dương = lệch xuống dưới)
  diving: boolean;        // đang trong animation lặn xuống
}

// ─── MAIN RENDER ────────────────────────────────────────────────────────────
export function renderMap(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  width: number,
  height: number,
  hoveredBuildingId: string | null,
  status: string,
  weather: string,
  tunaState?: TunaRenderState, // optional để backward-compatible
) {
  const cX = width / 2;
  const cY = height / 2;
  const sTile = TILE_SIZE * camera.zoom;
  const time = performance.now();
  const isDarkTime = status === "night" || status === "evening";

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // 1. Background
  drawBackground(ctx, camera, width, height, sTile, cX, cY);

  // ── Chuẩn bị danh sách buildings để render ──────────────────────────────
  // Lọc hidden, tính renderWorldY (áp dụng animOffsetY cho tuna),
  // sau đó sort theo zIndex để vật thể z cao hơn render đè lên trên.
  type RenderEntry = {
    b: Building;
    renderWorldY: number; // worldY sau khi áp dụng offset
  };

  const entries: RenderEntry[] = [];

  for (let i = 0; i < BUILDINGS.length; i++) {
    const b = BUILDINGS[i];

    // ── Xử lý tuna ──────────────────────────────────────────────────────
    if (b.id === "tuna") {
      // Ẩn hoàn toàn nếu không có animation nào đang chạy và chưa visible
      const ts = tunaState;
      if (!ts?.visible && !ts?.animating && !ts?.diving) continue;

      const renderWorldY = b.worldY + (ts?.animOffsetY ?? 0);
      entries.push({ b, renderWorldY });
      continue;
    }

    entries.push({ b, renderWorldY: b.worldY });
  }

  // Sort theo zIndex (thấp trước, cao sau = render đè lên)
  entries.sort((a, b) => (a.b.zIndex ?? 0) - (b.b.zIndex ?? 0));

  // 2. Fog of war — chỉ tính cho buildings đang visible
  const visibleBuildings = entries.map((e) => e.b);
  drawFogOfWar(ctx, camera, width, height, sTile, cX, cY, time, visibleBuildings);

  // 3. Buildings — render theo thứ tự zIndex
  for (let i = 0; i < entries.length; i++) {
    const { b, renderWorldY } = entries[i];

    // Dùng renderWorldY (đã áp dụng animOffsetY) thay b.worldY
    const { x, y } = worldToScreen(b.worldX, renderWorldY, camera, cX, cY);
    const bW = b.width * sTile;
    const bH = b.height * sTile;

    // Frustum culling
    if (x + bW < 0 || x > width || y + bH < 0 || y > height) continue;

    let offsetX = 0;
    let offsetY = 0;

    if (b.animationType === "float") {
      offsetY = Math.sin(time / 500) * (6 * camera.zoom);
    }

    const isHovered = hoveredBuildingId === b.id;

    if (b.animationType === "shake_on_click" && isHovered) {
      offsetX = nextNoise() * (2 * camera.zoom);
      offsetY += nextNoise() * (2 * camera.zoom);
    }

    if (isHovered) {
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.fillRect(x + offsetX, y + offsetY, bW, bH);
      ctx.strokeRect(x + offsetX, y + offsetY, bW, bH);
    }

    ctx.save();
    ctx.translate(x + offsetX, y + offsetY);
    drawBuilding(ctx, bW, bH, b.imageSrc, b.name, b.type);
    ctx.restore();

    // Torch effect
    if (b.type === "torch") {
      if (!torchStates[b.id]) {
        torchStates[b.id] = { alpha: isDarkTime ? 1 : 0, userPreference: null };
      }
      const state = torchStates[b.id];
      const isOn = state.userPreference !== null ? state.userPreference : isDarkTime;
      state.alpha += ((isOn ? 1 : 0) - state.alpha) * (isOn ? 0.08 : 0.15);

      if (state.alpha > 0.01) {
        const flicker = Math.sin(time / 100) * 2;
        const size = (5 + flicker) * camera.zoom * state.alpha;
        drawTorchEffect(
          ctx,
          x + bW / 2 + offsetX,
          y + offsetY,
          size,
          state.alpha,
        );
      }
    }
  }

  // 4. Weather
  drawWeatherEffects(ctx, width, height, weather);
}