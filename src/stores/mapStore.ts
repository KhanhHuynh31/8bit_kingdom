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

export interface T1Animation {
  active: boolean;
  startX: number;
  endX: number;
  startY: number;
  progress: number;
  startTime: number;
  duration: number;
}

export interface T1AppearAnimation {
  active: boolean;
  startX: number;
  endX: number;
  startY: number;
  progress: number;
  startTime: number;
  duration: number;
}

interface MapState {
  camera: Camera;
  selectedBuilding: Building | null;
  avocados: number;
  ytStats: YtStats;
  isLoading: boolean;
  lastHarvestTime: Record<string, number>;
  unlockedMemories: number[];
  latestNews: News | null;

  // Tuna runtime
  tunaVisible: boolean;
  tunaAnimOffsetY: number;
  tunaAnimating: boolean;
  tunaDiving: boolean;
  tunaInfoOpen: boolean;
  tunaProgress: number;

  // T1 & Trophy dynamic (không persist)
  t1Visible: boolean;
  t1WorldX: number;
  t1WorldY: number;
  trophyVisible: boolean;
  t1Animation: T1Animation | null;
  t1AppearAnimation: T1AppearAnimation | null; // Animation xuất hiện

  // Actions
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
  animateTuna: () => void;
  sinkTuna: () => void;
  toggleTunaInfo: () => void;

  // T1 & Trophy actions
  showT1LeftOfTrophy: () => void;
  startT1MoveAcrossTrophy: () => void;
  updateT1Animation: (now: number) => void;
  resetT1AndTrophy: () => void;
}

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

const TUNA_ANIM_DURATION = 800;
const TUNA_FLOAT_OFFSET = 3;

// Vị trí mặc định của t1 và trophy (lấy từ constants/map)
const DEFAULT_T1_X = 9;
const DEFAULT_T1_Y = -8;
const TROPHY_X = 12;
const TROPHY_Y = -7;
const TROPHY_W = 2;
const T1_W = 3;

