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
  totalLikes: number;
  totalComments: number;
  videoCount: number;
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

  // Trạng thái runtime của tuna (không persist)
  tunaVisible: boolean;
  tunaAnimOffsetY: number; // world-unit offset hiện tại (dương = thấp hơn vị trí thật)
  tunaAnimating: boolean;
  tunaDiving: boolean;     // đang lặn xuống (reverse animation)
  tunaInfoOpen: boolean;   // đang hiển thị description của tuna

  // Trạng thái tiến hóa của tuna (CẦN persist)
  tunaProgress: number;    // Tiến trình cho ăn (0 - 1000)

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
  setTunaProgress: (val: number) => void;

  // Tuna actions
  animateTuna: () => void;    // trồi lên
  sinkTuna: () => void;       // lặn xuống
  toggleTunaInfo: () => void; // mở/đóng bubble chat
}

// Giá trị mặc định
const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, zoom: 1 };
const DEFAULT_YT_STATS: YtStats = {
  subscribers: 0,
  views: 0,
  totalLikes: 0,
  totalComments: 0,
  videoCount: 0,
  lastUpdated: 0,
};
export const YOUTUBE_CHANNEL_ID = "UCXA1PWUJIHV_PDStz7ksAUg";

// ── Hằng số animation tuna ─────────────────────────────────────────────────
const TUNA_ANIM_DURATION = 800; // ms
const TUNA_FLOAT_OFFSET = 3;   // world units

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

      // Tuna Runtime
      tunaVisible: false,
      tunaAnimOffsetY: TUNA_FLOAT_OFFSET,
      tunaAnimating: false,
      tunaDiving: false,
      tunaInfoOpen: false,

      // Tuna Persist
      tunaProgress: 0,

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
                totalLikes: json.totalLikes ?? 0,
                totalComments: json.totalComments ?? 0,
                videoCount: parseInt(json.videoCount ?? "0"),
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

      setTunaProgress: (val) => set({ tunaProgress: Math.min(val, 1000) }),

      unlockMemory: (slotId, cost) => {
        const { avocados, unlockedMemories } = get();
        if (avocados < cost || unlockedMemories.includes(slotId)) return false;
        set({
          avocados: avocados - cost,
          unlockedMemories: [...unlockedMemories, slotId],
        });
        return true;
      },

      // ── Tuna Animation: trồi lên ─────────────────────────────────────────
      animateTuna: () => {
        const { tunaVisible, tunaAnimating, tunaDiving } = get();
        if (tunaVisible || tunaAnimating || tunaDiving) return;

        set({ tunaAnimating: true, tunaAnimOffsetY: TUNA_FLOAT_OFFSET, tunaInfoOpen: false });

        const start = performance.now();
        const tick = () => {
          const elapsed = performance.now() - start;
          const progress = Math.min(elapsed / TUNA_ANIM_DURATION, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
          set({ tunaAnimOffsetY: TUNA_FLOAT_OFFSET * (1 - eased) });

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            set({ tunaVisible: true, tunaAnimating: false, tunaAnimOffsetY: 0 });
          }
        };
        requestAnimationFrame(tick);
      },

      // ── Tuna Animation: lặn xuống ───────────────────────────────────────
      sinkTuna: () => {
        const { tunaVisible, tunaAnimating, tunaDiving } = get();
        if (!tunaVisible || tunaAnimating || tunaDiving) return;

        set({ tunaDiving: true, tunaVisible: false, tunaAnimOffsetY: 0, tunaInfoOpen: false });

        const start = performance.now();
        const tick = () => {
          const elapsed = performance.now() - start;
          const progress = Math.min(elapsed / TUNA_ANIM_DURATION, 1);
          const eased = Math.pow(progress, 3); // Ease-in cubic
          set({ tunaAnimOffsetY: TUNA_FLOAT_OFFSET * eased });

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            set({ tunaDiving: false, tunaAnimOffsetY: TUNA_FLOAT_OFFSET });
          }
        };
        requestAnimationFrame(tick);
      },

      toggleTunaInfo: () => {
        const { tunaVisible, tunaInfoOpen } = get();
        if (!tunaVisible) return;
        set({ tunaInfoOpen: !tunaInfoOpen });
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
        tunaProgress: state.tunaProgress, // Persist tiến trình tiến hóa
      }),
    },
  )
);

// ─── Selector Helpers (Tối ưu render cho Next.js 16) ─────────────────────────

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

// Computed State (Số liệu phái sinh - không cần lưu trữ trực tiếp)
export const selectTotalEnergy = (s: MapState) =>
  s.ytStats.subscribers * 100 + // 1 Sub    = 100 Sét
  s.ytStats.views * 1 +         // 1 View   = 1 Sét
  s.ytStats.totalLikes * 50 +   // 1 Like   = 50 Sét
  s.ytStats.totalComments * 10; // 1 Comment = 10 Sét

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
  animateTuna: s.animateTuna,
  sinkTuna: s.sinkTuna,
  toggleTunaInfo: s.toggleTunaInfo,
  setTunaProgress: s.setTunaProgress,
});