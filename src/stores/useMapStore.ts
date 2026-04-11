import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MapState } from "./types";
import { createBuildingSlice } from "./slices/buildingSlice";
import { createYoutubeSlice } from "./slices/youtubeSlice";
import { createTunaSlice } from "./slices/tunaSlice";
import { createT1Slice } from "./slices/t1Slice";
import { createFarmSlice } from "./slices/farmSlice";
import { createGachaSlice } from "./slices/gachaSlice";

export const useMapStore = create<MapState>()(
  persist(
    (set, get, store) => ({
      ...(createBuildingSlice(set, get, store) as MapState),
      ...(createYoutubeSlice(set, get, store) as MapState),
      ...(createTunaSlice(set, get, store) as MapState),
      ...(createT1Slice(set, get, store) as MapState),
      ...(createFarmSlice(set, get, store) as MapState), // ← THÊM
      ...(createGachaSlice(set, get, store) as MapState), // ← THÊM
    }),
    {
      name: "map-storage",
      partialize: (state) => ({
        avocados: state.avocados,
        lastHarvestTime: state.lastHarvestTime,
        unlockedMemories: state.unlockedMemories,
        ytStats: state.ytStats,
        tunaProgress: state.tunaProgress,
        // ── Farm persist ──
        farmPlots: state.farmPlots, // ← THÊM (lưu trạng thái cây)
        // ── Gacha persist ──
        gachaHistory: state.gachaHistory, // ← THÊM
        gachaCollection: state.gachaCollection, // ← THÊM
        gachaTotalPulls: state.gachaTotalPulls, // ← THÊM
      }),
    },
  ),
);

// --- Selectors ---
export const selectCamera = (s: MapState) => s.camera;
export const selectAvocados = (s: MapState) => s.avocados;
export const selectSelectedBuilding = (s: MapState) => s.selectedBuilding;
export const selectYtStats = (s: MapState) => s.ytStats;
export const selectIsLoading = (s: MapState) => s.isLoading;
export const selectLatestNews = (s: MapState) => s.latestNews;
export const selectTunaProgress = (s: MapState) => s.tunaProgress;

// Tuna runtime selectors
export const selectTunaVisible = (s: MapState) => s.tunaVisible;
export const selectTunaAnimOffsetY = (s: MapState) => s.tunaAnimOffsetY;
export const selectTunaAnimating = (s: MapState) => s.tunaAnimating;
export const selectTunaDiving = (s: MapState) => s.tunaDiving;
export const selectTunaInfoOpen = (s: MapState) => s.tunaInfoOpen;

// T1 & Trophy selectors
export const selectT1Visible = (s: MapState) => s.t1Visible;
export const selectT1WorldX = (s: MapState) => s.t1WorldX;
export const selectT1WorldY = (s: MapState) => s.t1WorldY;
export const selectTrophyVisible = (s: MapState) => s.trophyVisible;
export const selectT1Animation = (s: MapState) => s.t1Animation;
export const selectT1AppearAnimation = (s: MapState) => s.t1AppearAnimation;
export const selectMergedVisible = (s: MapState) => s.mergedVisible;
// Thêm vào phần selectors ở cuối file
export const selectGachaOpen = (s: MapState) => s.gachaOpen;
export const selectGachaHistory = (s: MapState) => s.gachaHistory;
export const selectGachaCollection = (s: MapState) => s.gachaCollection;
export const selectGachaTotalPulls = (s: MapState) => s.gachaTotalPulls;
// Computed State
export const selectTotalEnergy = (s: MapState) =>
  s.ytStats.subscribers * 100 +
  s.ytStats.views * 1 +
  s.ytStats.totalLikes * 50 +
  s.ytStats.totalComments * 10;

export const selectActions = (s: MapState) => ({
  setCamera: s.setCamera,
  updateOffset: s.updateOffset,
  setZoom: s.setZoom,
  selectBuilding: s.selectBuilding,
  harvest: s.harvest,
  addAvocados: s.addAvocados,
  setLatestNews: s.setLatestNews,
  unlockMemory: s.unlockMemory,
  fetchYtStats: s.fetchYtStats,
  animateTuna: s.animateTuna,
  sinkTuna: s.sinkTuna,
  toggleTunaInfo: s.toggleTunaInfo,
  setTunaProgress: s.setTunaProgress,
  showT1LeftOfTrophy: s.showT1LeftOfTrophy,
  startT1MoveAcrossTrophy: s.startT1MoveAcrossTrophy,
  updateT1Animation: s.updateT1Animation,
  resetT1AndTrophy: s.resetT1AndTrophy,
});
