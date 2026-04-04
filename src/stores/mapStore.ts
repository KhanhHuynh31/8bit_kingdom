import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Camera, Building } from "@/types";

export interface News {
  id: string;
  title: string;
  content: string;
  type: "important" | "news" | "classified";
}

interface MapState {
  camera: Camera;
  selectedBuilding: Building | null;
  avocados: number;
  lastHarvestTime: Record<string, number>;
  unlockedMemories: number[];
  latestNews: News | null;

  unlockMemory: (slotId: number, cost: number) => boolean;
  setCamera: (camera: Camera) => void;
  updateOffset: (dx: number, dy: number) => void;
  setZoom: (zoom: number) => void;
  selectBuilding: (building: Building | null) => void;
  harvest: (buildingId: string) => void;
  addAvocados: (amount: number) => void;
  setLatestNews: (news: News) => void;
}

// ─── Giá trị camera mặc định tách ra ngoài để không tạo object mới mỗi lần reset ──
const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, zoom: 1 };

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      // ── State ────────────────────────────────────────────────────────────
      camera: DEFAULT_CAMERA,
      selectedBuilding: null,
      avocados: 0,
      unlockedMemories: [],
      lastHarvestTime: {},
      latestNews: null,

      // ── Actions ──────────────────────────────────────────────────────────

      setCamera: (camera) => set({ camera }),

      // Chỉ update nếu dx/dy thực sự khác 0 → tránh trigger subscriber vô ích
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

      // Chỉ update khi zoom thực sự thay đổi
      setZoom: (zoom) => {
        if (get().camera.zoom === zoom) return;
        set((state) => ({
          camera: { ...state.camera, zoom },
        }));
      },

      // mapStore.ts — cập nhật action
      selectBuilding: (building) => {
        if (!building) {
          set({ selectedBuilding: null });
          return;
        }
        // Inject timestamp vào mỗi lần select → actionKey luôn unique
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
        // Chỉ update khi id thực sự thay đổi
        if (get().latestNews?.id === news.id) return;
        set({ latestNews: news });
      },

      unlockMemory: (slotId, cost) => {
        const { avocados, unlockedMemories } = get();
        // Dùng Set để kiểm tra O(1) thay vì Array.includes O(n)
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
      // Chỉ persist dữ liệu cần thiết, không persist camera/selectedBuilding/latestNews
      // vì chúng là runtime state, không cần khôi phục sau reload
      partialize: (state) => ({
        avocados: state.avocados,
        lastHarvestTime: state.lastHarvestTime,
        unlockedMemories: state.unlockedMemories,
      }),
    },
  ),
);

// ─── Selector helpers: định nghĩa ngoài component để stable reference ────────
// Import và dùng trực tiếp thay vì viết inline trong useMapStore()
// → Zustand không tạo function mới mỗi render
export const selectCamera = (s: MapState) => s.camera;
export const selectAvocados = (s: MapState) => s.avocados;
export const selectSelectedBuilding = (s: MapState) => s.selectedBuilding;
export const selectLastHarvestTime = (s: MapState) => s.lastHarvestTime;
export const selectUnlockedMemories = (s: MapState) => s.unlockedMemories;
export const selectLatestNews = (s: MapState) => s.latestNews;

// Action selectors — functions là stable reference trong Zustand, dùng chung 1 selector
export const selectActions = (s: MapState) => ({
  setCamera: s.setCamera,
  updateOffset: s.updateOffset,
  setZoom: s.setZoom,
  selectBuilding: s.selectBuilding,
  harvest: s.harvest,
  addAvocados: s.addAvocados,
  setLatestNews: s.setLatestNews,
  unlockMemory: s.unlockMemory,
});
