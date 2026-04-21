// src/constants/plantModules.ts
// ─────────────────────────────────────────────────────────────────────────────
// Thay imagePath bằng đường dẫn ảnh thật của bạn trong /public/assets/plant-modules/
// Nếu chưa có ảnh, để icon emoji — component sẽ fallback tự động.
// ─────────────────────────────────────────────────────────────────────────────

export type ModuleType = "head" | "body" | "leaf" | "eye" | "acc";

export interface PlantModule {
  id: string;
  type: ModuleType;
  label: string;
  /** Emoji fallback khi chưa có ảnh */
  icon: string;
  /** Đường dẫn ảnh PNG trong /public — ví dụ "/assets/plant-modules/head/flower.png" */
  imagePath?: string;
  str: number; // Sức mạnh
  agi: number; // Nhanh nhẹn
  lck: number; // May mắn
}

export const PLANT_MODULES: Record<ModuleType, PlantModule[]> = {
  head: [
    {
      id: "h1",
      type: "head",
      label: "Hoa",
      icon: "🌸",
      imagePath: "/assets/lab/dau1.png",
      str: 3,
      agi: 1,
      lck: 2,
    },
    {
      id: "h2",
      type: "head",
      label: "Hoa",
      icon: "🌸",
      imagePath: "/assets/lab/dau2.png",
      str: 3,
      agi: 1,
      lck: 2,
    },
    {
      id: "h3",
      type: "head",
      label: "Hoa",
      icon: "🌸",
      imagePath: "/assets/lab/dau3.png",
      str: 3,
      agi: 1,
      lck: 2,
    },
    {
      id: "h4",
      type: "head",
      label: "Hoa",
      icon: "🌸",
      imagePath: "/assets/lab/dau4.png",
      str: 3,
      agi: 1,
      lck: 2,
    },
  ],
  body: [
    {
      id: "b1",
      type: "body",
      label: "Xương rồng",
      icon: "🌵",
      imagePath: "/assets/lab/than1.png",
      str: 4,
      agi: 0,
      lck: 1,
    },
    {
      id: "b2",
      type: "body",
      label: "Xương rồng",
      icon: "🌵",
      imagePath: "/assets/lab/than2.png",
      str: 4,
      agi: 0,
      lck: 1,
    },
    {
      id: "b3",
      type: "body",
      label: "Xương rồng",
      icon: "🌵",
      imagePath: "/assets/lab/than3.png",
      str: 4,
      agi: 0,
      lck: 1,
    },
    {
      id: "b4",
      type: "body",
      label: "Xương rồng",
      icon: "🌵",
      imagePath: "/assets/lab/than4.png",
      str: 4,
      agi: 0,
      lck: 1,
    },
  ],
  leaf: [
    {
      id: "l1",
      type: "leaf",
      label: "Lá thường",
      icon: "🍃",
      imagePath: "/assets/lab/la1.png",
      str: 1,
      agi: 1,
      lck: 1,
    },
    {
      id: "l2",
      type: "leaf",
      label: "Lá thường",
      icon: "🍃",
      imagePath: "/assets/lab/la2.png",
      str: 1,
      agi: 1,
      lck: 1,
    },
    {
      id: "l3",
      type: "leaf",
      label: "Lá thường",
      icon: "🍃",
      imagePath: "/assets/lab/la3.png",
      str: 1,
      agi: 1,
      lck: 1,
    },
  ],
  eye: [
    {
      id: "e1",
      type: "eye",
      label: "Mắt thường",
      icon: "👁️",
      imagePath: "/assets/lab/mat1.png",
      str: 1,
      agi: 1,
      lck: 1,
    },
    {
      id: "e2",
      type: "eye",
      label: "Mắt thường",
      icon: "👁️",
      imagePath: "/assets/lab/mat2.png",
      str: 1,
      agi: 1,
      lck: 1,
    },
    {
      id: "e3",
      type: "eye",
      label: "Mắt thường",
      icon: "👁️",
      imagePath: "/assets/lab/mat3.png",
      str: 1,
      agi: 1,
      lck: 1,
    },
    {
      id: "e4",
      type: "eye",
      label: "Mắt thường",
      icon: "👁️",
      imagePath: "/assets/lab/mat4.png",
      str: 1,
      agi: 1,
      lck: 1,
    },
    {
      id: "e5",
      type: "eye",
      label: "Mắt thường",
      icon: "👁️",
      imagePath: "/assets/lab/mat5.png",
      str: 1,
      agi: 1,
      lck: 1,
    },
  ],
  acc: [
    {
      id: "a1",
      type: "acc",
      label: "Vương miện",
      icon: "👑",
      imagePath: "/assets/lab/phukien1.png",
      str: 2,
      agi: 0,
      lck: 5,
    },
    {
      id: "a2",
      type: "acc",
      label: "Vương miện",
      icon: "👑",
      imagePath: "/assets/lab/phukien2.png",
      str: 2,
      agi: 0,
      lck: 5,
    },
    {
      id: "a3",
      type: "acc",
      label: "Vương miện",
      icon: "👑",
      imagePath: "/assets/lab/phukien3.png",
      str: 2,
      agi: 0,
      lck: 5,
    },
  ],
};

