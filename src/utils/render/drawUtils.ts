import { getImage } from "./constants";
import { Camera, Building } from "@/stores/types";
import { worldToScreen } from "@/utils/coords";

export const drawBuilding = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number, h: number,
  imageSrc?: string, name?: string, type?: string
) => {
  if (!imageSrc || typeof window === "undefined") return;
  const img = getImage(imageSrc);
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, w, h);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, w, h);
  }
  
  // Vẽ tên building (trừ secondary và torch)
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

export function drawTorchEffect(ctx: CanvasRenderingContext2D, fx: number, fy: number, size: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(fx, fy, size * 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,140,0,0.2)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(fx, fy, size * 1.4, 0, Math.PI * 2);
  ctx.fillStyle = "#ff6600";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(fx, fy, size, 0, Math.PI * 2);
  ctx.fillStyle = "#ffcc00";
  ctx.fill();
  ctx.restore();
}

export function drawSecondaryLabel(ctx: CanvasRenderingContext2D, b: Building, camera: Camera, cX: number, cY: number, sTile: number) {
  const { x, y } = worldToScreen(b.worldX, b.worldY, camera, cX, cY);
  const bW = b.width * sTile;
  ctx.save();
  const fontSize = 14;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = "center";
  const textWidth = ctx.measureText(b.name).width;
  const labelX = x + bW / 2;
  const labelY = y - 10;

  // Box đen
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 4;
  ctx.fillRect(labelX - textWidth/2 - 10, labelY - fontSize - 6, textWidth + 20, fontSize + 12);
  // Viền vàng
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 2;
  ctx.strokeRect(labelX - textWidth/2 - 10, labelY - fontSize - 6, textWidth + 20, fontSize + 12);
  // Chữ vàng
  ctx.fillStyle = "#ffd700";
  ctx.fillText(b.name, labelX, labelY - 4);
  // Mũi tên nhỏ
  ctx.beginPath();
  ctx.moveTo(labelX - 6, labelY + 2);
  ctx.lineTo(labelX, labelY + 10);
  ctx.lineTo(labelX + 6, labelY + 2);
  ctx.fill();
  ctx.restore();
}