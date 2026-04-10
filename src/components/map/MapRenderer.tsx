import { TILE_SIZE, BUILDINGS as STATIC_BUILDINGS } from "@/constants/map";
import { worldToScreen } from "@/utils/coords";
import type { Camera, Building } from "@/stores/types";
import { torchStates } from "@/utils/torchManager";
import { drawWeatherEffects } from "@/utils/drawWeatherEffects";
import { drawBackground, drawFogOfWar } from "@/utils/render/fogAndBg";
import { nextNoise } from "@/utils/render/constants";
import { drawBuilding, drawSecondaryLabel, drawTorchEffect } from "@/utils/render/drawUtils";



export interface TunaRenderState {
  visible: boolean;
  animating: boolean;
  animOffsetY: number;
  diving: boolean;
  isEvolved: boolean;
}

export function renderMap(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  width: number,
  height: number,
  hoveredBuildingId: string | null,
  status: string,
  weather: string,
  tunaState?: TunaRenderState,
  buildings: Building[] = STATIC_BUILDINGS,
  clickedSecondary?: { id: string; name: string } | null,
) {
  const cX = width / 2;
  const cY = height / 2;
  const sTile = TILE_SIZE * camera.zoom;
  const time = performance.now();
  const isDarkTime = status === "night" || status === "evening";

  // 1. Clear & Background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  drawBackground(ctx, camera, width, height, sTile, cX, cY);

  // 2. Prepare Entries & Sorting
  const entries: { b: Building; renderY: number }[] = [];
  for (const b of buildings) {
    if (b.id === "tuna") {
      if (!tunaState?.visible && !tunaState?.animating && !tunaState?.diving) continue;
      const tunaInstance = { ...b };
      if (tunaState?.isEvolved) {
        tunaInstance.imageSrc = "/assets/decorate/tuna_evolved.png";
        tunaInstance.name = "Tuna Đại Đế";
      }
      entries.push({ b: tunaInstance, renderY: b.worldY + (tunaState?.animOffsetY ?? 0) });
      continue;
    }
    if (!b.interactive) continue;
    entries.push({ b, renderY: b.worldY });
  }
  entries.sort((a, b) => (a.b.zIndex ?? 0) - (b.b.zIndex ?? 0));

  // 3. Fog of War
  drawFogOfWar(ctx, camera, width, height, sTile, cX, cY, time, entries.map(e => e.b));

  // 4. Main Rendering Loop
  for (const { b, renderY } of entries) {
    const { x, y } = worldToScreen(b.worldX, renderY, camera, cX, cY);
    const bW = b.width * sTile;
    const bH = b.height * sTile;

    if (x + bW < 0 || x > width || y + bH < 0 || y > height) continue;

    let ox = 0, oy = 0;
    // Animation: Float (Tuna, v.v)
    if (b.animationType === "float") {
      oy = Math.sin(time / 500) * (6 * camera.zoom);
    }
    // Animation: Shake on Hover
    const isHovered = hoveredBuildingId === b.id;
    if (b.animationType === "shake_on_click" && isHovered) {
      ox = nextNoise() * (2 * camera.zoom);
      oy += nextNoise() * (2 * camera.zoom);
    }

    // Draw Highlight (Hover)
    if (isHovered) {
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.fillRect(x + ox, y + oy, bW, bH);
      ctx.strokeRect(x + ox, y + oy, bW, bH);
    }

    // Draw Main Building
    ctx.save();
    ctx.translate(x + ox, y + oy);
    drawBuilding(ctx, bW, bH, b.imageSrc, b.name, b.type);
    ctx.restore();

    // Torch Lighting Logic
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
        drawTorchEffect(ctx, x + bW / 2 + ox, y + oy, size, state.alpha);
      }
    }
  }

  // 5. Click Label cho Secondary Building
  if (clickedSecondary) {
    const b = buildings.find(b => b.id === clickedSecondary.id);
    if (b) drawSecondaryLabel(ctx, b, camera, cX, cY, sTile);
  }

  // 6. Weather Effects (Rain/Snow)
  drawWeatherEffects(ctx, width, height, weather);
}