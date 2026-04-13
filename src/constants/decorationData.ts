// ─── decorationData.ts ───────────────────────────────────────────────────────
// Công trình trang trí thu được qua Gacha.
// Ảnh đặt tại: /public/assets/gacha/{id}.png
// Kích thước gợi ý: 64×64px hoặc 128×128px (pixel art, nền trong suốt)

export type DecoRarity = 4 | 5;

export interface DecoBuilding {
  kind: "decoration";
  id: string;
  name: string;
  rarity: DecoRarity;
  description: string;
  /** Kích thước chiếm trên map tính bằng tile (mặc định 1×1) */
  tileW: number;
  tileH: number;
  imageSrc: string; // ảnh full trên map
  cardSrc: string; // ảnh nhỏ trong túi đồ / lịch sử
}

export interface AvocadoReward {
  kind: "avocado";
  amount: number; // 100–1000
}

export type GachaResult = DecoBuilding | AvocadoReward;

// ─── 5★ Decorations (10%) ─────────────────────────────────────────────────────
export const DECO_5: DecoBuilding[] = [
  {
    kind: "decoration",
    id: "pu",
    rarity: 5,
    name: "Pu 8bit",
    description: "Đại sứ vương quốc bơ",
    tileW: 2,
    tileH: 2,
    imageSrc: "/assets/gacha/pu.png",
    cardSrc: "/assets/gacha/pu.png",
  },
  {
    kind: "decoration",
    id: "guga",
    rarity: 5,
    name: "guga",
    description: "Guga 8bit",
    tileW: 2,
    tileH: 2,
    imageSrc: "/assets/gacha/guga.png",
    cardSrc: "/assets/gacha/guga.png",
  },
  {
    kind: "decoration",
    id: "slime",
    rarity: 5,
    name: "slime",
    description: "Slime 8bit",
    tileW: 2,
    tileH: 2,
    imageSrc: "/assets/gacha/slime.png",
    cardSrc: "/assets/gacha/slime.png",
  },
];

// ─── 4★ Decorations (20%) ─────────────────────────────────────────────────────
export const DECO_4: DecoBuilding[] = [
  {
    kind: "decoration",
    id: "ghe",
    rarity: 4,
    name: "Ghế",
    description:
      "Ghế ngồi với thiết kế tinh xảo, tạo nên một điểm nhấn sang trọng cho khu vườn.",
    tileW: 2,
    tileH: 2,
    imageSrc: "/assets/gacha/ghe.png",
    cardSrc: "/assets/gacha/ghe.png",
  },
  {
    kind: "decoration",
    id: "bui_cay",
    rarity: 4,
    name: "Bụi Cây",
    description: "Bụi cây xanh mướt, tạo điểm nhấn tự nhiên cho khu vườn.",
    tileW: 2,
    tileH: 2,
    imageSrc: "/assets/gacha/bui_cay.png",
    cardSrc: "/assets/gacha/bui_cay.png",
  },
  {
    kind: "decoration",
    id: "bui_co",
    rarity: 4,
    name: "Bụi Cỏ",
    description: "Bụi cỏ xanh mướt, tạo điểm nhấn tự nhiên cho khu vườn.",
    tileW: 2,
    tileH: 2,
    imageSrc: "/assets/gacha/bui_co.png",
    cardSrc: "/assets/gacha/bui_co.png",
  },
  {
    kind: "decoration",
    id: "cuc_da",
    rarity: 4,
    name: "Cục Đá",
    description: "Cục đá xanh mướt, tạo điểm nhấn tự nhiên cho khu vườn.",
    tileW: 2,
    tileH: 2,
    imageSrc: "/assets/gacha/cuc_da.png",
    cardSrc: "/assets/gacha/cuc_da.png",
  },
];

export const ALL_DECOS: DecoBuilding[] = [...DECO_5, ...DECO_4];

// ─── Roll logic ───────────────────────────────────────────────────────────────

export const GACHA_COST = 1000;
export const GACHA_COST_10 = 10000;

function rollAvocado(): AvocadoReward {
  const tiers = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  return {
    kind: "avocado",
    amount: tiers[Math.floor(Math.random() * tiers.length)],
  };
}

export function rollOne(): GachaResult {
  const r = Math.random() * 100;
  if (r < 10) return DECO_5[Math.floor(Math.random() * DECO_5.length)];
  if (r < 30) return DECO_4[Math.floor(Math.random() * DECO_4.length)];
  return rollAvocado();
}

export function rollTen(): GachaResult[] {
  const results = Array.from({ length: 10 }, () => rollOne());
  const hasDeco = results.some((r) => r.kind === "decoration");
  if (!hasDeco) {
    results[Math.floor(Math.random() * 10)] =
      DECO_4[Math.floor(Math.random() * DECO_4.length)];
  }
  return results;
}

// ─── Visual constants ─────────────────────────────────────────────────────────

export const RARITY_COLOR: Record<DecoRarity, string> = {
  5: "#d4a843",
  4: "#a855b5",
};
export const RARITY_GLOW: Record<DecoRarity, string> = {
  5: "rgba(212,168,67,0.6)",
  4: "rgba(168,85,181,0.6)",
};
export const RARITY_LABEL: Record<DecoRarity, string> = {
  5: "★★★★★",
  4: "★★★★",
};

export const STAR_ANIM_COLOR = {
  5: "#f5c842",
  4: "#c47fff",
  avocado: "#5baeff",
} as const;
export type StarAnimRarity = keyof typeof STAR_ANIM_COLOR;

export function batchStarColor(results: GachaResult[]): StarAnimRarity {
  if (results.some((r) => r.kind === "decoration" && r.rarity === 5)) return 5;
  if (results.some((r) => r.kind === "decoration" && r.rarity === 4)) return 4;
  return "avocado";
}
