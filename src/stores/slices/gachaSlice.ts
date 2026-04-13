import { StateCreator } from "zustand";
import { MapState } from "../types";
import {
  GachaResult, DecoBuilding,
  GACHA_COST, GACHA_COST_10,
  rollOne, rollTen,
  ALL_DECOS,
} from "@/constants/decorationData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GachaPullRecord {
  id:       string;
  result:   GachaResult;
  pulledAt: number;
}

/** Một công trình đã được đặt lên map */
export interface PlacedDecoration {
  /** UUID duy nhất của instance này (không phải decoId) */
  instanceId: string;
  decoId:     string;       // khớp với DecoBuilding.id
  /** Toạ độ world-space (tile) — có thể là số thập phân */
  worldX:     number;
  worldY:     number;
  tileW:      number;
  tileH:      number;
}

export interface GachaState {
  // ── Gacha UI state ──
  gachaOpen:       boolean;
  gachaAnimating:  boolean;
  gachaResults:    GachaResult[] | null;

  // ── Persist ──
  gachaHistory:    GachaPullRecord[];
  /** id → số lượng trong kho (chưa đặt) */
  inventory:       Record<string, number>;
  /** Danh sách công trình đã đặt lên map */
  placedDecos:     PlacedDecoration[];
  gachaTotalPulls: number;

  // ── Gacha actions ──
  openGacha:      () => void;
  closeGacha:     () => void;
  performPull:    () => GachaResult[] | null;
  performPull10:  () => GachaResult[] | null;
  finishAnim:     () => void;

  // ── Inventory & placement actions ──
  /** Đặt 1 công trình từ kho lên map */
  placeDecoration:  (decoId: string, worldX: number, worldY: number) => boolean;
  /** Di chuyển công trình đã đặt sang toạ độ mới */
  moveDecoration:   (instanceId: string, worldX: number, worldY: number) => boolean;
  /** Xóa công trình khỏi map và trả lại kho */
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

/** Kiểm tra 2 hình chữ nhật có overlap không (với tolerance 0.1 tile) */
function overlaps(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  const TOL = 0.1;
  return (
    ax < bx + bw - TOL && ax + aw > bx + TOL &&
    ay < by + bh - TOL && ay + ah > by + TOL
  );
}

/** Kiểm tra vị trí có bị trùng với bất kỳ công trình đã đặt nào không */
function isOccupied(
  placed: PlacedDecoration[],
  x: number, y: number, w: number, h: number,
  excludeId?: string,
): boolean {
  return placed.some((p) => {
    if (p.instanceId === excludeId) return false;
    return overlaps(x, y, w, h, p.worldX, p.worldY, p.tileW, p.tileH);
  });
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createGachaSlice: StateCreator<MapState, [], [], GachaState> = (set, get) => ({
  gachaOpen:      false,
  gachaAnimating: false,
  gachaResults:   null,
  gachaHistory:   [],
  inventory:      {},
  placedDecos:    [],
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
      avocados:       avocados - GACHA_COST + avoPrize,
      gachaResults:   results,
      gachaAnimating: true,
      gachaTotalPulls: gachaTotalPulls + 1,
      gachaHistory:   [...records, ...gachaHistory].slice(0, 200),
      inventory:      newInv,
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
      avocados:       avocados - GACHA_COST_10 + avoPrize,
      gachaResults:   results,
      gachaAnimating: true,
      gachaTotalPulls: gachaTotalPulls + 10,
      gachaHistory:   [...records, ...gachaHistory].slice(0, 200),
      inventory:      newInv,
    });
    return results;
  },

  placeDecoration: (decoId, worldX, worldY) => {
    const { inventory, placedDecos } = get();
    if ((inventory[decoId] ?? 0) <= 0) return false;

    // Lấy kích thước từ ALL_DECOS
    const meta: DecoBuilding | undefined = ALL_DECOS.find((d: DecoBuilding) => d.id === decoId);
    if (!meta) return false;

    const { tileW, tileH } = meta;

    // Kiểm tra overlap
    if (isOccupied(placedDecos, worldX, worldY, tileW, tileH)) return false;

    const instance: PlacedDecoration = {
      instanceId: uid(),
      decoId,
      worldX,
      worldY,
      tileW,
      tileH,
    };

    set({
      inventory:   { ...inventory, [decoId]: inventory[decoId] - 1 },
      placedDecos: [...placedDecos, instance],
    });
    return true;
  },

  moveDecoration: (instanceId, worldX, worldY) => {
    const { placedDecos } = get();
    const target = placedDecos.find((p) => p.instanceId === instanceId);
    if (!target) return false;

    if (isOccupied(placedDecos, worldX, worldY, target.tileW, target.tileH, instanceId)) return false;

    set({
      placedDecos: placedDecos.map((p) =>
        p.instanceId === instanceId ? { ...p, worldX, worldY } : p
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