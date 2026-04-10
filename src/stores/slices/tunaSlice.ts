import { StateCreator } from "zustand";
import { MapState } from "../types";
import { TUNA_FLOAT_OFFSET, TUNA_ANIM_DURATION } from "../types";

export const createTunaSlice: StateCreator<MapState, [], [], Partial<MapState>> = (set, get) => ({
  tunaVisible: false,
  tunaAnimOffsetY: TUNA_FLOAT_OFFSET,
  tunaAnimating: false,
  tunaDiving: false,
  tunaInfoOpen: false,
  tunaProgress: 0,

  setTunaProgress: (val) => set({ tunaProgress: Math.min(val, 1000) }),
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
});