// Vị trí xuất phát xa (bên trái màn hình, cách trophy khoảng 30 đơn vị)
const FAR_LEFT_X = TROPHY_X - 30;

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      camera: DEFAULT_CAMERA,
      selectedBuilding: null,
      avocados: 0,
      ytStats: DEFAULT_YT_STATS,
      isLoading: false,
      unlockedMemories: [],
      lastHarvestTime: {},
      latestNews: null,

      tunaVisible: false,
      tunaAnimOffsetY: TUNA_FLOAT_OFFSET,
      tunaAnimating: false,
      tunaDiving: false,
      tunaInfoOpen: false,
      tunaProgress: 0,

      t1Visible: false,
      t1WorldX: DEFAULT_T1_X,
      t1WorldY: DEFAULT_T1_Y,
      trophyVisible: true,
      t1Animation: null,
      t1AppearAnimation: null,

      fetchYtStats: async (force = false) => {
        const { ytStats, isLoading } = get();
        const isExpired = Date.now() - ytStats.lastUpdated > 3600000;
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
        set((state) => ({ camera: { ...state.camera, zoom } }));
      },
      selectBuilding: (building) => set({ selectedBuilding: building ? { ...building, clickedAt: Date.now() } : null }),
      harvest: (buildingId) => set((state) => ({ lastHarvestTime: { ...state.lastHarvestTime, [buildingId]: Date.now() } })),
      addAvocados: (amount) => set((state) => ({ avocados: state.avocados + amount })),
      setLatestNews: (news) => set({ latestNews: news }),
      setTunaProgress: (val) => set({ tunaProgress: Math.min(val, 1000) }),

      unlockMemory: (slotId, cost) => {
        const { avocados, unlockedMemories } = get();
        if (avocados < cost || unlockedMemories.includes(slotId)) return false;
        set({ avocados: avocados - cost, unlockedMemories: [...unlockedMemories, slotId] });
        return true;
      },

      animateTuna: () => {
        const { tunaVisible, tunaAnimating, tunaDiving } = get();
        if (tunaVisible || tunaAnimating || tunaDiving) return;
        set({ tunaAnimating: true, tunaAnimOffsetY: TUNA_FLOAT_OFFSET, tunaInfoOpen: false });
        const start = performance.now();
        const tick = () => {
          const elapsed = performance.now() - start;
          const progress = Math.min(elapsed / TUNA_ANIM_DURATION, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          set({ tunaAnimOffsetY: TUNA_FLOAT_OFFSET * (1 - eased) });
          if (progress < 1) requestAnimationFrame(tick);
          else set({ tunaVisible: true, tunaAnimating: false, tunaAnimOffsetY: 0 });
        };
        requestAnimationFrame(tick);
      },

      sinkTuna: () => {
        const { tunaVisible, tunaAnimating, tunaDiving } = get();
        if (!tunaVisible || tunaAnimating || tunaDiving) return;
        set({ tunaDiving: true, tunaVisible: false, tunaAnimOffsetY: 0, tunaInfoOpen: false });
        const start = performance.now();
        const tick = () => {
          const elapsed = performance.now() - start;
          const progress = Math.min(elapsed / TUNA_ANIM_DURATION, 1);
          const eased = Math.pow(progress, 3);
          set({ tunaAnimOffsetY: TUNA_FLOAT_OFFSET * eased });
          if (progress < 1) requestAnimationFrame(tick);
          else set({ tunaDiving: false, tunaAnimOffsetY: TUNA_FLOAT_OFFSET });
        };
        requestAnimationFrame(tick);
      },

      toggleTunaInfo: () => {
        const { tunaVisible, tunaInfoOpen } = get();
        if (!tunaVisible) return;
        set({ tunaInfoOpen: !tunaInfoOpen });
      },

      showT1LeftOfTrophy: () => {
        const targetX = TROPHY_X - T1_W; // Vị trí đích bên cạnh trophy
        set({
          t1Visible: true,
          t1WorldX: FAR_LEFT_X, // Bắt đầu từ xa bên trái
          t1WorldY: TROPHY_Y,
          trophyVisible: true,
          t1Animation: null,
          t1AppearAnimation: {
            active: true,
            startX: FAR_LEFT_X,
            endX: targetX,
            startY: TROPHY_Y,
            progress: 0,
            startTime: performance.now(),
            duration: 1000, // 1 giây cho animation xuất hiện
          },
        });
      },

      startT1MoveAcrossTrophy: () => {
        const { t1Visible, t1WorldX, trophyVisible } = get();
        if (!t1Visible || !trophyVisible) return;
        const endX = TROPHY_X + TROPHY_W + 2;
        const startX = t1WorldX;
        set({
          t1Animation: {
            active: true,
            startX,
            endX,
            startY: TROPHY_Y,
            progress: 0,
            startTime: performance.now(),
            duration: 800,
          },
          t1AppearAnimation: null, // Clear appear animation
        });
      },

      updateT1Animation: (now: number) => {
        // Xử lý animation xuất hiện
        const { t1AppearAnimation } = get();
        if (t1AppearAnimation && t1AppearAnimation.active) {
          const elapsed = now - t1AppearAnimation.startTime;
          const progress = Math.min(elapsed / t1AppearAnimation.duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          const newX = t1AppearAnimation.startX + (t1AppearAnimation.endX - t1AppearAnimation.startX) * eased;
          set({ t1WorldX: newX, t1AppearAnimation: { ...t1AppearAnimation, progress } });
          
          if (progress >= 1) {
            // Animation kết thúc, đặt chính xác vị trí đích và xóa animation
            set({
              t1WorldX: t1AppearAnimation.endX,
              t1AppearAnimation: null,
            });
          }
          return; // Không xử lý animation di chuyển ngang nếu đang xuất hiện
        }

        // Xử lý animation di chuyển ngang qua trophy
        const { t1Animation } = get();
        if (t1Animation && t1Animation.active) {
          const elapsed = now - t1Animation.startTime;
          const progress = Math.min(elapsed / t1Animation.duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const newX = t1Animation.startX + (t1Animation.endX - t1Animation.startX) * eased;
          set({ t1WorldX: newX, t1Animation: { ...t1Animation, progress } });
          
          if (progress >= 1) {
            set({
              t1Visible: false,
              trophyVisible: false,
              t1Animation: null,
              t1WorldX: DEFAULT_T1_X,
              t1WorldY: DEFAULT_T1_Y,
            });
          }
        }
      },

      resetT1AndTrophy: () => {
        set({
          t1Visible: false,
          t1WorldX: DEFAULT_T1_X,
          t1WorldY: DEFAULT_T1_Y,
          trophyVisible: true,
          t1Animation: null,
          t1AppearAnimation: null,
        });
      },
    }),
    {
      name: "map-storage",
      partialize: (state) => ({
        avocados: state.avocados,
        lastHarvestTime: state.lastHarvestTime,
        unlockedMemories: state.unlockedMemories,
        ytStats: state.ytStats,
        tunaProgress: state.tunaProgress,
      }),
    },
  ),
);

// ─── Selector Helpers ─────────────────────────────────────────

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