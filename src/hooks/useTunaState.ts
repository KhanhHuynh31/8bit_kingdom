import { useEffect, useRef } from "react";
import { useMapStore } from "@/stores/useMapStore";

export function useTunaState() {
  const tunaRefs = useRef({
    visible: false,
    offsetY: 0,
    animating: false,
    diving: false,
    progress: 0,
    hiddenIds: new Set<string>(),
  });

  useEffect(() => {
    const unsub = useMapStore.subscribe((s) => {
      const hidden = new Set<string>();
      if (!s.tunaVisible || s.tunaDiving) hidden.add("tuna");

      tunaRefs.current = {
        visible: s.tunaVisible,
        offsetY: s.tunaAnimOffsetY,
        animating: s.tunaAnimating,
        diving: s.tunaDiving,
        progress: s.tunaProgress,
        hiddenIds: hidden,
      };
    });
    return unsub;
  }, []);

  return tunaRefs;
}