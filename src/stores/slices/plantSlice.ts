// src/stores/slices/plantLabSlice.ts
import { StateCreator } from "zustand";
import { MapState } from "../types";
import {
  BulletType,
  PlantEffect,
  ModuleType,
} from "@/constants/plantModules";

// ─── Types (export để dùng ở nơi khác) ───────────────────────────────────────

export interface SavedPlant {
  id: number;
  name: string;
  mods: Record<ModuleType, string | null>;
  layout?: string;
  str: number;
  agi: number;
  lck: number;
  bulletType: BulletType;
  effect: PlantEffect | null;
  createdAt: number;
   layoutJson?: string;
 
  /**
   * Snapshot ảnh thật + tint của từng bộ phận tại thời điểm lưu.
   * BattlePanel dùng trường này để render cây chính xác.
   */
  partSnapshots?: Partial<Record<ModuleType, { imagePath: string; tint: string } | null>>;

}

export interface PlantLabState {
  savedPlants: SavedPlant[];
  savePlant: (plant: Omit<SavedPlant, "id" | "createdAt">) => void;
  deletePlant: (id: number) => void;
  updatePlant: (id: number, partial: Partial<SavedPlant>) => void;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createPlantLabSlice: StateCreator<
  MapState,
  [],
  [],
  PlantLabState
> = (set, get) => ({
  savedPlants: [],

  savePlant: (plant) => {
    const { savedPlants } = get();
    const newPlant: SavedPlant = {
      ...plant,
      id: Date.now(),
      createdAt: Date.now(),
    };
    set({ savedPlants: [...savedPlants, newPlant] });
  },

  deletePlant: (id) => {
    set({ savedPlants: get().savedPlants.filter((p) => p.id !== id) });
  },

  updatePlant: (id, partial) => {
    set({
      savedPlants: get().savedPlants.map((p) =>
        p.id === id ? { ...p, ...partial } : p,
      ),
    });
  },
});