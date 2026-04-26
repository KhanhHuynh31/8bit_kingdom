// src/constants/bulletModules.ts

export type BulletModuleType = "core" | "shell" | "trail" | "glow" | "tip";

export type BulletStyle =
  | "oval" | "circle" | "star4" | "star5" | "diamond" | "crystal" | "spike"
  | "ring" | "double_ring" | "orbit" | "hex_frame" | "spiral_arms"
  | "dot_trail" | "flame_trail" | "ice_trail" | "smoke_trail"
  | "soft_glow" | "pulse_glow" | "electric_aura" | "fire_aura"
  | "arrow_tip" | "flame_tip" | "energy_tip" | "drill_tip";

export interface PlacedBulletModule {
  instanceId: string;
  type: BulletModuleType;
  moduleId: string;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotationOffset: number;
  visible: boolean;
  zIndex: number;
  colorOverride: string;
  opacity: number;
  spinSpeed: number;  // degrees per frame
  pulseRate: number;  // frames per pulse cycle (0 = no pulse)
  trailLength: number; // 0–50
}

export interface BulletModuleDef {
  id: string;
  type: BulletModuleType;
  label: string;
  description: string;
  defaultColor: string;
  secondaryColor: string;
  baseRadius: number;
  style: BulletStyle;
  defaultSpinSpeed: number;
  defaultPulseRate: number;
  dmgBonus: number;
  speedBonus: number;
  sizeBonus: number;
}

export const BULLET_MODULE_LABELS: Record<BulletModuleType, string> = {
  core:  "Lõi đạn",
  shell: "Vỏ ngoài",
  trail: "Vệt đuôi",
  glow:  "Hào quang",
  tip:   "Đầu đạn",
};

export const BULLET_MODULE_ORDER: BulletModuleType[] = [
  "glow", "trail", "shell", "core", "tip",
];

