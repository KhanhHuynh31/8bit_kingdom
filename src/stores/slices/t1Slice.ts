import { StateCreator } from "zustand";
import { MapState } from "../types";
import {
  DEFAULT_T1_X,
  DEFAULT_T1_Y,
  TROPHY_X,
  TROPHY_Y,
  T1_W,
  FAR_LEFT_X,
} from "../types";

export const createT1Slice: StateCreator<
  MapState,
  [],
  [],
  Partial<MapState>
> = (set, get) => ({
  t1Visible: false,
  t1WorldX: DEFAULT_T1_X,
  t1WorldY: DEFAULT_T1_Y,
  trophyVisible: true,
  t1Animation: null,
  t1AppearAnimation: null,
  mergedVisible: false,

  showT1LeftOfTrophy: () => {
    const targetX = TROPHY_X - T1_W;
    set({
      t1Visible: true,
      t1WorldX: FAR_LEFT_X,
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
        duration: 1000,
      },
    });
  },

  startT1MoveAcrossTrophy: () => {
    const { t1Visible, t1WorldX, trophyVisible } = get();
    if (!t1Visible || !trophyVisible) return;
    set({
      t1Animation: {
        active: true,
        startX: t1WorldX,
        endX: TROPHY_X,
        startY: TROPHY_Y,
        progress: 0,
        startTime: performance.now(),
        duration: 800,
      },
      t1AppearAnimation: null,
    });
  },

  updateT1Animation: (now: number) => {
    const { t1AppearAnimation, t1Animation } = get();

    if (t1AppearAnimation?.active) {
      const progress = Math.min(
        (now - t1AppearAnimation.startTime) / t1AppearAnimation.duration,
        1,
      );
      const eased = 1 - Math.pow(1 - progress, 3);
      const newX =
        t1AppearAnimation.startX +
        (t1AppearAnimation.endX - t1AppearAnimation.startX) * eased;
      set({
        t1WorldX: newX,
        t1AppearAnimation: { ...t1AppearAnimation, progress },
      });
      if (progress >= 1)
        set({ t1WorldX: t1AppearAnimation.endX, t1AppearAnimation: null });
      return;
    }

    if (t1Animation?.active) {
      const progress = Math.min(
        (now - t1Animation.startTime) / t1Animation.duration,
        1,
      );
      const eased = 1 - Math.pow(1 - progress, 3);
      const newX =
        t1Animation.startX + (t1Animation.endX - t1Animation.startX) * eased;
      set({ t1WorldX: newX - 1, t1Animation: { ...t1Animation, progress } });
      if (progress >= 1) {
        set({
          t1Visible: false,
          trophyVisible: true,
          t1Animation: null,
          t1WorldX: DEFAULT_T1_X,
          t1WorldY: DEFAULT_T1_Y,
          mergedVisible: true,
        });
      }
    }
  },

  resetT1AndTrophy: () =>
    set({
      t1Visible: false,
      t1WorldX: DEFAULT_T1_X,
      t1WorldY: DEFAULT_T1_Y,
      trophyVisible: true,
      t1Animation: null,
      t1AppearAnimation: null,
      mergedVisible: false,
    }),
});
