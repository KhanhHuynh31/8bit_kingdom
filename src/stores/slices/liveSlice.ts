// slices/uiSlice.ts
import { StateCreator } from "zustand";
import { MapState } from "../types";

export const createLiveSlice: StateCreator<MapState, [], [], Partial<MapState>> = (set) => ({
  isLiveMode: false,
  setIsLiveMode: (val) => set({ isLiveMode: val }),
});