export const BULLET_MODULES: Record<BulletModuleType, BulletModuleDef[]> = {
  core: [
    { id: "c1", type: "core", label: "Tròn",     description: "Lõi tròn cổ điển",     defaultColor: "#86efac", secondaryColor: "#4ade80", baseRadius: 8,  style: "circle",   defaultSpinSpeed: 0,   defaultPulseRate: 60, dmgBonus: 0,  speedBonus: 0,  sizeBonus: 0 },
    { id: "c2", type: "core", label: "Oval",     description: "Hình oval lao nhanh",   defaultColor: "#60a5fa", secondaryColor: "#3b82f6", baseRadius: 7,  style: "oval",     defaultSpinSpeed: 0,   defaultPulseRate: 0,  dmgBonus: 5,  speedBonus: 2,  sizeBonus: 0 },
    { id: "c3", type: "core", label: "Sao 4",    description: "Ngôi sao 4 cánh",       defaultColor: "#fde68a", secondaryColor: "#f59e0b", baseRadius: 9,  style: "star4",    defaultSpinSpeed: 2,   defaultPulseRate: 45, dmgBonus: 8,  speedBonus: 0,  sizeBonus: 2 },
    { id: "c4", type: "core", label: "Sao 5",    description: "Ngôi sao 5 cánh",       defaultColor: "#fb923c", secondaryColor: "#f97316", baseRadius: 9,  style: "star5",    defaultSpinSpeed: 1.5, defaultPulseRate: 40, dmgBonus: 10, speedBonus: 1,  sizeBonus: 2 },
    { id: "c5", type: "core", label: "Kim Cương",description: "Kim cương xoay",        defaultColor: "#c4b5fd", secondaryColor: "#a78bfa", baseRadius: 8,  style: "diamond",  defaultSpinSpeed: 1,   defaultPulseRate: 50, dmgBonus: 12, speedBonus: -1, sizeBonus: 1 },
    { id: "c6", type: "core", label: "Pha Lê",   description: "Tinh thể lục giác",     defaultColor: "#a5f3fc", secondaryColor: "#22d3ee", baseRadius: 10, style: "crystal",  defaultSpinSpeed: 0.5, defaultPulseRate: 80, dmgBonus: 15, speedBonus: 0,  sizeBonus: 3 },
    { id: "c7", type: "core", label: "Mũi Nhọn", description: "Đạn nhọn xuyên phá",   defaultColor: "#f87171", secondaryColor: "#ef4444", baseRadius: 8,  style: "spike",    defaultSpinSpeed: 0,   defaultPulseRate: 0,  dmgBonus: 18, speedBonus: 3,  sizeBonus: 0 },
  ],
  shell: [
    { id: "s1", type: "shell", label: "Vành Đơn",  description: "Vòng tròn bao quanh",  defaultColor: "#6ee7b7", secondaryColor: "#34d399", baseRadius: 14, style: "ring",        defaultSpinSpeed: 0,   defaultPulseRate: 60, dmgBonus: 0, speedBonus: 0, sizeBonus: 0 },
    { id: "s2", type: "shell", label: "Vành Kép",  description: "Hai vòng tròn lồng",   defaultColor: "#93c5fd", secondaryColor: "#60a5fa", baseRadius: 16, style: "double_ring",  defaultSpinSpeed: 1,   defaultPulseRate: 45, dmgBonus: 3, speedBonus: 0, sizeBonus: 2 },
    { id: "s3", type: "shell", label: "Quỹ Đạo",  description: "Chấm nhỏ quay quanh",  defaultColor: "#fde68a", secondaryColor: "#fbbf24", baseRadius: 15, style: "orbit",        defaultSpinSpeed: 3,   defaultPulseRate: 0,  dmgBonus: 5, speedBonus: 1, sizeBonus: 0 },
    { id: "s4", type: "shell", label: "Lục Giác",  description: "Khung hình lục giác",  defaultColor: "#c4b5fd", secondaryColor: "#a78bfa", baseRadius: 16, style: "hex_frame",    defaultSpinSpeed: 0.5, defaultPulseRate: 70, dmgBonus: 5, speedBonus: 0, sizeBonus: 3 },
    { id: "s5", type: "shell", label: "Xoáy Ốc",  description: "Cánh tay xoắn ốc",    defaultColor: "#f9a8d4", secondaryColor: "#ec4899", baseRadius: 14, style: "spiral_arms",  defaultSpinSpeed: 2,   defaultPulseRate: 0,  dmgBonus: 3, speedBonus: 2, sizeBonus: 1 },
  ],
  trail: [
    { id: "t1", type: "trail", label: "Chấm Sao", description: "Vệt chấm nhỏ",  defaultColor: "#86efac", secondaryColor: "#4ade80", baseRadius: 4, style: "dot_trail",   defaultSpinSpeed: 0, defaultPulseRate: 0,  dmgBonus: 0, speedBonus: 0, sizeBonus: 0 },
    { id: "t2", type: "trail", label: "Ngọn Lửa", description: "Vệt lửa bừng",  defaultColor: "#f97316", secondaryColor: "#fbbf24", baseRadius: 6, style: "flame_trail", defaultSpinSpeed: 0, defaultPulseRate: 15, dmgBonus: 5, speedBonus: 1, sizeBonus: 0 },
    { id: "t3", type: "trail", label: "Băng Giá",  description: "Vệt băng lạnh", defaultColor: "#bae6fd", secondaryColor: "#38bdf8", baseRadius: 5, style: "ice_trail",   defaultSpinSpeed: 0, defaultPulseRate: 20, dmgBonus: 0, speedBonus: 0, sizeBonus: 0 },
    { id: "t4", type: "trail", label: "Khói",      description: "Vệt khói mờ",   defaultColor: "#9ca3af", secondaryColor: "#6b7280", baseRadius: 7, style: "smoke_trail", defaultSpinSpeed: 0, defaultPulseRate: 30, dmgBonus: 0, speedBonus: 0, sizeBonus: 1 },
  ],
  glow: [
    { id: "g1", type: "glow", label: "Mềm",    description: "Ánh sáng nhẹ nhàng",  defaultColor: "#86efac", secondaryColor: "#4ade80", baseRadius: 20, style: "soft_glow",    defaultSpinSpeed: 0, defaultPulseRate: 80, dmgBonus: 0, speedBonus: 0, sizeBonus: 0 },
    { id: "g2", type: "glow", label: "Xung",   description: "Hào quang nhấp nháy", defaultColor: "#60a5fa", secondaryColor: "#3b82f6", baseRadius: 22, style: "pulse_glow",   defaultSpinSpeed: 0, defaultPulseRate: 30, dmgBonus: 2, speedBonus: 0, sizeBonus: 0 },
    { id: "g3", type: "glow", label: "Điện",   description: "Hào quang tia điện",  defaultColor: "#38bdf8", secondaryColor: "#0ea5e9", baseRadius: 18, style: "electric_aura",defaultSpinSpeed: 5, defaultPulseRate: 10, dmgBonus: 5, speedBonus: 2, sizeBonus: 0 },
    { id: "g4", type: "glow", label: "Lửa",    description: "Hào quang lửa đỏ",   defaultColor: "#ef4444", secondaryColor: "#f97316", baseRadius: 20, style: "fire_aura",    defaultSpinSpeed: 0, defaultPulseRate: 15, dmgBonus: 8, speedBonus: 0, sizeBonus: 0 },
  ],
  tip: [
    { id: "tp1", type: "tip", label: "Mũi Tên",    description: "Đầu mũi tên nhọn",      defaultColor: "#f9fafb", secondaryColor: "#e5e7eb", baseRadius: 6, style: "arrow_tip",  defaultSpinSpeed: 0, defaultPulseRate: 0,  dmgBonus: 5,  speedBonus: 2, sizeBonus: 0 },
    { id: "tp2", type: "tip", label: "Lửa",         description: "Đầu lửa rực cháy",      defaultColor: "#fbbf24", secondaryColor: "#f97316", baseRadius: 7, style: "flame_tip",  defaultSpinSpeed: 0, defaultPulseRate: 15, dmgBonus: 8,  speedBonus: 1, sizeBonus: 0 },
    { id: "tp3", type: "tip", label: "Năng Lượng",  description: "Tia năng lượng tỏa",    defaultColor: "#a78bfa", secondaryColor: "#8b5cf6", baseRadius: 6, style: "energy_tip", defaultSpinSpeed: 3, defaultPulseRate: 20, dmgBonus: 10, speedBonus: 0, sizeBonus: 0 },
    { id: "tp4", type: "tip", label: "Khoan",        description: "Đầu khoan xoay tròn",  defaultColor: "#34d399", secondaryColor: "#10b981", baseRadius: 6, style: "drill_tip",  defaultSpinSpeed: 8, defaultPulseRate: 0,  dmgBonus: 12, speedBonus: 3, sizeBonus: 0 },
  ],
};

