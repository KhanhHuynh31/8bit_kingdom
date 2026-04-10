import { Camera, Building } from "@/stores/types";
import { worldToScreen } from "@/utils/coords";
import { GLOBAL_COLORS } from "./constants";

let fogOffscreen: OffscreenCanvas | null = null;
let fogCtx: OffscreenCanvasRenderingContext2D | null = null;

export function drawBackground(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number, sTile: number, cX: number, cY: number) {
  const startCol = Math.floor((-cX - cam.offsetX) / sTile) - 1;
  const endCol = Math.ceil((w - cX - cam.offsetX) / sTile) + 1;
  const startRow = Math.floor((-cY - cam.offsetY) / sTile) - 1;
  const endRow = Math.ceil((h - cY - cam.offsetY) / sTile) + 1;
  const tileW = Math.ceil(sTile) + 1;

  for (let col = startCol; col <= endCol; col++) {
    const x = Math.floor(cX + cam.offsetX + col * sTile);
    for (let row = startRow; row <= endRow; row++) {
      const y = Math.floor(cY + cam.offsetY + row * sTile);
      ctx.fillStyle = GLOBAL_COLORS.grass[Math.abs(col + row) % 2 === 0 ? 1 : 0];
      ctx.fillRect(x, y, tileW, tileW);
    }
  }
}

export function drawFogOfWar(ctx: CanvasRenderingContext2D, camera: Camera, width: number, height: number, sTile: number, cX: number, cY: number, time: number, visibleBuildings: Building[]) {
  if (!fogOffscreen || fogOffscreen.width !== width || fogOffscreen.height !== height) {
    fogOffscreen = new OffscreenCanvas(width, height);
    fogCtx = fogOffscreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
  }
  const fctx = fogCtx!;
  fctx.fillStyle = GLOBAL_COLORS.fog;
  fctx.fillRect(0, 0, width, height);
  fctx.globalCompositeOperation = "destination-out";

  for (const b of visibleBuildings) {
    const { x, y } = worldToScreen(b.worldX, b.worldY, camera, cX, cY);
    const bW = b.width * sTile;
    const bH = b.height * sTile;
    const centerX = x + bW / 2;
    const centerY = y + bH / 2;
    
    let visionRadius = Math.max(bW, bH) * 2.5;
    if (b.type === "torch") {
      visionRadius = sTile * 4 + Math.sin(time / 200) * (4 * camera.zoom);
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