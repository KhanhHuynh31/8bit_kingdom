// src/components/Content/shared/labBattleShared.tsx
import React from "react";
import {
  PLANT_MODULES,
  type ModuleType,
  type PlantModule,
  type PlantColors,
} from "@/constants/plantModules";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BulletState {
  id: number;
  row: number;
  x: number;
  color: string;
  size: number;
  dmg: number;
  speed: number;
  effectName?: string;
}

export interface ZombieState {
  id: number;
  row: number;
  x: number;
  hp: number;
  maxHp: number;
  speed: number;
  t: number;
  frozen: number;
  poison: number;
}

export interface PlacedPlant {
  uid: number;
  plantId: number;
  row: number;
  col: number;
  t: number;
  lastShot: number;
}

export interface BattleState {
  plants: PlacedPlant[];
  zombies: ZombieState[];
  bullets: BulletState[];
  frame: number;
  running: boolean;
  zombieId: number;
  bulletId: number;
  nextSpawn: number;
  wave: number;
  defeated: number;
  survived: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
export const ROWS = 5;
export const BATTLE_W = 660;
export const BATTLE_H = 300;
export const ROW_H = BATTLE_H / ROWS;
export const COL_X: readonly number[] = [40, 90, 140, 190];
export const MODULE_ORDER: ModuleType[] = [
  "head",
  "body",
  "leaf",
  "eye",
  "acc",
];

// ─── Canvas Helpers ──────────────────────────────────────────────────────────
export function canvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawTinted(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  hexColor: string,
) {
  const off = new OffscreenCanvas(w, h);
  const offCtx = off.getContext("2d")!;
  offCtx.drawImage(img, 0, 0, w, h);
  offCtx.globalCompositeOperation = "multiply";
  offCtx.fillStyle = hexColor;
  offCtx.fillRect(0, 0, w, h);
  offCtx.globalCompositeOperation = "destination-in";
  offCtx.drawImage(img, 0, 0, w, h);
  ctx.drawImage(off, x, y, w, h);
}

export function drawPlantOnCanvas(
  ctx: CanvasRenderingContext2D,
  mods: Record<ModuleType, string | null>,
  colors: PlantColors,
  t: number,
  canvasW: number,
  canvasH: number,
  imageCache?: Record<string, HTMLImageElement>,
) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  const cx = canvasW / 2;
  const sc = canvasW / 160;

  // Squash & Stretch
  const breathe = Math.sin(t * 0.04) * 0.035;
  ctx.save();
  ctx.translate(cx, canvasH * 0.6);
  ctx.scale(1 - breathe * 0.5, 1 + breathe);
  ctx.translate(-cx, -canvasH * 0.6);

  const headY = canvasH * 0.32;
  const headR = 28 * sc;

