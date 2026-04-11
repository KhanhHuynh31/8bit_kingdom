import { StateCreator } from "zustand";
import { MapState } from "../types";
import {
  GachaResult,
  GACHA_COST, GACHA_COST_10,
  rollOne, rollTen,
} from "@/constants/gachaData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GachaPullRecord {
  id:       string;
  result:   GachaResult;   // nhân vật HOẶC phần thưởng bơ
  pulledAt: number;
}

export interface GachaState {
  gachaOpen:       boolean;
  gachaAnimating:  boolean;
  /** Kết quả batch vừa roll (1 hoặc 10). Null khi chưa có hoặc đã đóng. */
  gachaResults:    GachaResult[] | null;
  gachaHistory:    GachaPullRecord[];
  /** Chỉ lưu nhân vật đã có: id → số lần */
  gachaCollection: Record<string, number>;
  gachaTotalPulls: number;

  openGacha:        () => void;
  closeGacha:       () => void;
  performPull:      () => GachaResult[] | null;  // x1
  performPullTen:   () => GachaResult[] | null;  // x10
  finishAnimation:  () => void;  // gọi khi canvas xong → tắt animating
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecords(results: GachaResult[]): GachaPullRecord[] {
  return results.map((r) => ({
    id:       `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    result:   r,
    pulledAt: Date.now(),
  }));
}

function updateCollection(
  col: Record<string, number>,
  results: GachaResult[],
): Record<string, number> {
  const next = { ...col };
  results.forEach((r) => {
    if (r.kind === "character") {
      next[r.id] = (next[r.id] ?? 0) + 1;
    }
  });
  return next;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createGachaSlice: StateCreator<MapState, [], [], GachaState> = (set, get) => ({
  gachaOpen:       false,
  gachaAnimating:  false,
  gachaResults:    null,
  gachaHistory:    [],
  gachaCollection: {},
  gachaTotalPulls: 0,

  openGacha:  () => set({ gachaOpen: true }),
  closeGacha: () => set({ gachaOpen: false, gachaResults: null, gachaAnimating: false }),

  performPull: () => {
    const { avocados, gachaHistory, gachaCollection, gachaTotalPulls, gachaAnimating } = get();
    if (gachaAnimating || avocados < GACHA_COST) return null;

    const results  = [rollOne()];
    const records  = makeRecords(results);
    const avoPrize = results.reduce((s, r) => s + (r.kind === "avocado" ? r.amount : 0), 0);

    set({
      avocados:        avocados - GACHA_COST + avoPrize,
      gachaResults:    results,
      gachaAnimating:  true,
      gachaTotalPulls: gachaTotalPulls + 1,
      gachaHistory:    [...records, ...gachaHistory].slice(0, 200),
      gachaCollection: updateCollection(gachaCollection, results),
    });
    return results;
  },

  performPullTen: () => {
    const { avocados, gachaHistory, gachaCollection, gachaTotalPulls, gachaAnimating } = get();
    if (gachaAnimating || avocados < GACHA_COST_10) return null;

    const results  = rollTen();
    const records  = makeRecords(results);
    const avoPrize = results.reduce((s, r) => s + (r.kind === "avocado" ? r.amount : 0), 0);

    set({
      avocados:        avocados - GACHA_COST_10 + avoPrize,
      gachaResults:    results,
      gachaAnimating:  true,
      gachaTotalPulls: gachaTotalPulls + 10,
      gachaHistory:    [...records, ...gachaHistory].slice(0, 200),
      gachaCollection: updateCollection(gachaCollection, results),
    });
    return results;
  },

  finishAnimation: () => set({ gachaAnimating: false }),
});