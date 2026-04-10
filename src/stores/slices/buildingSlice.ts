import { StateCreator } from "zustand";
import { DEFAULT_CAMERA, MapState } from "../types";

export const createBuildingSlice: StateCreator<MapState, [], [], Partial<MapState>> = (set, get) => ({
  camera: DEFAULT_CAMERA,
  selectedBuilding: null,
  avocados: 0,
  isLoading: false,
  unlockedMemories: [],
  lastHarvestTime: {},
  latestNews: null,

  setCamera: (camera) => set({ camera }),
  updateOffset: (dx, dy) => {
    if (dx === 0 && dy === 0) return;
    set((state) => ({
      camera: {
        ...state.camera,
        offsetX: state.camera.offsetX + dx,
        offsetY: state.camera.offsetY + dy,
      },
    }));
  },
  setZoom: (zoom) => {
    if (get().camera.zoom === zoom) return;
    set((state) => ({ camera: { ...state.camera, zoom } }));
  },
  selectBuilding: (building) =>
    set({
      selectedBuilding: building ? { ...building, clickedAt: Date.now() } : null,
    }),
  harvest: (buildingId) =>
    set((state) => ({
      lastHarvestTime: { ...state.lastHarvestTime, [buildingId]: Date.now() },
    })),
  addAvocados: (amount) => set((state) => ({ avocados: state.avocados + amount })),
  setLatestNews: (news) => set({ latestNews: news }),
  unlockMemory: (slotId, cost) => {
    const { avocados, unlockedMemories } = get();
    if (avocados < cost || unlockedMemories.includes(slotId)) return false;
    set({
      avocados: avocados - cost,
      unlockedMemories: [...unlockedMemories, slotId],
    });
    return true;
  },
});