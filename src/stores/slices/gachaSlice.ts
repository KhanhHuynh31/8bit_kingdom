import { StateCreator } from "zustand";
import { MapState } from "../types";
import {
  GachaResult, ALL_DECOS,
  GACHA_COST, GACHA_COST_10,
  rollOne, rollTen,
} from "@/constants/decorationData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GachaPullRecord {
  id:       string;
  result:   GachaResult;
  pulledAt: number;
}

export interface PlacedDecoration {
  instanceId: string;
  decoId:     string;
  worldX:     number;
  worldY:     number;
  tileW:      number;
  tileH:      number;
}

export interface GachaState {
  gachaOpen:       boolean;
  gachaAnimating:  boolean;
  gachaResults:    GachaResult[] | null;
  gachaHistory:    GachaPullRecord[];
  /** Kho đồ chưa đặt: decoId → số lượng */
  inventory:       Record<string, number>;
  /** Công trình đã đặt trên map */
  placedDecos:     PlacedDecoration[];
  gachaTotalPulls: number;

  openGacha:        () => void;
  closeGacha:       () => void;
  performPull:      () => GachaResult[] | null;
  performPull10:    () => GachaResult[] | null;
  finishAnim:       () => void;
  placeDecoration:  (decoId: string, worldX: number, worldY: number) => boolean;
  moveDecoration:   (instanceId: string, worldX: number, worldY: number) => boolean;
  removeDecoration: (instanceId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeRecords(results: GachaResult[]): GachaPullRecord[] {
  const now = Date.now();
  return results.map((r) => ({ id: uid(), result: r, pulledAt: now }));
}

/**
 * Kiểm tra 2 hình chữ nhật tile có chồng nhau không.
 * Không dùng tolerance — snap đã đảm bảo toạ độ là số nguyên.
 */
function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function isOccupiedByPlaced(
  placedDecos: PlacedDecoration[],
  x: number, y: number, w: number, h: number,
  excludeId?: string,
): boolean {
  return placedDecos.some((p) => {
    if (p.instanceId === excludeId) return false;
    return rectsOverlap(x, y, w, h, p.worldX, p.worldY, p.tileW, p.tileH);
  });
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createGachaSlice: StateCreator<MapState, [], [], GachaState> = (set, get) => ({
  gachaOpen:       false,
  gachaAnimating:  false,
  gachaResults:    null,
  gachaHistory:    [],
  inventory:       {},
  placedDecos:     [],
  gachaTotalPulls: 0,

  openGacha:  () => set({ gachaOpen: true }),
  closeGacha: () => set({ gachaOpen: false, gachaResults: null, gachaAnimating: false }),
  finishAnim: () => set({ gachaAnimating: false }),

  performPull: () => {
    const { avocados, gachaHistory, inventory, gachaTotalPulls, gachaAnimating } = get();
    if (gachaAnimating || avocados < GACHA_COST) return null;

    const results  = [rollOne()];
    const records  = makeRecords(results);
    const avoPrize = results.reduce((s, r) => s + (r.kind === "avocado" ? r.amount : 0), 0);
    const newInv   = { ...inventory };
    results.forEach((r) => { if (r.kind === "decoration") newInv[r.id] = (newInv[r.id] ?? 0) + 1; });

    set({
      avocados:        avocados - GACHA_COST + avoPrize,
      gachaResults:    results,
      gachaAnimating:  true,
      gachaTotalPulls: gachaTotalPulls + 1,
      gachaHistory:    [...records, ...gachaHistory].slice(0, 200),
      inventory:       newInv,
    });
    return results;
  },

  performPull10: () => {
    const { avocados, gachaHistory, inventory, gachaTotalPulls, gachaAnimating } = get();
    if (gachaAnimating || avocados < GACHA_COST_10) return null;

    const results  = rollTen();
    const records  = makeRecords(results);
    const avoPrize = results.reduce((s, r) => s + (r.kind === "avocado" ? r.amount : 0), 0);
    const newInv   = { ...inventory };
    results.forEach((r) => { if (r.kind === "decoration") newInv[r.id] = (newInv[r.id] ?? 0) + 1; });

    set({
      avocados:        avocados - GACHA_COST_10 + avoPrize,
      gachaResults:    results,
      gachaAnimating:  true,
      gachaTotalPulls: gachaTotalPulls + 10,
      gachaHistory:    [...records, ...gachaHistory].slice(0, 200),
      inventory:       newInv,
    });
    return results;
  },

  placeDecoration: (decoId, worldX, worldY) => {
    const { inventory, placedDecos } = get();
    if ((inventory[decoId] ?? 0) <= 0) return false;

    // Lấy kích thước từ ALL_DECOS (import trực tiếp, không dùng require)
    const meta = ALL_DECOS.find((d) => d.id === decoId);
    if (!meta) return false;

    const { tileW, tileH } = meta;

    // Chỉ check overlap với placed decos khác
    // (check với BUILDINGS tĩnh được làm ở UI layer để ghostValid đồng nhất)
    if (isOccupiedByPlaced(placedDecos, worldX, worldY, tileW, tileH)) return false;

    set({
      inventory:   { ...inventory, [decoId]: inventory[decoId] - 1 },
      placedDecos: [...placedDecos, { instanceId: uid(), decoId, worldX, worldY, tileW, tileH }],
    });
    return true;
  },

  moveDecoration: (instanceId, worldX, worldY) => {
    const { placedDecos } = get();
    const target = placedDecos.find((p) => p.instanceId === instanceId);
    if (!target) return false;

    if (isOccupiedByPlaced(placedDecos, worldX, worldY, target.tileW, target.tileH, instanceId)) {
      return false;
    }

    set({
      placedDecos: placedDecos.map((p) =>
        p.instanceId === instanceId ? { ...p, worldX, worldY } : p,
      ),
    });
    return true;
  },

  removeDecoration: (instanceId) => {
    const { placedDecos, inventory } = get();
    const target = placedDecos.find((p) => p.instanceId === instanceId);
    if (!target) return;
    set({
      placedDecos: placedDecos.filter((p) => p.instanceId !== instanceId),
      inventory:   { ...inventory, [target.decoId]: (inventory[target.decoId] ?? 0) + 1 },
    });
  },
});