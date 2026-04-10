import { StateCreator } from "zustand";
import { MapState } from "../types";
import { DEFAULT_YT_STATS } from "../types";  

export const createYoutubeSlice: StateCreator<MapState, [], [], Partial<MapState>> = (set, get) => ({
  ytStats: DEFAULT_YT_STATS,
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
});