// ── Effect pool ──────────────────────────────────────────────────────────────

export interface PlantEffect {
  name: string;
  color: string;
  desc: string;
}

export const PLANT_EFFECTS: PlantEffect[] = [
  { name: "Đóng băng", color: "#93c5fd", desc: "Làm chậm zombie 70% trong 2s" },
  { name: "Độc", color: "#86efac", desc: "Gây 5 sát thương/s trong 3s" },
  { name: "Xuyên giáp", color: "#c4b5fd", desc: "Đạn xuyên qua 2 zombie" },
  { name: "Hút máu", color: "#f87171", desc: "Hồi phục 10hp khi trúng" },
  {
    name: "Sét đánh",
    color: "#fde68a",
    desc: "Sét dây chuyền sang zombie lân cận",
  },
  { name: "Đẩy lùi", color: "#a5f3fc", desc: "Đẩy zombie lùi 40px" },
  { name: "Nhân đôi", color: "#fb923c", desc: "40% bắn 2 đạn cùng lúc" },
  { name: "Bùng cháy", color: "#fca5a5", desc: "Diện tích nổ 30px khi trúng" },
];

// ── Bullet type calculator ────────────────────────────────────────────────────

export interface BulletType {
  name: string;
  color: string;
  size: number; // px bán kính
  dmg: number;
  speed: number;
}

export function getBulletType(
  str: number,
  agi: number,
  lck: number,
): BulletType {
  if (str >= 20)
    return {
      name: "Mega đạn ☄️",
      color: "#ef4444",
      size: 16,
      dmg: 90,
      speed: 4,
    };
  if (str >= 14)
    return {
      name: "Đạn nặng 💣",
      color: "#f97316",
      size: 12,
      dmg: 55,
      speed: 4.5,
    };
  if (agi >= 20)
    return {
      name: "Đạn siêu tốc ⚡",
      color: "#38bdf8",
      size: 5,
      dmg: 22,
      speed: 9,
    };
  if (agi >= 14)
    return {
      name: "Đạn tốc độ 💨",
      color: "#60a5fa",
      size: 7,
      dmg: 32,
      speed: 7,
    };
  if (lck >= 14)
    return {
      name: "Đạn may mắn 🍀",
      color: "#a78bfa",
      size: 9,
      dmg: 40,
      speed: 5,
    };
  if (str >= 8)
    return {
      name: "Đạn mạnh 🟠",
      color: "#fb923c",
      size: 9,
      dmg: 38,
      speed: 5,
    };
  return {
    name: "Đạn thường 🟢",
    color: "#86efac",
    size: 7,
    dmg: 25,
    speed: 5.5,
  };
}

export function getRandomEffect(lck: number, seed: number): PlantEffect | null {
  if (lck < 5) return null;
  const chance = Math.min(0.85, (lck - 4) * 0.07);
  // Deterministic pseudo-random từ seed
  const rng = Math.abs(Math.sin(seed * 9301 + 49297)) % 1;
  if (rng > chance) return null;
  const idx =
    Math.floor(Math.abs(Math.sin(seed * 7.3 + 1)) * PLANT_EFFECTS.length) %
    PLANT_EFFECTS.length;
  return PLANT_EFFECTS[idx];
}

// ── Default colors ────────────────────────────────────────────────────────────

export interface PlantColors {
  head: string;
  body: string;
  leaf: string;
  eye: string;
  acc: string;
}

export const DEFAULT_COLORS: PlantColors = {
  head: "#4ade80",
  body: "#22c55e",
  leaf: "#86efac",
  eye: "#ffffff",
  acc: "#fbbf24",
};

export const MODULE_LABELS: Record<ModuleType, string> = {
  head: "Đầu",
  body: "Thân",
  leaf: "Lá",
  eye: "Mắt",
  acc: "Phụ kiện",
};
