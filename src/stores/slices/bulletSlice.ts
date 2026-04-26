// src/stores/slices/bulletSlice.ts
import type { StateCreator } from "zustand";

export interface SavedBullet {
  id: number;
  name: string;
  layoutJson: string;   // JSON.stringify(PlacedBulletModule[])
  primaryColor: string;
  dmg: number;
  speed: number;
  radius: number;
}

export interface BulletSliceState {
  savedBullets: SavedBullet[];
}

export interface BulletSliceActions {
  saveBullet: (data: Omit<SavedBullet, "id">) => void;
  deleteBullet: (id: number) => void;
}

export type BulletSlice = BulletSliceState & BulletSliceActions;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createBulletSlice: StateCreator<BulletSlice, any[], [], BulletSlice> = (
  set,
) => ({
  savedBullets: [],

  saveBullet: (data) =>
    set((state) => ({
      savedBullets: [
        ...state.savedBullets,
        { ...data, id: Date.now() },
      ],
    })),

  deleteBullet: (id) =>
    set((state) => ({
      savedBullets: state.savedBullets.filter((b) => b.id !== id),
    })),
});