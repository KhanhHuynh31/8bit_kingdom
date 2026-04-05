import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Camera, Building } from "@/types";

export interface News {
  id: string;
  title: string;
  content: string;
  type: "important" | "news" | "classified";
}

interface YtStats {
  subscribers: number;
  views: number;
  lastUpdated: number;
}

interface MapState {
  // ── State ────────────────────────────────────────────────────────────
  camera: Camera;
  selectedBuilding: Building | null;
  avocados: number;
  ytStats: YtStats;
  isLoading: boolean; // Trạng thái để hiện loading UI và chặn trùng lặp request
  lastHarvestTime: Record<string, number>;
  unlockedMemories: number[];
  latestNews: News | null;

  // ── Actions ──────────────────────────────────────────────────────────
  fetchYtStats: (force?: boolean) => Promise<void>;
  unlockMemory: (slotId: number, cost: number) => boolean;
  setCamera: (camera: Camera) => void;
  updateOffset: (dx: number, dy: number) => void;
  setZoom: (zoom: number) => void;
  selectBuilding: (building: Building | null) => void;
  harvest: (buildingId: string) => void;
  addAvocados: (amount: number) => void;
  setLatestNews: (news: News) => void;
}

// Giá trị mặc định
const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, zoom: 1 };
const DEFAULT_YT_STATS: YtStats = { subscribers: 0, views: 0, lastUpdated: 0 };
export const YOUTUBE_CHANNEL_ID = "UCXA1PWUJIHV_PDStz7ksAUg";

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      // ── Khởi tạo State ───────────────────────────────────────────────────
      camera: DEFAULT_CAMERA,
      selectedBuilding: null,
      avocados: 0,
      ytStats: DEFAULT_YT_STATS,
      isLoading: false,
      unlockedMemories: [],
      lastHarvestTime: {},
      latestNews: null,

      // ── Logic Xử lý Actions ──────────────────────────────────────────────

      fetchYtStats: async (force = false) => {
        const { ytStats, isLoading } = get();
        
        // Kiểm tra thời gian: 60 phút (3600000 ms)
        const isExpired = Date.now() - ytStats.lastUpdated > 3600000;
        
        // ĐIỀU KIỆN CHẠY API:
        // 1. Được gọi ép buộc (force = true)
        // 2. HOẶC Dữ liệu hiện tại đang là 0 (chưa có data)
        // 3. HOẶC Dữ liệu đã cũ (quá 60 phút)
        const shouldFetch = force || ytStats.subscribers === 0 || isExpired;

        if (!shouldFetch || isLoading) return;

        set({ isLoading: true });
        try {
          const res = await fetch("/api/youtube");
          const json = await res.json();
          
          if (json.subscribers !== undefined) {
            set({
              ytStats: {
                subscribers: parseInt(json.subscribers),
                views: parseInt(json.views),
                lastUpdated: Date.now(),
              },
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Lỗi Store khi cập nhật YouTube:", error);
          set({ isLoading: false });
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
      // Chỉ lưu trữ những dữ liệu cần thiết qua các phiên làm việc
      partialize: (state) => ({
        avocados: state.avocados,
        lastHarvestTime: state.lastHarvestTime,
        unlockedMemories: state.unlockedMemories,
        ytStats: state.ytStats, // Lưu lại để lần sau mở web có data ngay
      }),
    }
  )
);

// ─── Selector Helpers (Tối ưu render cho Next.js 16) ─────────────────────────

export const selectCamera = (s: MapState) => s.camera;
export const selectAvocados = (s: MapState) => s.avocados;
export const selectSelectedBuilding = (s: MapState) => s.selectedBuilding;
export const selectYtStats = (s: MapState) => s.ytStats;
export const selectIsLoading = (s: MapState) => s.isLoading;
export const selectLatestNews = (s: MapState) => s.latestNews;

// Computed State (Số liệu phái sinh - không cần lưu trữ trực tiếp)
export const selectTotalEnergy = (s: MapState) => 
  (s.ytStats.subscribers * 100) + (s.ytStats.views * 1);

// Chú ý: Khi dùng Actions trong Component, nên lấy lẻ từng hàm 
// hoặc dùng useShallow để tránh lỗi "getSnapshot" infinite loop.
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
});