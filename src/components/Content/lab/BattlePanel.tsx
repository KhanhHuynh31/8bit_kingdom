"use client";
// src/components/Content/BattlePanel.tsx

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useMapStore } from "@/stores/useMapStore";
import {
  Trash2,
  Swords,
  FlaskConical,
  Shovel,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Info,
} from "lucide-react";
import { type SavedPlant } from "@/stores/slices/plantSlice";
import {
  TabBtn,
  ActionBtn,
  canvasRoundRect,
  parsePlacedModules,
  drawPlantModulesOnCanvas,
  type PlacedModule,
} from "../shared/labBattleShared";
import { PLANT_MODULES } from "@/constants/plantModules";
import {
  drawBulletOnCanvas,
  type PlacedBulletModule,
} from "@/constants/bulletModules";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_BATTLE_W = 1080;
const CELL_SIZE = 120;
const MIN_ROWS = 1;
const MAX_ROWS = 8;
const DEFAULT_ROWS = 5;
const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.0;
const TARGET_MIN_HEIGHT = 400;

const COLS = Math.floor(BASE_BATTLE_W / CELL_SIZE);
const COL_CENTERS = Array.from(
  { length: COLS },
  (_, i) => i * CELL_SIZE + CELL_SIZE / 2,
);

// ─── Zombie type definitions ──────────────────────────────────────────────────

export type ZombieKind =
  | "normal"
  | "fast"
  | "tank"
  | "armored"
  | "toxic"
  | "giant"
  | "stealth"
  | "splitter";

export interface ZombieTypeDef {
  kind: ZombieKind;
  label: string;
  emoji: string;
  baseHp: number;
  hpScale: number;
  baseSpeed: number;
  speedJitter: number;
  sizeScale: number;
  scoreValue: number;
  color: string;
  description: string;
  isArmored?: boolean;
  isToxic?: boolean;
  isGiant?: boolean;
  isStealth?: boolean;
  splitCount?: number;
  minWave: number;
  weight: number;
}

export const ZOMBIE_TYPES: ZombieTypeDef[] = [
  {
    kind: "normal", label: "Zombie Thường", emoji: "🧟",
    baseHp: 80, hpScale: 20, baseSpeed: 0.38, speedJitter: 0.25,
    sizeScale: 1.0, scoreValue: 1, color: "#86efac",
    description: "Zombie cơ bản, không có gì đặc biệt.",
    minWave: 0, weight: 40,
  },
  {
    kind: "fast", label: "Zombie Tốc Độ", emoji: "💨",
    baseHp: 45, hpScale: 12, baseSpeed: 0.85, speedJitter: 0.3,
    sizeScale: 0.72, scoreValue: 2, color: "#38bdf8",
    description: "Nhỏ và cực kỳ nhanh nhẹn.",
    minWave: 1, weight: 22,
  },
  {
    kind: "tank", label: "Zombie Tăng", emoji: "🦣",
    baseHp: 300, hpScale: 60, baseSpeed: 0.18, speedJitter: 0.08,
    sizeScale: 1.55, scoreValue: 4, color: "#f97316",
    description: "Cực kỳ bền, di chuyển chậm chạp.",
    minWave: 2, weight: 12,
  },
  {
    kind: "armored", label: "Zombie Giáp", emoji: "🛡️",
    baseHp: 160, hpScale: 35, baseSpeed: 0.28, speedJitter: 0.12,
    sizeScale: 1.1, scoreValue: 3, color: "#a78bfa",
    description: "Có giáp kim loại, giảm sát thương cho đến khi giáp vỡ.",
    isArmored: true,
    minWave: 2, weight: 15,
  },
  {
    kind: "toxic", label: "Zombie Độc", emoji: "☣️",
    baseHp: 95, hpScale: 22, baseSpeed: 0.30, speedJitter: 0.15,
    sizeScale: 1.05, scoreValue: 3, color: "#4ade80",
    description: "Khi chết để lại vũng độc làm chậm mọi thứ.",
    isToxic: true,
    minWave: 3, weight: 14,
  },
  {
    kind: "giant", label: "Zombie Khổng Lồ", emoji: "👹",
    baseHp: 550, hpScale: 90, baseSpeed: 0.12, speedJitter: 0.05,
    sizeScale: 2.0, scoreValue: 8, color: "#ef4444",
    description: "Boss khổng lồ, chỉ xuất hiện khi bạn chọn nó.",
    isGiant: true,
    minWave: 4, weight: 5,
  },
  {
    kind: "stealth", label: "Zombie Tàng Hình", emoji: "👻",
    baseHp: 70, hpScale: 18, baseSpeed: 0.44, speedJitter: 0.2,
    sizeScale: 0.85, scoreValue: 3, color: "#e879f9",
    description: "Trong suốt, khó nhìn thấy trên chiến trường.",
    isStealth: true,
    minWave: 3, weight: 12,
  },
  {
    kind: "splitter", label: "Zombie Phân Thân", emoji: "🪲",
    baseHp: 110, hpScale: 25, baseSpeed: 0.32, speedJitter: 0.18,
    sizeScale: 1.15, scoreValue: 4, color: "#fbbf24",
    description: "Khi chết tách thành 2 zombie nhanh nhỏ hơn.",
    splitCount: 2,
    minWave: 3, weight: 12,
  },
];

// ─── Zombie instance ──────────────────────────────────────────────────────────