// ─── Helper: Find module def ──────────────────────────────────────────────────

export function findBulletModuleDef(moduleId: string): BulletModuleDef | undefined {
  for (const mods of Object.values(BULLET_MODULES)) {
    const found = mods.find((m) => m.id === moduleId);
    if (found) return found;
  }
  return undefined;
}

// ─── Stats calculator ─────────────────────────────────────────────────────────

export interface BulletDesignStats {
  dmg: number;
  speed: number;
  radius: number;
  primaryColor: string;
}

export function calcBulletStats(instances: PlacedBulletModule[]): BulletDesignStats {
  let dmg = 20;
  let speed = 5;
  let radius = 8;
  let primaryColor = "#86efac";
  let hasCoreColor = false;

  for (const inst of instances) {
    const def = findBulletModuleDef(inst.moduleId);
    if (!def) continue;
    dmg   += def.dmgBonus;
    speed += def.speedBonus * 0.1;
    radius += def.sizeBonus;
    if (def.type === "core" && !hasCoreColor) {
      primaryColor = inst.colorOverride || def.defaultColor;
      hasCoreColor = true;
    }
  }

  return {
    dmg:   Math.max(5, Math.round(dmg)),
    speed: Math.max(2, parseFloat(speed.toFixed(1))),
    radius: Math.max(4, Math.round(radius)),
    primaryColor,
  };
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawStarPath(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  points: number,
  innerRatio: number,
  angle: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI / points) * i + angle;
    const rad = i % 2 === 0 ? r : r * innerRatio;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    else ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

function drawHexPath(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  angle: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + angle;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

// ─── Main draw dispatcher ─────────────────────────────────────────────────────

function drawStyle(
  ctx: CanvasRenderingContext2D,
  style: BulletStyle,
  cx: number, cy: number,
  r: number,
  color: string,
  secondary: string,
  time: number,
  spinAngle: number,
  pulseScale: number,
  direction: 1 | -1,
  trailLength: number,
): void {
  const sr = r * pulseScale;

  switch (style) {
    // ── CORE ──────────────────────────────────────────────────────────────────

    case "circle": {
      const g = ctx.createRadialGradient(cx - sr * 0.3, cy - sr * 0.3, 0, cx, cy, sr);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, color);
      g.addColorStop(1, secondary);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, sr, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "oval": {
      const g = ctx.createRadialGradient(cx - sr * 0.4, cy - sr * 0.2, 0, cx, cy, sr * 2);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, color);
      g.addColorStop(1, secondary + "00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, sr * 2.2, sr * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "star4": {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, color);
      g.addColorStop(1, secondary);
      ctx.fillStyle = g;
      drawStarPath(ctx, cx, cy, sr, 4, 0.38, spinAngle);
      ctx.fill();
      break;
    }

    case "star5": {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, color);
      g.addColorStop(1, secondary);
      ctx.fillStyle = g;
      drawStarPath(ctx, cx, cy, sr, 5, 0.42, spinAngle - Math.PI / 2);
      ctx.fill();
      break;
    }

    case "diamond": {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, color);
      g.addColorStop(1, secondary);
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(spinAngle + Math.PI / 4);
      ctx.fillRect(-sr * 0.85, -sr * 0.85, sr * 1.7, sr * 1.7);
      ctx.restore();
      break;
    }

    case "crystal": {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, color);
      g.addColorStop(1, secondary + "80");
      ctx.fillStyle = g;
      drawHexPath(ctx, cx, cy, sr, spinAngle);
      ctx.fill();
      // Inner
      ctx.save();
      ctx.globalAlpha = ctx.globalAlpha * 0.5;
      ctx.fillStyle = "#ffffff";
      drawHexPath(ctx, cx, cy, sr * 0.4, spinAngle + Math.PI / 6);
      ctx.fill();
      ctx.restore();
      break;
    }

    case "spike": {
      const tipX = cx + sr * 2.5 * direction;
      const tailX = cx - sr * direction;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tipX, cy);
      ctx.lineTo(tailX, cy - sr * 0.55);
      ctx.lineTo(tailX + sr * 0.5 * direction, cy);
      ctx.lineTo(tailX, cy + sr * 0.55);
      ctx.closePath();
      ctx.fill();
      const hg = ctx.createLinearGradient(tailX, cy, tipX, cy);
      hg.addColorStop(0, secondary);
      hg.addColorStop(1, "#ffffff80");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(tipX, cy);
      ctx.lineTo(cx, cy - sr * 0.28);
      ctx.lineTo(tailX + sr * 0.4 * direction, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }

    // ── SHELL ─────────────────────────────────────────────────────────────────

    case "ring": {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, sr * 0.2);
      ctx.beginPath();
      ctx.arc(cx, cy, sr, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case "double_ring": {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, sr * 0.15);
      ctx.beginPath();
      ctx.arc(cx, cy, sr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = secondary;
      ctx.lineWidth = Math.max(1, sr * 0.1);
      ctx.beginPath();
      ctx.arc(cx, cy, sr * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case "orbit": {
      const numOrbs = 3;
      for (let i = 0; i < numOrbs; i++) {
        const a = spinAngle + (Math.PI * 2 * i) / numOrbs;
        const ox = cx + Math.cos(a) * sr;
        const oy = cy + Math.sin(a) * sr;
        const or = Math.max(1, sr * 0.25);
        const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, or);
        og.addColorStop(0, "#ffffff");
        og.addColorStop(1, color);
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.arc(ox, oy, or, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "hex_frame": {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, sr * 0.18);
      drawHexPath(ctx, cx, cy, sr, spinAngle);
      ctx.stroke();
      break;
    }

    case "spiral_arms": {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, sr * 0.12);
      const numArms = 3;
      for (let arm = 0; arm < numArms; arm++) {
        const armOff = (Math.PI * 2 * arm) / numArms;
        ctx.beginPath();
        for (let step = 0; step <= 24; step++) {
          const t = step / 24;
          const a = armOff + spinAngle + t * Math.PI * 1.5;
          const dist = t * sr;
          const px = cx + Math.cos(a) * dist;
          const py = cy + Math.sin(a) * dist;
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      break;
    }

    // ── TRAIL ─────────────────────────────────────────────────────────────────

    case "dot_trail": {
      const len = Math.max(20, trailLength * 2 + 20);
      const numDots = 8;
      const savedAlpha = ctx.globalAlpha;
      for (let i = 0; i < numDots; i++) {
        const t = i / numDots;
        const tx = cx - t * len * direction;
        const dr = sr * 0.35 * (1 - t * 0.8);
        const da = savedAlpha * (1 - t);
        if (da <= 0 || dr <= 0) continue;
        ctx.globalAlpha = da;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(tx, cy + Math.sin(time * 0.3 + i) * 2, dr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = savedAlpha;
      break;
    }

    case "flame_trail": {
      const len = Math.max(25, trailLength * 2 + 25);
      const flames = 7;
      const savedAlpha = ctx.globalAlpha;
      for (let i = 0; i < flames; i++) {
        const t = i / flames;
        const tx = cx - t * len * direction;
        const jitter = Math.sin(time * 0.5 + i * 1.3) * sr * 0.5;
        const fw = sr * 0.75 * (1 - t * 0.65);
        const fa = savedAlpha * (1 - t);
        if (fa <= 0 || fw <= 0) continue;
        const fg = ctx.createRadialGradient(tx, cy + jitter, 0, tx, cy + jitter, fw);
        fg.addColorStop(0, "#ffffff");
        fg.addColorStop(0.3, color);
        fg.addColorStop(1, secondary + "00");
        ctx.globalAlpha = fa;
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(tx, cy + jitter, fw, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = savedAlpha;
      break;
    }

    case "ice_trail": {
      const len = Math.max(22, trailLength * 2 + 22);
      const shards = 6;
      const savedAlpha = ctx.globalAlpha;
      for (let i = 0; i < shards; i++) {
        const t = i / shards;
        const tx = cx - t * len * direction;
        const ss = sr * 0.4 * (1 - t * 0.75);
        const sa = savedAlpha * (0.85 - t * 0.75);
        if (sa <= 0 || ss <= 0) continue;
        ctx.globalAlpha = sa;
        ctx.save();
        ctx.translate(tx, cy);
        ctx.rotate(((time * 2 + i * 60) * Math.PI) / 180);
        ctx.fillStyle = color;
        ctx.fillRect(-ss * 0.5, -ss * 2, ss, ss * 4);
        ctx.restore();
      }
      ctx.globalAlpha = savedAlpha;
      break;
    }

    case "smoke_trail": {
      const len = Math.max(30, trailLength * 2 + 30);
      const puffs = 5;
      const savedAlpha = ctx.globalAlpha;
      for (let i = 0; i < puffs; i++) {
        const t = i / puffs;
        const tx = cx - t * len * direction;
        const pr = sr * (0.6 + t * 0.4) * pulseScale;
        const jitter = Math.sin(time * 0.1 + i * 0.8) * 3;
        const pa = savedAlpha * (0.4 - t * 0.35);
        if (pa <= 0 || pr <= 0) continue;
        ctx.globalAlpha = pa;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(tx, cy + jitter, pr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = savedAlpha;
      break;
    }

    // ── GLOW ──────────────────────────────────────────────────────────────────

    case "soft_glow": {
      const gr = sr * 2.5;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
      g.addColorStop(0, color + "cc");
      g.addColorStop(0.45, color + "55");
      g.addColorStop(1, color + "00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, gr, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "pulse_glow": {
      const gr = sr * 2.8 * pulseScale;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, gr));
      g.addColorStop(0, color + "dd");
      g.addColorStop(0.5, color + "44");
      g.addColorStop(1, color + "00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, gr), 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "electric_aura": {
      const numSpikes = 8;
      const innerR = sr * 1.2;
      const outerR = sr * 2.5 * pulseScale;
      ctx.beginPath();
      for (let i = 0; i < numSpikes * 2; i++) {
        const a = (Math.PI / numSpikes) * i + spinAngle;
        const rad2 = i % 2 === 0 ? outerR : innerR;
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * rad2, cy + Math.sin(a) * rad2);
        else ctx.lineTo(cx + Math.cos(a) * rad2, cy + Math.sin(a) * rad2);
      }
      ctx.closePath();
      const eg = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
      eg.addColorStop(0, color + "cc");
      eg.addColorStop(0.6, color + "44");
      eg.addColorStop(1, color + "00");
      ctx.fillStyle = eg;
      ctx.fill();
      break;
    }

    case "fire_aura": {
      const numFlames = 6;
      for (let i = 0; i < numFlames; i++) {
        const a = (Math.PI * 2 * i) / numFlames + spinAngle;
        const fLen = sr * (1.5 + Math.sin(time * 0.12 + i) * 0.4);
        const fx = cx + Math.cos(a) * fLen;
        const fy = cy + Math.sin(a) * fLen;
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fLen * 0.8);
        fg.addColorStop(0, "#fde68a80");
        fg.addColorStop(0.4, color + "60");
        fg.addColorStop(1, color + "00");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, fy, fLen * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ── TIP ───────────────────────────────────────────────────────────────────

    case "arrow_tip": {
      const tipX = cx + sr * 2.2 * direction;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tipX, cy);
      ctx.lineTo(cx, cy - sr * 0.55);
      ctx.lineTo(cx + sr * 0.55 * direction, cy);
      ctx.lineTo(cx, cy + sr * 0.55);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "flame_tip": {
      const savedAlpha = ctx.globalAlpha;
      const fTipX = cx + sr * 1.5 * direction;
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        const fx = fTipX + (1 - t) * sr * 0.5 * direction;
        const jitter = Math.sin(time * 0.4 + i) * sr * 0.35;
        const fr = sr * 0.5 * (1 - t);
        if (fr <= 0) continue;
        const fg = ctx.createRadialGradient(fx, cy + jitter, 0, fx, cy + jitter, fr);
        fg.addColorStop(0, "#ffffff");
        fg.addColorStop(0.5, color);
        fg.addColorStop(1, secondary + "00");
        ctx.globalAlpha = savedAlpha * (1 - t * 0.6);
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, cy + jitter, fr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = savedAlpha;
      break;
    }

    case "energy_tip": {
      const eTipX = cx + sr * 1.8 * direction;
      const sparkCount = 6;
      const savedAlpha = ctx.globalAlpha;
      ctx.globalAlpha = savedAlpha * 0.85;
      for (let i = 0; i < sparkCount; i++) {
        const a = spinAngle + (Math.PI * 2 * i) / sparkCount;
        const sLen = sr * (0.6 + Math.sin(time * 0.3 + i) * 0.2);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, sr * 0.12);
        ctx.beginPath();
        ctx.moveTo(eTipX, cy);
        ctx.lineTo(eTipX + Math.cos(a) * sLen, cy + Math.sin(a) * sLen);
        ctx.stroke();
      }
      ctx.globalAlpha = savedAlpha;
      break;
    }

    case "drill_tip": {
      const dTipX = cx + sr * 2 * direction;
      const drillLen = sr * 2;
      const segments = 6;
      const savedAlpha = ctx.globalAlpha;
      for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const segX = cx + t * drillLen * direction;
        const segW = sr * 0.5 * (1 - t * 0.7);
        const a = spinAngle + t * Math.PI * 3;
        ctx.globalAlpha = savedAlpha * (0.8 - t * 0.4);
        ctx.save();
        ctx.translate(segX, cy);
        ctx.rotate(a);
        ctx.fillStyle = t < 0.5 ? color : secondary;
        ctx.fillRect(-segW * 0.5, -segW * 1.5, segW, segW * 3);
        ctx.restore();
      }
      ctx.globalAlpha = savedAlpha;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(dTipX, cy, Math.max(1, sr * 0.22), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = savedAlpha;
      break;
    }

    default:
      break;
  }
}

// ─── Public: draw all bullet layers ──────────────────────────────────────────

export function drawBulletOnCanvas(
  ctx: CanvasRenderingContext2D,
  instances: PlacedBulletModule[],
  cx: number,
  cy: number,
  time: number,
  canvasScale: number,
  direction: 1 | -1,
): void {
  if (instances.length === 0) return;

  const sorted = [...instances]
    .filter((i) => i.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const inst of sorted) {
    const def = findBulletModuleDef(inst.moduleId);
    if (!def) continue;

    const color  = inst.colorOverride || def.defaultColor;
    const r      = Math.max(2, def.baseRadius * inst.scale * canvasScale);
    const opacity = Math.max(0, Math.min(1, inst.opacity));

    const spinAngle  = ((time * inst.spinSpeed) % 360) * (Math.PI / 180);
    const pulseScale = inst.pulseRate > 0
      ? 0.85 + Math.sin(((time % inst.pulseRate) / inst.pulseRate) * Math.PI * 2) * 0.15
      : 1;

    const drawX = cx + inst.offsetX * canvasScale;
    const drawY = cy + inst.offsetY * canvasScale;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (inst.rotationOffset !== 0) {
      ctx.translate(drawX, drawY);
      ctx.rotate((inst.rotationOffset * Math.PI) / 180);
      ctx.translate(-drawX, -drawY);
    }

    drawStyle(
      ctx, def.style,
      drawX, drawY, r,
      color, def.secondaryColor,
      time, spinAngle, pulseScale,
      direction, inst.trailLength,
    );

    ctx.restore();
  }
}