  // Lá
  if (mods.leaf) {
    const leafMod = PLANT_MODULES.leaf.find((x) => x.id === mods.leaf);
    if (leafMod) {
      if (leafMod.imagePath && imageCache?.[leafMod.imagePath]) {
        const img = imageCache[leafMod.imagePath];
        drawTinted(ctx, img, cx - 48, canvasH * 0.38, 38, 28, colors.leaf);
        drawTinted(ctx, img, cx + 10, canvasH * 0.38, 38, 28, colors.leaf);
      } else {
        for (const [side, rot] of [
          [-32, -0.3],
          [32, 0.3],
        ] as [number, number][]) {
          ctx.save();
          ctx.translate(cx + side * sc, canvasH * 0.44);
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, 22 * sc, 10 * sc, 0, 0, Math.PI * 2);
          ctx.fillStyle = colors.leaf;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(-18 * sc, 0);
          ctx.lineTo(18 * sc, 0);
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // Thân
  {
    const stemX = cx - 11 * sc;
    const stemY = canvasH * 0.47;
    const stemW = 22 * sc;
    const stemH = canvasH * 0.38;
    ctx.beginPath();
    canvasRoundRect(ctx, stemX, stemY, stemW, stemH, 7 * sc);
    ctx.fillStyle = colors.body;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 7 * sc, stemY + 10 * sc + i * 15 * sc);
      ctx.lineTo(cx + 7 * sc, stemY + 14 * sc + i * 15 * sc);
      ctx.stroke();
    }
  }

  // Đầu
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fillStyle = colors.head;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - headR * 0.3, headY - headR * 0.3, headR * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();

  // Mắt
  if (mods.eye) {
    const eyeOffX = headR * 0.35;
    const eyeRY = headR * 0.32;
    const eyeRX = headR * 0.25;
    for (const side of [-1, 1]) {
      const ex = cx + side * eyeOffX;
      ctx.beginPath();
      ctx.ellipse(ex, headY, eyeRX, eyeRY, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors.eye;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ex, headY, eyeRX * 0.5, eyeRY * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        ex + eyeRX * 0.2,
        headY - eyeRY * 0.2,
        eyeRX * 0.22,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
    }
  }

  // Miệng
  ctx.beginPath();
  ctx.arc(cx, headY + headR * 0.4, headR * 0.3, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2 * sc;
  ctx.stroke();

  // Phụ kiện
  if (mods.acc) {
    const sway = Math.sin(t * 0.06) * 3 * sc;
    ctx.save();
    ctx.translate(cx + sway, 0);
    const crownBase = headY - headR - 2 * sc;
    ctx.beginPath();
    ctx.moveTo(-16 * sc, crownBase);
    ctx.lineTo(-10 * sc, crownBase - 18 * sc);
    ctx.lineTo(-2 * sc, crownBase - 12 * sc);
    ctx.lineTo(0, crownBase - 22 * sc);
    ctx.lineTo(2 * sc, crownBase - 12 * sc);
    ctx.lineTo(10 * sc, crownBase - 18 * sc);
    ctx.lineTo(16 * sc, crownBase);
    ctx.closePath();
    ctx.fillStyle = colors.acc;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, crownBase - 22 * sc, 3 * sc, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // Chậu
  const potY = canvasH * 0.83;
  ctx.beginPath();
  canvasRoundRect(ctx, cx - 18 * sc, potY, 36 * sc, 14 * sc, 3 * sc);
  ctx.fillStyle = "#92400e";
  ctx.fill();
  ctx.beginPath();
  canvasRoundRect(ctx, cx - 14 * sc, potY - 5 * sc, 28 * sc, 6 * sc, 3 * sc);
  ctx.fillStyle = "#b45309";
  ctx.fill();
}

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
        gap: 5,
        padding: "6px 14px",
        borderRadius: "8px 8px 0 0",
        border: `1px solid ${active ? "rgba(107,76,30,0.5)" : "transparent"}`,
        borderBottom: active ? "1px solid transparent" : "none",
        background: active ? "rgba(38,24,10,0.9)" : "transparent",
        color: active ? "#e8c97a" : "#9ca3af",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: active ? "default" : "pointer",
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

export function ActionBtn({
  onClick,
  color,
  children,
}: {
  onClick: () => void;
  color: "green" | "amber" | "red" | "gray";
  children: React.ReactNode;
}) {
  const s = {
    green: {
      bg: "rgba(16,50,16,0.8)",
      border: "rgba(60,180,60,0.5)",
      fg: "#86efac",
    },
    amber: {
      bg: "rgba(50,36,8,0.8)",
      border: "rgba(200,150,30,0.5)",
      fg: "#fbbf24",
    },
    red: {
      bg: "rgba(50,10,10,0.8)",
      border: "rgba(200,60,60,0.5)",
      fg: "#f87171",
    },
    gray: {
      bg: "rgba(20,20,20,0.5)",
      border: "rgba(80,80,80,0.4)",
      fg: "#9ca3af",
    },
  }[color];
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "7px 12px",
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        width: "100%",
      }}
    >
      {children}
    </button>
  );
}

export function ModuleBtn({
  mod,
  selected,
  onClick,
}: {
  mod: PlantModule;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={`STR +${mod.str}  AGI +${mod.agi}  LCK +${mod.lck}`}
      style={{
        width: 58,
        height: 58,
        borderRadius: 8,
        flexShrink: 0,
        border: selected
          ? "2px solid #3b82f6"
          : "1px solid rgba(107,76,30,0.5)",
        background: selected ? "rgba(59,130,246,0.15)" : "rgba(38,24,10,0.7)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        transform: selected ? "scale(1.07)" : "scale(1)",
        transition: "border-color 0.15s, transform 0.1s, background 0.15s",
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{mod.icon}</span>
      <span
        style={{
          fontSize: 9,
          color: selected ? "#93c5fd" : "#9ca3af",
          fontWeight: 500,
          maxWidth: 52,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {mod.label}
      </span>
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
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          marginBottom: 3,
        }}
      >
        <span style={{ color: "#9ca3af" }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{value}</span>
      </div>
      <div
        style={{
          height: 5,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, (value / 25) * 100)}%`,
            background: color,
            borderRadius: 3,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