export interface ZombieInstance {
  id: number;
  kind: ZombieKind;
  row: number;
  x: number;
  hp: number;
  maxHp: number;
  armorHp: number;
  maxArmorHp: number;
  speed: number;
  t: number;
  frozen: number;
  poison: number;
  sizeScale: number;
  scoreValue: number;
}

// ─── Extended BattleState ─────────────────────────────────────────────────────

interface ExtendedBattleState {
  plants: {
    uid: number;
    plantId: number;
    row: number;
    col: number;
    t: number;
    lastShot: number;
  }[];
  zombies: ZombieInstance[];
  bullets: {
    id: number;
    row: number;
    x: number;
    color: string;
    size: number;
    dmg: number;
    speed: number;
    effectName?: string;
    layoutJson?: string;
    animTime: number;
  }[];
  toxicPuddles: { x: number; row: number; t: number; maxT: number }[];
  frame: number;
  running: boolean;
  zombieId: number;
  bulletId: number;
  defeated: number;
  survived: number;
}

// ─── Zombie factory ──────────────────────────────────────────────────────────

function makeZombieOfKind(
  id: number,
  def: ZombieTypeDef,
  rows: number,
): ZombieInstance {
  const hp = Math.round(def.baseHp);
  const armorHp = def.isArmored ? Math.round(hp * 0.4) : 0;
  return {
    id,
    kind: def.kind,
    row: Math.floor(Math.random() * rows),
    x: BASE_BATTLE_W + 30 + Math.random() * 60,
    hp,
    maxHp: hp,
    armorHp,
    maxArmorHp: armorHp,
    speed: def.baseSpeed + Math.random() * def.speedJitter,
    t: 0,
    frozen: 0,
    poison: 0,
    sizeScale: def.sizeScale,
    scoreValue: def.scoreValue,
  };
}

// ─── Image cache ──────────────────────────────────────────────────────────────

function loadImageIntoCache(
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

// ─── Bullet instance cache ────────────────────────────────────────────────────

const bulletInstancesCache: Record<string, PlacedBulletModule[]> = {};

function getParsedBulletInstances(layoutJson: string): PlacedBulletModule[] {
  if (bulletInstancesCache[layoutJson]) return bulletInstancesCache[layoutJson];
  try {
    const parsed = JSON.parse(layoutJson) as unknown;
    if (Array.isArray(parsed)) {
      bulletInstancesCache[layoutJson] = parsed as PlacedBulletModule[];
      return bulletInstancesCache[layoutJson];
    }
  } catch {
    // ignore
  }
  bulletInstancesCache[layoutJson] = [];
  return [];
}

// ─── Pre-render zombie sprites ────────────────────────────────────────────────

const SPRITE_SIZE = 160; // đủ lớn cho mọi sizeScale tối đa (2.0 * ROW_H*0.58 ≈ 139)

function createZombieSprite(def: ZombieTypeDef): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext("2d")!;
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2;
  const base = 60; // giả định kích thước cơ bản để tính toán vị trí tương đối

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Main emoji
  ctx.font = `${base}px serif`;
  ctx.fillStyle = "#fff"; // giữ màu emoji nguyên bản
  ctx.fillText(def.emoji, cx, cy);

  // Badge tĩnh (dùng emoji nhỏ hơn)
  const sm = Math.round(base * 0.5);
  ctx.font = `${sm}px serif`;
  if (def.kind === "fast") {
    ctx.fillText("💨", cx + base * 0.55, cy - base * 0.3);
  }
  if (def.kind === "armored") {
    ctx.fillText("🛡️", cx + base * 0.48, cy + base * 0.1);
  }
  if (def.isToxic) {
    ctx.fillText("☣️", cx - base * 0.52, cy + base * 0.28);
  }
  if (def.kind === "splitter") {
    ctx.fillText("✂️", cx + base * 0.5, cy + base * 0.22);
  }

  // Label cho loại đặc biệt
  if (def.kind !== "normal") {
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = def.color;
    ctx.globalAlpha = 0.82;
    ctx.fillText(def.label, cx, cy - base * 0.62);
    ctx.globalAlpha = 1.0;
  }

  return canvas;
}

// ─── Draw single zombie using pre-rendered sprite ─────────────────────────────

