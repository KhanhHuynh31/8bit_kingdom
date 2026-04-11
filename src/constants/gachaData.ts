// ─── gachaData.ts ─────────────────────────────────────────────────────────────
// Tỉ lệ mới: 5★ = 10% | 4★ = 20% | Bơ ngẫu nhiên = 70%
// Ảnh: /public/assets/gacha/characters/{id}.png
//       /public/assets/gacha/cards/{id}_card.png

export type StarRarity = 4 | 5;

// ─── Phần thưởng bơ (thay thế 3★) ───────────────────────────────────────────
export interface AvocadoReward {
  kind: "avocado";
  amount: number; // 100 – 1000 ngẫu nhiên
}

export interface GachaCharacter {
  kind: "character";
  id: string;
  name: string;
  rarity: StarRarity;
  description: string;
  imageSrc: string;
  cardSrc: string;
}

export type GachaResult = GachaCharacter | AvocadoReward;

// ─── 5★ (10%) ─────────────────────────────────────────────────────────────────
export const CHARACTERS_5: GachaCharacter[] = [
  {
    kind: "character", id: "vua", name: "Vua Bơ Toàn Năng", rarity: 5,
    description: "Lữ khách từ vũ trụ khác, mang trong mình sức mạnh của các nguyên tố.",
    imageSrc: "/assets/gacha/vua.png",
    cardSrc:  "/assets/gacha/vua.png",
  },
    {
    kind: "character", id: "hoang_hau", name: "Hoàng Hậu Bơ", rarity: 5,
    description: "Lữ khách từ vũ trụ khác, mang trong mình sức mạnh của các nguyên tố.",
    imageSrc: "/assets/gacha/hoang_hau.png",
    cardSrc:  "/assets/gacha/hoang_hau.png",
  },
    {
    kind: "character", id: "cong_chua", name: "Công Chúa Bơ", rarity: 5,
    description: "Lữ khách từ vũ trụ khác, mang trong mình sức mạnh của các nguyên tố.",
    imageSrc: "/assets/gacha/cong_chua.png",
    cardSrc:  "/assets/gacha/cong_chua.png",
  },
    {
    kind: "character", id: "tuong_quan", name: "Tướng Quân Bơ", rarity: 5,
    description: "Lữ khách từ vũ trụ khác, mang trong mình sức mạnh của các nguyên tố.",
    imageSrc: "/assets/gacha/tuong_quan.png",
    cardSrc:  "/assets/gacha/tuong_quan.png",
  },
];

// ─── 4★ (20%) ─────────────────────────────────────────────────────────────────
export const CHARACTERS_4: GachaCharacter[] = [
  {
    kind: "character", id: "binh_linh", name: "Binh Lính Bơ", rarity: 4,
    description: "Đầu bếp thiên tài của Wanmin Restaurant, bạn đồng hành trung thành.",
    imageSrc: "/assets/gacha/binh_linh.png",
    cardSrc:  "/assets/gacha/binh_linh.png",
  },
   {
    kind: "character", id: "quy_toc", name: "Quý Tộc Bơ", rarity: 4,
    description: "Đầu bếp thiên tài của Wanmin Restaurant, bạn đồng hành trung thành.",
    imageSrc: "/assets/gacha/quy_toc.png",
    cardSrc:  "/assets/gacha/quy_toc.png",
  },
    {
    kind: "character", id: "nong_dan", name: "Nông Dân Bơ", rarity: 4,
    description: "Đầu bếp thiên tài của Wanmin Restaurant, bạn đồng hành trung thành.",
    imageSrc: "/assets/gacha/nong_dan.png",
    cardSrc:  "/assets/gacha/nong_dan.png",
  },
];

export const ALL_CHARACTERS: GachaCharacter[] = [...CHARACTERS_5, ...CHARACTERS_4];

// ─── Roll logic ───────────────────────────────────────────────────────────────

export const GACHA_COST    = 1000;
export const GACHA_COST_10 = 10000;

/** Bơ ngẫu nhiên 100–1000 (bội số 100) thay 3★ */
function rollAvocado(): AvocadoReward {
  const tiers = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  return { kind: "avocado", amount: tiers[Math.floor(Math.random() * tiers.length)] };
}

/** 1 lần roll: 5★=10% | 4★=20% | 🥑=70% */
export function rollOne(): GachaResult {
  const r = Math.random() * 100;
  if (r < 10) {
    return CHARACTERS_5[Math.floor(Math.random() * CHARACTERS_5.length)];
  } else if (r < 30) {
    return CHARACTERS_4[Math.floor(Math.random() * CHARACTERS_4.length)];
  }
  return rollAvocado();
}

/** x10 roll — đảm bảo ít nhất 1 nhân vật 4★ hoặc 5★ */
export function rollTen(): GachaResult[] {
  const results: GachaResult[] = Array.from({ length: 10 }, () => rollOne());
  const hasChar = results.some((r) => r.kind === "character");
  if (!hasChar) {
    // Đảm bảo ít nhất 1 nhân vật 4★
    const idx = Math.floor(Math.random() * 10);
    results[idx] = CHARACTERS_4[Math.floor(Math.random() * CHARACTERS_4.length)];
  }
  return results;
}

// ─── Visual constants ─────────────────────────────────────────────────────────

// Màu sắc theo phong cách RPG parchment
export const RARITY_COLOR: Record<StarRarity, string> = {
  5: "#d4a843", // vàng cổ
  4: "#a855b5", // tím cổ
};
export const RARITY_GLOW: Record<StarRarity, string> = {
  5: "rgba(212,168,67,0.65)",
  4: "rgba(168,85,181,0.65)",
};
export const RARITY_LABEL: Record<StarRarity, string> = {
  5: "★★★★★",
  4: "★★★★",
};

// Màu ngôi sao cho canvas animation
export const STAR_ANIM_COLOR = {
  5:       "#f5c842",
  4:       "#c47fff",
  avocado: "#5baeff",   // xanh cho phần thưởng bơ
} as const;

export type StarAnimRarity = keyof typeof STAR_ANIM_COLOR;

/** Tính "rarity màu" cao nhất để chọn màu ngôi sao cho cả batch */
export function batchStarColor(results: GachaResult[]): StarAnimRarity {
  if (results.some((r) => r.kind === "character" && r.rarity === 5)) return 5;
  if (results.some((r) => r.kind === "character" && r.rarity === 4)) return 4;
  return "avocado";
}