import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Camera, Building } from "@/types";

export interface News {
  id: string;
  title: string;
  content: string;
  type: "important" | "news" | "classified";
}

// ─── Khai báo Interface mới cho YouTube ───
interface YtStats {
  subscribers: number;
  views: number;
  lastUpdated: number;
}

interface MapState {
  camera: Camera;
  selectedBuilding: Building | null;
  avocados: number;
  ytStats: YtStats; // <-- Thêm mới
  lastHarvestTime: Record<string, number>;
  unlockedMemories: number[];
  latestNews: News | null;

  // Actions
  fetchYtStats: () => Promise<void>; // <-- Thêm mới
  unlockMemory: (slotId: number, cost: number) => boolean;
  setCamera: (camera: Camera) => void;
  updateOffset: (dx: number, dy: number) => void;
  setZoom: (zoom: number) => void;
  selectBuilding: (building: Building | null) => void;
  harvest: (buildingId: string) => void;
  addAvocados: (amount: number) => void;
  setLatestNews: (news: News) => void;
}

const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, zoom: 1 };
const DEFAULT_YT_STATS: YtStats = { subscribers: 0, views: 0, lastUpdated: 0 };

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      // ── State ────────────────────────────────────────────────────────────
      camera: DEFAULT_CAMERA,
      selectedBuilding: null,
      avocados: 0,
      ytStats: DEFAULT_YT_STATS, // Khởi tạo State YouTube
      unlockedMemories: [],
      lastHarvestTime: {},
      latestNews: null,

      // ── Actions ──────────────────────────────────────────────────────────

      // MỚI: Fetch dữ liệu YouTube và cập nhật Store
      fetchYtStats: async () => {
        try {
          const res = await fetch("/api/youtube");
          const json = await res.json();
          if (json.subscribers) {
            set({
              ytStats: {
                subscribers: parseInt(json.subscribers),
                views: parseInt(json.views),
                lastUpdated: Date.now(),
              },
            });
          }
        } catch (error) {
          console.error("Lỗi Store khi cập nhật YT:", error);
        }
      },

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
        set((state) => ({
          camera: { ...state.camera, zoom },
        }));
      },

      selectBuilding: (building) => {
        if (!building) {
          set({ selectedBuilding: null });
          return;
        }
        set({ selectedBuilding: { ...building, clickedAt: Date.now() } });
      },

      harvest: (buildingId) =>
        set((state) => ({
          lastHarvestTime: {
            ...state.lastHarvestTime,
            [buildingId]: Date.now(),
          },
        })),

      addAvocados: (amount) => {
        if (amount === 0) return;
        set((state) => ({ avocados: state.avocados + amount }));
      },

      setLatestNews: (news) => {
        if (get().latestNews?.id === news.id) return;
        set({ latestNews: news });
      },

      unlockMemory: (slotId, cost) => {
        const { avocados, unlockedMemories } = get();
        if (avocados < cost || unlockedMemories.includes(slotId)) return false;
        set({
          avocados: avocados - cost,
          unlockedMemories: [...unlockedMemories, slotId],
        });
        return true;
      },
    }),
    {
      name: "map-storage",
      // CẬP NHẬT: Thêm ytStats vào partialize để lưu trữ lâu dài
      partialize: (state) => ({
        avocados: state.avocados,
        lastHarvestTime: state.lastHarvestTime,
        unlockedMemories: state.unlockedMemories,
        ytStats: state.ytStats, // Lưu số liệu YT để load tức thì khi F5
      }),
    }
  )
);

// ─── Selector helpers ───────────────────────────────────────────────────────
export const selectCamera = (s: MapState) => s.camera;
export const selectAvocados = (s: MapState) => s.avocados;
export const selectSelectedBuilding = (s: MapState) => s.selectedBuilding;
export const selectLastHarvestTime = (s: MapState) => s.lastHarvestTime;
export const selectUnlockedMemories = (s: MapState) => s.unlockedMemories;
export const selectLatestNews = (s: MapState) => s.latestNews;
export const selectYtStats = (s: MapState) => s.ytStats; // Selector mới
// Tính năng lượng tổng (Derived State)
export const selectTotalEnergy = (s: MapState) => 
  (s.ytStats.subscribers * 100) + (s.ytStats.views * 1);

export const selectActions = (s: MapState) => ({
  setCamera: s.setCamera,
  updateOffset: s.updateOffset,
  setZoom: s.setZoom,
  selectBuilding: s.selectBuilding,
  harvest: s.harvest,
  addAvocados: s.addAvocados,
  setLatestNews: s.setLatestNews,
  unlockMemory: s.unlockMemory,
  fetchYtStats: s.fetchYtStats, // Action mới
});