function drawZombieFromSprite(
  ctx: CanvasRenderingContext2D,
  z: ZombieInstance,
  ROW_H: number,
  spriteCache: Map<ZombieKind, HTMLCanvasElement>,
): void {
  const def = ZOMBIE_TYPES.find((d) => d.kind === z.kind) ?? ZOMBIE_TYPES[0];
  const baseSize = Math.round(ROW_H * 0.58 * z.sizeScale);
  const cy = z.row * ROW_H + ROW_H * 0.5;
  const wobble = Math.sin(z.t * 0.18) * (z.kind === "fast" ? 5 : 3);

  ctx.save();

  if (def.isStealth) ctx.globalAlpha = 0.38;

  // Wobble transform
  ctx.translate(z.x, cy);
  ctx.rotate((wobble * Math.PI) / 180);
  ctx.translate(-z.x, -cy);

  // Vẽ sprite chính
  const sprite = spriteCache.get(def.kind);
  if (sprite) {
    const half = baseSize / 2 + 2;
    ctx.drawImage(
      sprite,
      z.x - half,
      cy - half,
      baseSize + 4,
      baseSize + 4,
    );
  }

  // Badge động (frozen/poison) vẽ chồng lên
  const sm = Math.round(baseSize * 0.5);
  ctx.font = `${sm}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (z.frozen > 0) {
    ctx.globalAlpha = (def.isStealth ? 0.38 : 1) * 0.6;
    ctx.fillText("❄️", z.x - baseSize * 0.5, cy - baseSize * 0.52);
  }
  if (z.poison > 0) {
    ctx.globalAlpha = def.isStealth ? 0.38 : 1;
    ctx.fillText("🟢", z.x + baseSize * 0.5, cy - baseSize * 0.48);
  }

  ctx.restore();

  // ── HP bar ────────────────────────────────────────────────────────────────
  const barW = Math.round(30 * z.sizeScale);
  const barH = 3;
  const barX = z.x - barW / 2;
  const barY = cy + baseSize * 0.56;

  // Armor bar
  if (def.isArmored && z.maxArmorHp > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(barX, barY + barH + 1, barW, barH);
    const armorPct = Math.max(0, z.armorHp / z.maxArmorHp);
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(barX, barY + barH + 1, barW * armorPct, barH);
  }

  // HP bar
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(barX, barY, barW, barH);
  const hpPct = Math.max(0, z.hp / z.maxHp);
  ctx.fillStyle =
    hpPct > 0.5 ? "#22c55e" : hpPct > 0.25 ? "#f59e0b" : "#ef4444";
  ctx.fillRect(barX, barY, barW * hpPct, barH);
}

// ─── Draw toxic puddle ────────────────────────────────────────────────────────

function drawToxicPuddle(
  ctx: CanvasRenderingContext2D,
  puddle: { x: number; row: number; t: number; maxT: number },
  ROW_H: number,
): void {
  const cy = puddle.row * ROW_H + ROW_H * 0.76;
  const life = 1 - puddle.t / puddle.maxT;
  const r = 28 * life;
  if (r <= 0) return;

  const g = ctx.createRadialGradient(puddle.x, cy, 0, puddle.x, cy, r);
  g.addColorStop(0, `rgba(74,222,128,${0.55 * life})`);
  g.addColorStop(0.6, `rgba(34,197,94,${0.28 * life})`);
  g.addColorStop(1, "rgba(16,185,129,0)");

  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(puddle.x, cy, r * 1.5, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Viewport culling helpers ────────────────────────────────────────────────

type Viewport = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function getViewport(
  container: HTMLElement | null,
  finalScale: number,
  baseW: number,
  baseH: number,
): Viewport {
  if (!container) {
    return { left: -100, right: baseW + 100, top: -100, bottom: baseH + 100 };
  }
  const scrollLeft = container.scrollLeft;
  const scrollTop = container.scrollTop;
  const clientW = container.clientWidth;
  const clientH = container.clientHeight;

  return {
    left: scrollLeft / finalScale - 50,
    right: (scrollLeft + clientW) / finalScale + 50,
    top: scrollTop / finalScale - 50,
    bottom: (scrollTop + clientH) / finalScale + 50,
  };
}

function isInViewport(
  x: number,
  row: number,
  ROW_H: number,
  vp: Viewport,
): boolean {
  const y = row * ROW_H + ROW_H * 0.5;
  return x > vp.left && x < vp.right && y > vp.top && y < vp.bottom;
}

// ─── SavedPlantCard ───────────────────────────────────────────────────────────

function SavedPlantCard({
  plant,
  selected,
  onClick,
  imageCache,
  instancesMap,
}: {
  plant: SavedPlant;
  selected: boolean;
  onClick: () => void;
  imageCache: React.RefObject<Record<string, HTMLImageElement>>;
  instancesMap: React.RefObject<Record<string, PlacedModule[]>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idleTRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const instances =
      instancesMap.current?.[plant.id] ?? parsePlacedModules(plant);
    instances.forEach((inst) => {
      const modData = PLANT_MODULES[inst.type].find((m) => m.id === inst.moduleId);
      const path = modData?.imagePath ?? plant.partSnapshots?.[inst.type]?.imagePath ?? "";
      if (path && imageCache.current) loadImageIntoCache(imageCache.current, path);
    });
    if (plant.partSnapshots && imageCache.current) {
      (
        Object.values(plant.partSnapshots) as ({ imagePath: string; tint: string } | null)[]
      ).forEach((snap) => {
        if (snap?.imagePath && imageCache.current)
          loadImageIntoCache(imageCache.current, snap.imagePath);
      });
    }
  }, [plant, imageCache, instancesMap]);

  useEffect(() => {
    const loop = () => {
      idleTRef.current++;
      const canvas = canvasRef.current;
      const cache = imageCache.current;
      const map = instancesMap.current;
      if (canvas && cache && map) {
        const instances = map[plant.id] ?? parsePlacedModules(plant);
        if (!map[plant.id]) map[plant.id] = instances;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawPlantModulesOnCanvas(
            ctx, instances, cache,
            canvas.width, canvas.height,
            idleTRef.current, plant.partSnapshots,
          );
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [plant, imageCache, instancesMap]);

  const bulletLabel = plant.bulletLayoutJson
    ? "Đạn tùy chỉnh"
    : (plant.bulletType?.name ?? "Mặc định");

  return (
    <div
      onClick={onClick}
      title={`${plant.name}\nĐạn: ${bulletLabel}`}
      style={{
        cursor: "pointer",
        textAlign: "center",
        opacity: selected ? 1 : 0.75,
        transform: selected ? "scale(1.08)" : "scale(1)",
        transition: "opacity 0.15s, transform 0.1s",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        width={60}
        height={72}
        style={{
          borderRadius: 8,
          border: `1.5px solid ${selected ? "#3b82f6" : "rgba(107,76,30,0.4)"}`,
          display: "block",
        }}
      />
      {plant.bulletLayoutJson && (
        <div
          style={{
            position: "absolute",
            bottom: 14,
            right: 1,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: plant.bulletPrimaryColor ?? "#f97316",
            border: "1px solid rgba(0,0,0,0.6)",
          }}
        />
      )}
      <div
        style={{
          fontSize: 9,
          color: selected ? "#93c5fd" : "#6b7280",
          marginTop: 3,
          maxWidth: 60,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: selected ? 600 : 400,
        }}
      >
        {plant.name}
      </div>
    </div>
  );
}

// ─── ZombieCodex (input số lượng từng loại) ──────────────────────────────────

function ZombieCodex({
  counts,
  onCountChange,
}: {
  counts: Record<ZombieKind, number>;
  onCountChange: (kind: ZombieKind, value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "transparent",
          border: "1px solid rgba(107,76,30,0.35)",
          borderRadius: 20,
          padding: "4px 12px",
          fontSize: 11,
          color: "#9ca3af",
          cursor: "pointer",
        }}
      >
        <Info size={12} /> {open ? "Ẩn danh sách" : "Danh sách Zombie"}
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 6,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {ZOMBIE_TYPES.map((def) => (
            <div
              key={def.kind}
              style={{
                background: "rgba(10,16,10,0.7)",
                border: `1px solid ${def.color}33`,
                borderRadius: 10,
                padding: "8px 10px",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>
                {def.emoji}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: def.color }}>
                  {def.label}
                </div>
                <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>
                  {def.description}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 9 }}>
                  <span style={{ color: "#ef4444" }}>HP {def.baseHp}</span>
                  <span style={{ color: "#3b82f6" }}>Spd {def.baseSpeed.toFixed(2)}</span>
                  <span style={{ color: "#f59e0b" }}>+{def.scoreValue}pt</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 9, color: "#9ca3af" }}>Số lượng:</span>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={counts[def.kind] ?? 0}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      onCountChange(def.kind, isNaN(v) ? 0 : Math.max(0, v));
                    }}
                    style={{
                      width: 52,
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(107,76,30,0.5)",
                      borderRadius: 4,
                      color: "#c8a870",
                      fontSize: 10,
                      padding: "2px 4px",
                      textAlign: "center",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Battle renderer (có culling, sử dụng zombie sprite) ─────────────────────

function renderBattle(
  ctx: CanvasRenderingContext2D,
  state: ExtendedBattleState,
  plants: SavedPlant[],
  imageCache: Record<string, HTMLImageElement>,
  rows: number,
  showSlots: boolean,
  instancesMap: Record<string, PlacedModule[]>,
  offscreenCanvas: HTMLCanvasElement,
  viewport: Viewport,
  zombieSpriteCache: Map<ZombieKind, HTMLCanvasElement>,
): void {
  const ROW_H = CELL_SIZE;
  const battleHeight = rows * ROW_H;
  ctx.clearRect(0, 0, BASE_BATTLE_W, battleHeight);

  // Checkerboard
  const grassColors = ["#5a9e3a", "#4d8c30"];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = grassColors[(r + c) % 2];
      ctx.fillRect(c * CELL_SIZE, r * ROW_H, CELL_SIZE, ROW_H);
    }
  }

  // Row dividers
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * ROW_H);
    ctx.lineTo(BASE_BATTLE_W, r * ROW_H);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Slot guides
  if (showSlots && !state.running) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = COL_CENTERS[c];
        const cy = r * ROW_H + ROW_H / 2;
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        canvasRoundRect(ctx, cx - 20, cy - 24, 40, 48, 8);
        ctx.stroke();
      }
    }
  }

  // Toxic puddles (behind everything)
  state.toxicPuddles.forEach((p) => {
    if (isInViewport(p.x, p.row, ROW_H, viewport)) {
      drawToxicPuddle(ctx, p, ROW_H);
    }
  });

  // Plants
  const offCtx = offscreenCanvas.getContext("2d")!;
  state.plants.forEach((pp) => {
    if (!isInViewport(COL_CENTERS[pp.col], pp.row, ROW_H, viewport)) return;
    const plant = plants.find((p) => p.id === pp.plantId);
    if (!plant) return;
    const instances = instancesMap[plant.id] ?? parsePlacedModules(plant);
    if (!instancesMap[plant.id]) instancesMap[plant.id] = instances;

    offCtx.clearRect(0, 0, CELL_SIZE, CELL_SIZE);
    drawPlantModulesOnCanvas(
      offCtx, instances, imageCache,
      CELL_SIZE, CELL_SIZE, pp.t, plant.partSnapshots,
    );
    const colX = COL_CENTERS[pp.col];
    const rowY = pp.row * ROW_H + ROW_H / 2;
    ctx.drawImage(offscreenCanvas, colX - CELL_SIZE / 2, rowY - CELL_SIZE / 2);
  });

  // Bullets
  state.bullets.forEach((b) => {
    if (!isInViewport(b.x, b.row, ROW_H, viewport)) return;
    const cy = b.row * ROW_H + ROW_H / 2;

    if (b.layoutJson) {
      const bulletInstances = getParsedBulletInstances(b.layoutJson);
      if (bulletInstances.length > 0) {
        drawBulletOnCanvas(ctx, bulletInstances, b.x, cy, b.animTime, 0.4, 1);
        return;
      }
    }

    // Fallback
    ctx.beginPath();
    ctx.arc(b.x, cy, b.size * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = b.color + "40";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(b.x, cy, b.size, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(b.x - b.size * 3, cy);
    ctx.lineTo(b.x, cy);
    ctx.strokeStyle = b.color + "80";
    ctx.lineWidth = b.size * 0.8;
    ctx.lineCap = "round";
    ctx.stroke();
  });

  // Zombies – sử dụng sprite
  for (let i = 0; i < state.zombies.length; i++) {
    const z = state.zombies[i];
    if (isInViewport(z.x, z.row, ROW_H, viewport)) {
      drawZombieFromSprite(ctx, z, ROW_H, zombieSpriteCache);
    }
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BattlePanel({
  onSwitchLab,
}: {
  onSwitchLab: () => void;
}) {
  const savedPlants = useMapStore((s) => s.savedPlants);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const plantInstancesCacheRef = useRef<Record<string, PlacedModule[]>>({});
  const zombieSpriteCacheRef = useRef<Map<ZombieKind, HTMLCanvasElement>>(new Map());

  // Offscreen canvas cho cây
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Khởi tạo offscreen canvas và zombie sprites một lần
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = CELL_SIZE;
    c.height = CELL_SIZE;
    offscreenCanvasRef.current = c;

    const cache = zombieSpriteCacheRef.current;
    if (cache.size === 0) {
      for (const def of ZOMBIE_TYPES) {
        cache.set(def.kind, createZombieSprite(def));
      }
    }
  }, []);

  const [rows, setRows] = useState<number>(DEFAULT_ROWS);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [selectedPlantIdx, setSelectedPlantIdx] = useState<number | null>(null);
  const [shovelMode, setShovelMode] = useState<boolean>(false);
  const [waveActive, setWaveActive] = useState(false);

  const [info, setInfo] = useState("Chọn cây → Click ô để đặt");
  const [score, setScore] = useState({ defeated: 0, survived: 0, points: 0 });
  const [zombieLeft, setZombieLeft] = useState(0);

  const [zombieCounts, setZombieCounts] = useState<Record<ZombieKind, number>>({
    normal: 5,
    fast: 0,
    tank: 0,
    armored: 0,
    toxic: 0,
    giant: 0,
    stealth: 0,
    splitter: 0,
  });

  const battleRef = useRef<ExtendedBattleState>({
    plants: [],
    zombies: [],
    bullets: [],
    toxicPuddles: [],
    frame: 0,
    running: false,
    zombieId: 0,
    bulletId: 0,
    defeated: 0,
    survived: 0,
  });

  const savedPlantsRef = useRef<SavedPlant[]>(savedPlants);
  const selectedPlantIdxRef = useRef<number | null>(null);

  useEffect(() => {
    savedPlantsRef.current = savedPlants;
    plantInstancesCacheRef.current = {};
  }, [savedPlants]);

  useEffect(() => {
    selectedPlantIdxRef.current = selectedPlantIdx;
  }, [selectedPlantIdx]);

  // Preload plant images
  useEffect(() => {
    savedPlants.forEach((plant) => {
      const instances =
        plantInstancesCacheRef.current[plant.id] ?? parsePlacedModules(plant);
      if (!plantInstancesCacheRef.current[plant.id]) {
        plantInstancesCacheRef.current[plant.id] = instances;
      }
      instances.forEach((inst) => {
        const modData = PLANT_MODULES[inst.type].find(
          (m) => m.id === inst.moduleId,
        );
        const path =
          modData?.imagePath ??
          plant.partSnapshots?.[inst.type]?.imagePath ??
          "";
        if (path) loadImageIntoCache(imageCacheRef.current, path);
      });
      if (plant.partSnapshots) {
        (
          Object.values(plant.partSnapshots) as ({
            imagePath: string;
            tint: string;
          } | null)[]
        ).forEach((snap) => {
          if (snap?.imagePath)
            loadImageIntoCache(imageCacheRef.current, snap.imagePath);
        });
      }
    });
  }, [savedPlants]);

  // Ref đồng bộ
  const scoreRef = useRef(score);
  const infoRef = useRef(info);
  const zombieLeftRef = useRef(zombieLeft);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { infoRef.current = info; }, [info]);
  useEffect(() => { zombieLeftRef.current = zombieLeft; }, [zombieLeft]);

  // Đồng bộ ref -> state (UI) mỗi 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      setScore({ ...scoreRef.current });
      setInfo(infoRef.current);
      setZombieLeft(zombieLeftRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const ROW_H = CELL_SIZE;
  const battleHeight = rows * ROW_H;

  const autoScale = useMemo(
    () => Math.max(1.0, TARGET_MIN_HEIGHT / battleHeight),
    [battleHeight],
  );
  const finalScale = zoom * autoScale;
  const scaledWidth = BASE_BATTLE_W * finalScale;
  const scaledHeight = battleHeight * finalScale;

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const s = battleRef.current;
      const rect = canvasRef.current!.getBoundingClientRect();
      const bx = (e.clientX - rect.left) * (BASE_BATTLE_W / rect.width);
      const by = (e.clientY - rect.top) * (battleHeight / rect.height);
      const col = Math.floor(bx / CELL_SIZE);
      const row = Math.floor(by / ROW_H);
      if (row < 0 || row >= rows || col < 0 || col >= COLS) return;

      if (shovelMode) {
        const idx = s.plants.findIndex((p) => p.row === row && p.col === col);
        if (idx !== -1) {
          s.plants.splice(idx, 1);
          infoRef.current = `Đã nhổ cây ở hàng ${row + 1}, cột ${col + 1}`;
        } else {
          infoRef.current = "Không có cây để nhổ ở đây";
        }
        return;
      }

      if (s.running) {
        infoRef.current = "Không thể đặt khi đang chiến!";
        return;
      }

      const idx = selectedPlantIdxRef.current;
      if (idx === null) {
        infoRef.current = "Chọn cây trước!";
        return;
      }
      const plant = savedPlantsRef.current[idx];
      if (!plant) return;
      if (s.plants.find((p) => p.row === row && p.col === col)) {
        infoRef.current = "Ô này đã có cây!";
        return;
      }
      s.plants.push({
        uid: Date.now(),
        plantId: plant.id,
        row,
        col,
        t: 0,
        lastShot: 0,
      });
      infoRef.current = `Đặt ${plant.name} tại hàng ${row + 1}, cột ${col + 1}`;
    },
    [battleHeight, ROW_H, rows, shovelMode],
  );

  const stopWave = useCallback(() => {
    battleRef.current.running = false;
    battleRef.current.zombies = [];
    battleRef.current.bullets = [];
    battleRef.current.toxicPuddles = [];
    cancelAnimationFrame(rafRef.current);
    setWaveActive(false);
    zombieLeftRef.current = 0;
    infoRef.current = "Đã dừng.";
  }, []);

  const startWave = useCallback(() => {
    if (battleRef.current.plants.length === 0) {
      infoRef.current = "Đặt ít nhất 1 cây!";
      return;
    }
    const totalZombies = Object.values(zombieCounts).reduce((a, b) => a + b, 0);
    if (totalZombies === 0) {
      infoRef.current = "Hãy chọn ít nhất 1 zombie để spawn!";
      return;
    }

    const s = battleRef.current;
    const zombies: ZombieInstance[] = [];
    let nextId = 0;
    for (const def of ZOMBIE_TYPES) {
      const count = zombieCounts[def.kind] ?? 0;
      for (let i = 0; i < count; i++) {
        zombies.push(makeZombieOfKind(nextId++, def, rows));
      }
    }

    Object.assign(s, {
      running: true,
      zombies,
      bullets: [],
      toxicPuddles: [],
      frame: 0,
      defeated: 0,
      survived: 0,
      zombieId: nextId,
      bulletId: 0,
    } as Partial<ExtendedBattleState>);

    setWaveActive(true);
    scoreRef.current = { defeated: 0, survived: 0, points: 0 };
    zombieLeftRef.current = zombies.length;
    infoRef.current = "Trận chiến bắt đầu! 🧟";
  }, [zombieCounts, rows]);

  const clearAll = useCallback(() => {
    stopWave();
    battleRef.current.plants = [];
    infoRef.current = "Đã xóa bàn.";
  }, [stopWave]);

  const handleDeletePlant = useCallback(() => {
    if (selectedPlantIdx === null) return;
    const plant = savedPlantsRef.current[selectedPlantIdx];
    if (!plant) return;
    if (window.confirm(`Xóa cây "${plant.name}"?`)) {
      useMapStore.setState((state) => ({
        savedPlants: state.savedPlants.filter((p) => p.id !== plant.id),
      }));
      battleRef.current.plants = battleRef.current.plants.filter(
        (p) => p.plantId !== plant.id,
      );
      setSelectedPlantIdx(null);
      infoRef.current = `Đã xóa cây "${plant.name}"`;
    }
  }, [selectedPlantIdx]);

  const handleRowsChange = (newRows: number) => {
    if (waveActive) stopWave();
    battleRef.current.plants = [];
    setRows(newRows);
    infoRef.current = `Đã đặt số hàng = ${newRows}`;
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleZoomChange = (v: number) =>
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v)));

  const handleZombieCountChange = useCallback(
    (kind: ZombieKind, value: number) => {
      setZombieCounts((prev) => ({ ...prev, [kind]: value }));
    },
    [],
  );

  // ── Game loop (tối ưu) ─────────────────────────────────────────────────────
  const prevZombieLeftRef = useRef(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Nhóm zombie theo hàng (mảng cố định, reuse)
    const zombiesByRow: ZombieInstance[][] = Array.from({ length: MAX_ROWS }, () => []);
    const puddlesByRow: { x: number; row: number; t: number; maxT: number }[][] =
      Array.from({ length: MAX_ROWS }, () => []);

    const loop = () => {
      const s = battleRef.current;
      const plants = savedPlantsRef.current;

      s.frame++;
      for (const pp of s.plants) pp.t++;
      for (const b of s.bullets) b.animTime++;

      if (s.running) {
        // Plants fire
        for (const pp of s.plants) {
          const plant = plants.find((p) => p.id === pp.plantId);
          if (!plant) continue;
          const fireRate = Math.max(35, 110 - plant.agi * 3.5);
          const colX = COL_CENTERS[pp.col];

          if (
            s.zombies.some((z) => z.row === pp.row && z.x > colX) &&
            pp.t - pp.lastShot > fireRate
          ) {
            pp.lastShot = pp.t;
            const bt = plant.bulletType;
            const hasCustom = Boolean(plant.bulletLayoutJson);

            s.bullets.push({
              id: s.bulletId++,
              row: pp.row,
              x: colX + 22,
              color: hasCustom ? plant.bulletPrimaryColor ?? bt.color : bt.color,
              size: hasCustom ? plant.bulletRadius ?? bt.size : bt.size,
              dmg:
                hasCustom && plant.bulletDmg != null
                  ? Math.round((plant.bulletDmg + bt.dmg) / 2)
                  : bt.dmg,
              speed:
                hasCustom && plant.bulletSpeed != null
                  ? parseFloat(((plant.bulletSpeed + bt.speed) / 2).toFixed(1))
                  : bt.speed,
              effectName: plant.effect?.name,
              layoutJson: plant.bulletLayoutJson ?? undefined,
              animTime: 0,
            });
          }
        }

        // Nhóm zombie theo hàng
        for (let r = 0; r < rows; r++) zombiesByRow[r].length = 0;
        for (const z of s.zombies) {
          if (z.row >= 0 && z.row < rows) zombiesByRow[z.row].push(z);
        }

        // Bullets movement & collision (dùng for với index để có thể splice mảng bullets)
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.speed;
          if (b.x > BASE_BATTLE_W + 20) {
            s.bullets.splice(i, 1);
            continue;
          }

          const isPiercing = b.effectName === "Xuyên giáp";
          let consumed = false;
          const targets = zombiesByRow[b.row] ?? [];

          for (let j = targets.length - 1; j >= 0; j--) {
            const z = targets[j];
            if (Math.abs(z.x - b.x) >= 22) continue;

            let dmg = b.dmg * (0.8 + Math.random() * 0.4);
            if (z.armorHp > 0) {
              const absorbed = Math.min(z.armorHp, dmg * 0.7);
              z.armorHp -= absorbed;
              dmg -= absorbed;
            }
            z.hp -= dmg;

            if (b.effectName === "Đóng băng") z.frozen = 130;
            else if (b.effectName === "Độc") z.poison = 200;
            else if (b.effectName === "Đẩy lùi")
              z.x = Math.min(BASE_BATTLE_W + 30, z.x + 45);

            if (z.hp <= 0) {
              const def = ZOMBIE_TYPES.find((d) => d.kind === z.kind) ?? ZOMBIE_TYPES[0];
              if (def.isToxic) {
                s.toxicPuddles.push({ x: z.x, row: z.row, t: 0, maxT: 250 });
              }
              if (def.splitCount && def.splitCount > 0) {
                for (let si = 0; si < def.splitCount; si++) {
                  s.zombies.push({
                    id: s.zombieId++,
                    kind: "fast",
                    row: z.row,
                    x: z.x + (si - 0.5) * 18,
                    hp: Math.round(z.maxHp * 0.28),
                    maxHp: Math.round(z.maxHp * 0.28),
                    armorHp: 0,
                    maxArmorHp: 0,
                    speed: 0.88 + Math.random() * 0.28,
                    t: 0,
                    frozen: 0,
                    poison: 0,
                    sizeScale: 0.55,
                    scoreValue: 1,
                  });
                }
              }

              // Xóa zombie khỏi mảng chính (xóa khỏi targets và s.zombies)
              const globalIdx = s.zombies.findIndex((zz) => zz.id === z.id);
              if (globalIdx !== -1) s.zombies.splice(globalIdx, 1);
              targets.splice(j, 1);

              s.defeated++;
              const pts = def.scoreValue;
              scoreRef.current = {
                ...scoreRef.current,
                defeated: s.defeated,
                points: scoreRef.current.points + pts,
              };
            }

            consumed = true;
            if (!isPiercing) break;
          }

          if (!isPiercing && consumed) {
            s.bullets.splice(i, 1);
          }
        }

        // Nhóm puddles
        for (let r = 0; r < rows; r++) puddlesByRow[r].length = 0;
        for (const p of s.toxicPuddles) {
          if (p.row >= 0 && p.row < rows) puddlesByRow[p.row].push(p);
        }

        // Move zombies
        for (let i = s.zombies.length - 1; i >= 0; i--) {
          const z = s.zombies[i];
          z.t++;
          if (z.frozen > 0) z.frozen--;
          if (z.poison > 0) {
            z.poison--;
            if (z.t % 22 === 0) z.hp -= 5;
          }

          const rowPuddles = puddlesByRow[z.row] ?? [];
          const inPuddle = rowPuddles.some((p) => Math.abs(p.x - z.x) < 32);

          let spd = z.speed;
          if (z.frozen > 0) spd *= 0.18;
          else if (inPuddle) spd *= 0.52;

          z.x -= spd;

          if (z.hp <= 0) {
            s.zombies.splice(i, 1);
            s.defeated++;
            scoreRef.current = { ...scoreRef.current, defeated: s.defeated };
          } else if (z.x < -20) {
            s.zombies.splice(i, 1);
            s.survived++;
            scoreRef.current = { ...scoreRef.current, survived: s.survived };
            infoRef.current = `💀 Zombie vượt qua! (${s.survived})`;
          }
        }

        // Age puddles
        for (let i = s.toxicPuddles.length - 1; i >= 0; i--) {
          const p = s.toxicPuddles[i];
          p.t++;
          if (p.t >= p.maxT) s.toxicPuddles.splice(i, 1);
        }

        // End condition
        if (s.zombies.length === 0) {
          s.running = false;
          setWaveActive(false);
          infoRef.current = `🎉 Chiến thắng! Tiêu diệt: ${s.defeated}, vượt qua: ${s.survived} | Điểm: ${scoreRef.current.points}`;
        }

        if (s.zombies.length !== prevZombieLeftRef.current) {
          prevZombieLeftRef.current = s.zombies.length;
          zombieLeftRef.current = s.zombies.length;
        }
      }

      const vp = getViewport(containerRef.current, finalScale, BASE_BATTLE_W, battleHeight);

      renderBattle(
        ctx, s, plants,
        imageCacheRef.current, rows,
        selectedPlantIdx !== null && !shovelMode,
        plantInstancesCacheRef.current,
        offscreenCanvasRef.current!,
        vp,
        zombieSpriteCacheRef.current,
      );
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rows, shovelMode, selectedPlantIdx, finalScale, battleHeight]);

  const totalSelectedZombies = Object.values(zombieCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ color: "#c8a870", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, borderBottom: "1px solid rgba(107,76,30,0.4)", paddingBottom: 10 }}>
        <TabBtn onClick={onSwitchLab}><FlaskConical size={14} /> Lai Tạo</TabBtn>
        <TabBtn active><Swords size={14} /> Thực Chiến</TabBtn>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 2, minWidth: 220 }}>
          <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Cây đã tạo
            <span style={{ marginLeft: 6, color: "#374151", textTransform: "none", fontWeight: 400 }}>· hover để xem đạn</span>
          </div>
          {savedPlants.length === 0 ? (
            <div style={{ fontSize: 12, color: "#6b7280" }}>Chưa có cây. Tạo ở tab Lai Tạo.</div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
              {savedPlants.map((p, i) => (
                <SavedPlantCard
                  key={p.id}
                  plant={p}
                  selected={selectedPlantIdx === i}
                  onClick={() => { setSelectedPlantIdx(i); setShovelMode(false); }}
                  imageCache={imageCacheRef}
                  instancesMap={plantInstancesCacheRef}
                />
              ))}
              {selectedPlantIdx !== null && (
                <div style={{ display: "flex", alignItems: "center", height: 72 }}>
                  <ActionBtn onClick={handleDeletePlant} color="red">
                    <Trash2 size={13} /> Xóa cây
                  </ActionBtn>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>Hàng:</span>
              <input type="range" min={MIN_ROWS} max={MAX_ROWS} value={rows}
                onChange={(e) => handleRowsChange(Number(e.target.value))}
                disabled={waveActive} style={{ width: 80 }} />
              <span style={{ fontSize: 12, minWidth: 20 }}>{rows}</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <ActionBtn onClick={waveActive ? stopWave : startWave} color={waveActive ? "red" : "green"}>
                <Swords size={13} /> {waveActive ? "Dừng" : "Bắt đầu"}
              </ActionBtn>
              <ActionBtn onClick={clearAll} color="gray"><Trash2 size={13} /> Xóa bàn</ActionBtn>
              <ActionBtn onClick={() => setShovelMode((p) => !p)} color={shovelMode ? "amber" : "gray"}>
                <Shovel size={13} /> Cuốc
              </ActionBtn>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#9ca3af" }}>
            <span style={{ maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{info}</span>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <span style={{ color: "#4ade80" }}>☠ {score.defeated}</span>
              <span style={{ color: "#f87171" }}>💀 {score.survived}</span>
              <span style={{ color: "#fbbf24" }}>⭐ {score.points}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, flexWrap: "wrap" }}>
        <ZombieCodex counts={zombieCounts} onCountChange={handleZombieCountChange} />
        <span style={{ fontSize: 10, color: "#6b7280" }}>
          Tổng zombie đã chọn: <span style={{ color: "#c8a870", fontWeight: 600 }}>{totalSelectedZombies}</span>
        </span>
      </div>

      <div ref={containerRef} style={{ position: "relative", borderRadius: 12, border: "1px solid rgba(80,140,60,0.35)", background: "#0f1a0a", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(80,140,60,0.2)" }}>
          <button onClick={() => handleZoomChange(zoom - 0.1)} style={iconButtonStyle} title="Thu nhỏ"><ZoomOut size={14} /></button>
          <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.05} value={zoom} onChange={(e) => handleZoomChange(Number(e.target.value))} style={{ width: 120 }} />
          <button onClick={() => handleZoomChange(zoom + 0.1)} style={iconButtonStyle} title="Phóng to"><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(DEFAULT_ZOOM)} style={iconButtonStyle} title="Reset zoom"><RotateCcw size={14} /></button>
          <span style={{ fontSize: 12, color: "#c8a870", marginLeft: 4 }}>{Math.round(finalScale * 100)}%</span>
          {waveActive && (
            <div style={{ marginLeft: 12, padding: "2px 10px", borderRadius: 20, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", fontSize: 11, color: "#f87171", fontWeight: 600 }}>
              🧟 {zombieLeft} còn lại
            </div>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={toggleFullscreen} style={iconButtonStyle} title="Toàn màn hình"><Maximize size={14} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "center", background: "#0a1207" }}>
          <div style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px`, position: "relative", margin: "auto" }}>
            <canvas
              ref={canvasRef}
              width={BASE_BATTLE_W}
              height={battleHeight}
              onClick={handleCanvasClick}
              style={{
                display: "block",
                cursor: shovelMode ? "grab" : "crosshair",
                transform: `scale(${finalScale})`,
                transformOrigin: "0 0",
                width: `${BASE_BATTLE_W}px`,
                height: `${battleHeight}px`,
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: "#4b5563", marginTop: 6, textAlign: "center" }}>
        {shovelMode ? "Click vào cây để nhổ · Chọn cây để thoát chế độ cuốc" : "Click ô trống để đặt cây · Dùng cuốc để nhổ · Đạn theo thiết kế đã lưu sẵn trong cây"}
      </div>
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  borderRadius: 4,
  color: "#c8a870",
  cursor: "pointer",
  padding: "4px 6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.2s",
};