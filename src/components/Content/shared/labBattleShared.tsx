"use client";
import React from "react";
import type { SavedPlant } from "@/stores/slices/plantSlice";
import { PLANT_MODULES, type ModuleType } from "@/constants/plantModules";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlacedModule = {
  instanceId: string;
  type: ModuleType;
  moduleId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  visible: boolean;
  zIndex: number;
  tint: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const MODULE_ORDER: ModuleType[] = ["body", "head", "leaf", "eye", "acc"];

export const PREVIEW_W = 220;
export const PREVIEW_H = 280;
export const MODULE_BASE_SIZE = 110;

// ─── UI Components ────────────────────────────────────────────────────────────

export function TabBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 14px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${active ? "rgba(200,168,112,0.6)" : "rgba(107,76,30,0.3)"}`,
        background: active ? "rgba(200,168,112,0.12)" : "transparent",
        color: active ? "#f0e3c5" : "#8b7355",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

export function ActionBtn({
  onClick,
  color = "gray",
  children,
}: {
  onClick: () => void;
  color?: "green" | "red" | "gray" | "amber";
  children: React.ReactNode;
}) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.5)", text: "#86efac" },
    red:   { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.5)", text: "#fca5a5" },
    amber: { bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.5)",  text: "#fde68a" },
    gray:  { bg: "rgba(156,163,175,0.1)",  border: "rgba(156,163,175,0.3)", text: "#9ca3af" },
  };
  const c = colors[color] ?? colors.gray;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.text,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

export function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / 25) * 100));
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export function canvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ─── Battle State ─────────────────────────────────────────────────────────────

export interface BattleState {
  plants: {
    uid: number;
    plantId: number;
    row: number;
    col: number;
    t: number;
    lastShot: number;
  }[];
  zombies: {
    id: number;
    row: number;
    x: number;
    hp: number;
    maxHp: number;
    speed: number;
    t: number;
    frozen: number;
    poison: number;
  }[];
  bullets: {
    id: number;
    row: number;
    x: number;
    color: string;
    size: number;
    dmg: number;
    speed: number;
    effectName?: string;
    // ▼ NEW: custom bullet design fields
    layoutJson?: string;
    animTime: number;
  }[];
  frame: number;
  running: boolean;
  zombieId: number;
  bulletId: number;
  nextSpawn: number;
  wave: number;
  defeated: number;
  survived: number;
}

// ─── Image Cache Helper ───────────────────────────────────────────────────────

export function loadImage(
  cache: Record<string, HTMLImageElement>,
  imagePath: string,
): HTMLImageElement | null {
  if (!imagePath) return null;
  if (cache[imagePath]) return cache[imagePath];
  const img = new window.Image();
  img.src = imagePath;
  cache[imagePath] = img;
  return img;
}

// ─── Parse Placed Modules from SavedPlant ────────────────────────────────────

export function parsePlacedModules(plant: SavedPlant): PlacedModule[] {
  if (!plant.layoutJson) return [];
  try {
    const parsed = JSON.parse(plant.layoutJson) as unknown;
    if (Array.isArray(parsed)) return parsed as PlacedModule[];
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const instances: PlacedModule[] = [];
      let counter = 0;
      const obj = parsed as Record<string, { x: number; y: number; scale: number; visible: boolean; zIndex: number; tint?: string }>;
      (Object.keys(obj) as ModuleType[]).forEach((type) => {
        const t = obj[type];
        const snap = plant.partSnapshots?.[type];
        if (!snap?.imagePath) return;
        const modData = PLANT_MODULES[type].find((m) => m.imagePath === snap.imagePath);
        if (!modData) return;
        instances.push({
          instanceId: `legacy_${counter++}`,
          type,
          moduleId: modData.id,
          x: t.x,
          y: t.y,
          scale: t.scale,
          rotation: 0,
          visible: t.visible,
          zIndex: t.zIndex,
          tint: t.tint ?? "",
        });
      });
      return instances;
    }
  } catch {
    // fall through
  }
  return [];
}

// ─── Draw Plant Modules onto a Canvas ────────────────────────────────────────

export function drawPlantModulesOnCanvas(
  ctx: CanvasRenderingContext2D,
  instances: PlacedModule[],
  imageCache: Record<string, HTMLImageElement>,
  canvasW: number,
  canvasH: number,
  time: number,
  partSnapshots?: SavedPlant["partSnapshots"],
) {
  if (instances.length === 0) return;

  const scale = Math.min(canvasW / PREVIEW_W, canvasH / PREVIEW_H);
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const bob = Math.sin(time * 0.06) * 2;

  const sorted = [...instances]
    .filter((i) => i.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const inst of sorted) {
    const modData = PLANT_MODULES[inst.type].find((m) => m.id === inst.moduleId);
    const imagePath = modData?.imagePath ?? partSnapshots?.[inst.type]?.imagePath ?? "";
    if (!imagePath) continue;

    const img = loadImage(imageCache, imagePath);
    if (!img?.complete || img.naturalWidth === 0) continue;

    const baseSize = MODULE_BASE_SIZE * inst.scale;
    const size = Math.round(scale * baseSize);
    const drawX = cx + inst.x * scale - size / 2;
    const drawY = cy + inst.y * scale - size / 2 + bob;

    ctx.save();

    if (inst.rotation !== 0) {
      ctx.translate(drawX + size / 2, drawY + size / 2);
      ctx.rotate((inst.rotation * Math.PI) / 180);
      ctx.translate(-(drawX + size / 2), -(drawY + size / 2));
    }

    const tint = inst.tint || partSnapshots?.[inst.type]?.tint || "";
    if (tint) {
      ctx.drawImage(img, drawX, drawY, size, size);
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = tint;
      ctx.fillRect(drawX, drawY, size, size);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(img, drawX, drawY, size, size);
    }

    ctx.restore();
  }
}