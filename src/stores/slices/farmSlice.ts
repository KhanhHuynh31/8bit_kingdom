import { StateCreator } from "zustand";
import { MapState } from "../types";
import { BUILDINGS } from "@/constants/map";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * empty   → chưa trồng gì
 * seeded  → vừa trồng cây con (chờ tưới)
 * watered → đã tưới, đang lớn
 * ready   → cây trưởng thành, sẵn sàng thu hoạch
 */
export type PlotStatus = "empty" | "seeded" | "watered" | "ready";

export interface FarmPlot {
  id: number;
  col: number;
  row: number;
  status: PlotStatus;
  progress: number;          // 0–100, chỉ tăng sau khi tưới
  plantedAt: number | null;
  readyAt: number | null;
  wateringUntil: number | null; // timestamp kết thúc animation mưa
}

export interface FarmDimensions {
  cols: number;
  rows: number;
  total: number;
  originX: number;
  originY: number;
  buildingWidth: number;
  buildingHeight: number;
}

export interface FarmState {
  farmPlots: FarmPlot[];
  farmDimensions: FarmDimensions;

  seedPlot: (plotId: number) => void;
  waterPlot: (plotId: number) => void;
  harvestPlot: (plotId: number) => void;
  tickFarmProgress: (now: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const FARM_BUILDING_ID = "farm";

/** Thời gian cây lớn sau khi tưới (ms). 30s cho dev, đổi thành 300_000 cho prod. */
export const GROW_TIME_MS = 30_000;

/** Thời gian animation mưa hiển thị (ms) */
export const RAIN_DURATION_MS = 3_000;

/** Bơ nhận được khi thu hoạch */
export const HARVEST_YIELD = 200;

// ─── Helpers (exported) ───────────────────────────────────────────────────────

export function computeFarmDimensions(): FarmDimensions {
  const b = BUILDINGS.find((b) => b.id === FARM_BUILDING_ID);
  if (!b) {
    return {
      cols: 2, rows: 2, total: 4,
      originX: 0, originY: 0,
      buildingWidth: 6, buildingHeight: 5,
    };
  }
  // Mỗi ô đất = 2×2 tiles → gộp nội thất building
  const cols = Math.max(1, Math.floor((b.width - 1) / 2));
  const rows = Math.max(1, Math.floor((b.height - 1) / 2));
  return {
    cols,
    rows,
    total: cols * rows,
    originX: b.worldX,
    originY: b.worldY,
    buildingWidth: b.width,
    buildingHeight: b.height,
  };
}

export function makePlots(dims: FarmDimensions): FarmPlot[] {
  return Array.from({ length: dims.total }, (_, i) => ({
    id: i,
    col: i % dims.cols,
    row: Math.floor(i / dims.cols),
    status: "empty" as PlotStatus,
    progress: 0,
    plantedAt: null,
    readyAt: null,
    wateringUntil: null,
  }));
}

function computeProgress(plot: FarmPlot, now: number): number {
  if (!plot.plantedAt || !plot.readyAt) return plot.progress;
  const elapsed = now - plot.plantedAt;
  const total   = plot.readyAt - plot.plantedAt;
  return Math.min(100, Math.round((elapsed / total) * 100));
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createFarmSlice: StateCreator<MapState, [], [], FarmState> = (set, get) => {
  const initialDims = computeFarmDimensions();

  return {
    farmPlots:      makePlots(initialDims),
    farmDimensions: initialDims,

    seedPlot: (plotId) => {
      const { farmPlots } = get();
      const plot = farmPlots[plotId];
      if (!plot || plot.status !== "empty") return;
      set({
        farmPlots: farmPlots.map((p) =>
          p.id === plotId
            ? {
                ...p,
                status:       "seeded" as PlotStatus,
                progress:     0,
                plantedAt:    Date.now(),
                readyAt:      null,
                wateringUntil: null,
              }
            : p
        ),
      });
    },

    waterPlot: (plotId) => {
      const { farmPlots } = get();
      const plot = farmPlots[plotId];
      // Chỉ tưới được khi đã trồng
      if (!plot || plot.status !== "seeded") return;
      const now = Date.now();
      set({
        farmPlots: farmPlots.map((p) =>
          p.id === plotId
            ? {
                ...p,
                status:        "watered" as PlotStatus,
                progress:      0,
                plantedAt:     now,
                readyAt:       now + GROW_TIME_MS,
                wateringUntil: now + RAIN_DURATION_MS,
              }
            : p
        ),
      });
    },

    harvestPlot: (plotId) => {
      const { farmPlots, avocados } = get();
      const plot = farmPlots[plotId];
      if (!plot || plot.status !== "ready") return;
      set({
        farmPlots: farmPlots.map((p) =>
          p.id === plotId
            ? {
                ...p,
                status:        "empty" as PlotStatus,
                progress:      0,
                plantedAt:     null,
                readyAt:       null,
                wateringUntil: null,
              }
            : p
        ),
        avocados: avocados + HARVEST_YIELD,
      });
    },

    tickFarmProgress: (now) => {
      const { farmPlots } = get();
      let changed = false;
      const updated = farmPlots.map((p) => {
        if (p.status !== "watered") return p;
        const newProgress = computeProgress(p, now);
        if (newProgress === p.progress) return p;
        changed = true;
        if (newProgress >= 100) {
          return { ...p, progress: 100, status: "ready" as PlotStatus };
        }
        return { ...p, progress: newProgress };
      });
      if (changed) set({ farmPlots: updated });
    },
  };
};