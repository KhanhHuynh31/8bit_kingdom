"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import dynamic from "next/dynamic";

// Stores & Constants
import { selectIsLiveMode, useMapStore } from "@/stores/useMapStore";
import { useMapDrag } from "@/hooks/useMapDrag";
import { MIN_ZOOM, MAX_ZOOM, BUILDINGS } from "@/constants/map";
import { Building } from "@/stores/types";
import { TimeStatus, WeatherType } from "@/hooks/useTimeCycle";

// Utils & Helpers
import { renderMap, TunaRenderState } from "./MapRenderer";
import { screenToWorld } from "@/utils/coords";
import { buildSpatialGrid, hitTest } from "@/utils/spatial-grid";
import { useTunaState } from "@/hooks/useTunaState";
// Components
import HUD from "@/components/ui/HUD";
import InfoModal from "@/components/ui/InfoModal";
import LightSystem from "./overplay/LightSystem";
import FarmOverlay from "../farm/FarmOverlay";
import GachaOverlay from "../gacha/GachaOverPlay";
import InventoryBag from "../inventory/InventoryBag";
import LiveCanvas from "../live/LiveCanvas";

const WorldOverlay = dynamic(() => import("../map/overplay/WorldOverplay"), {
  ssr: false,
});

interface WorldMapProps {
  status: TimeStatus;
  weather: WeatherType;
  manualTime: TimeStatus | null;
  manualWeather: WeatherType | null;
  setManualTime: (val: TimeStatus | null) => void;
  setManualWeather: (val: WeatherType | null) => void;
}

export default function WorldMap({
  status,
  weather,
  manualTime,
  manualWeather,
  setManualTime,
  setManualWeather,
}: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);

  // --- 1. Store State & Actions ---
  const {
    camera,
    setZoom,
    animateTuna,
    sinkTuna,
    toggleTunaInfo,
    selectBuilding,
  } = useMapStore();
  const {
    t1Visible,
    t1WorldX,
    t1WorldY,
    trophyVisible,
    mergedVisible,
    showT1LeftOfTrophy,
    startT1MoveAcrossTrophy,
    updateT1Animation,
  } = useMapStore();

  // --- 2. Local State ---
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [clickedSecondary, setClickedSecondary] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // --- 3. Custom Hooks & Refs ---
  const tunaRefs = useTunaState();
  const cameraRef = useRef(camera);
  const statusRef = useRef(status);
  const weatherRef = useRef(weather);
  const hoveredIdRef = useRef<string | null>(null);

  const {
    onPointerDown,
    onPointerMove: onDragMove,
    onPointerUp,
  } = useMapDrag(canvasRef);

  // Đồng bộ camera/status vào ref để dùng trong RAF loop mà không bị closure cũ
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);
  useEffect(() => {
    statusRef.current = status;
    weatherRef.current = weather;
  }, [status, weather]);

  // --- 4. Logic Xử lý Building ---
  const dynamicBuildings = useMemo((): Building[] => {
    const t1StaticName = BUILDINGS.find((b) => b.id === "t1")?.name ?? "T1";
    return BUILDINGS.map((b) => {
      if (b.id === "t1")
        return {
          ...b,
          worldX: t1WorldX,
          worldY: t1WorldY,
          interactive: t1Visible,
        };
      if (b.id === "trophy") {
        if (mergedVisible)
          return {
            ...b,
            imageSrc: "/assets/decorate/t1_trophy_merged.png",
            name: t1StaticName,
            interactive: true,
            type: "secondary",
          };
        return { ...b, interactive: trophyVisible };
      }
      return b;
    });
  }, [t1Visible, t1WorldX, t1WorldY, trophyVisible, mergedVisible]);

  const spatialData = useMemo(
    () => ({
      grid: buildSpatialGrid(dynamicBuildings),
      buildingMap: new Map(dynamicBuildings.map((b) => [b.id, b])),
    }),
    [dynamicBuildings],
  );

  // --- 5. Event Handlers ---
  const showTempName = useCallback((id: string, name: string) => {
    setClickedSecondary({ id, name });
    setTimeout(() => setClickedSecondary(null), 2000);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      onDragMove(e);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const world = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
        cameraRef.current,
        rect.width / 2,
        rect.height / 2,
      );
      const found = hitTest(
        world.x,
        world.y,
        spatialData.grid,
        spatialData.buildingMap,
        tunaRefs.current.hiddenIds,
      );
      if (found !== hoveredIdRef.current) {
        hoveredIdRef.current = found;
        setHoveredId(found);
      }
    },
    [onDragMove, spatialData, tunaRefs],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const world = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
        cameraRef.current,
        rect.width / 2,
        rect.height / 2,
      );
      const clickedId = hitTest(
        world.x,
        world.y,
        spatialData.grid,
        spatialData.buildingMap,
        tunaRefs.current.hiddenIds,
      );

      if (!clickedId) return;

      if (clickedId === "pool") {
        const { visible, animating, diving } = tunaRefs.current;
        if (visible && !animating && !diving) sinkTuna();
        else if (!visible && !animating && !diving) animateTuna();
        return;
      }
      if (clickedId === "trophy" && !mergedVisible) {
        if (!trophyVisible) return;
        if (!t1Visible) {
          showT1LeftOfTrophy();
        } else {
          startT1MoveAcrossTrophy();
        }
        return;
      }
      if (clickedId === "tuna") return toggleTunaInfo();

      const b = spatialData.buildingMap.get(clickedId);
      if (b?.interactive) {
        if (b.type === "secondary") {
          showTempName(b.id, b.name);
        } else {
          selectBuilding(b);
        }
      }
    },
    [
      spatialData,
      animateTuna,
      sinkTuna,
      toggleTunaInfo,
      showT1LeftOfTrophy,
      startT1MoveAcrossTrophy,
      t1Visible,
      trophyVisible,
      mergedVisible,
      showTempName,
      selectBuilding,
      tunaRefs,
    ],
  );

  // --- 6. Effects (RAF, Resize, Wheel) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const loop = (time: number) => {
      updateT1Animation(time);
      const { width, height } = dimensions;
      if (width > 0 && height > 0) {
        const tunaState: TunaRenderState = {
          visible: tunaRefs.current.visible,
          animating: tunaRefs.current.animating,
          animOffsetY: tunaRefs.current.offsetY,
          diving: tunaRefs.current.diving,
          isEvolved: tunaRefs.current.progress >= 1000,
        };
        renderMap(
          ctx,
          cameraRef.current,
          width,
          height,
          hoveredIdRef.current,
          statusRef.current,
          weatherRef.current,
          tunaState,
          dynamicBuildings,
          clickedSecondary,
        );
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [
    dynamicBuildings,
    dimensions,
    updateT1Animation,
    clickedSecondary,
    tunaRefs,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(
          MIN_ZOOM,
          parseFloat((cameraRef.current.zoom + delta).toFixed(1)),
        ),
      );
      setZoom(newZoom);
    };
    const canvas = canvasRef.current;
    canvas?.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas?.removeEventListener("wheel", onWheel);
  }, [setZoom]);
  // Lấy giá trị isLiveMode từ Store
  const isLiveMode = useMapStore(selectIsLiveMode);

  // Lấy hàm setIsLiveMode từ Store (thông qua selector actions hoặc trực tiếp)
  const setIsLiveMode = useMapStore((s) => s.setIsLiveMode);

  // --- 7. Render ---
  return (
    <div
      ref={containerRef}
      id="world-map-container" // ← THÊM id này
      className="relative w-full h-full overflow-hidden bg-[#05070a]"
      style={{ touchAction: "none" }}
    >
      <div
        className={`absolute inset-0 z-0 transition-all duration-[2000ms] ease-in-out ${status === "night" ? "brightness-[0.6] contrast-[1.1]" : ""}`}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{
            cursor: hoveredId ? "pointer" : "grab",
            imageRendering: "pixelated",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onClick={handleCanvasClick}
        />
        <WorldOverlay
          camera={camera}
          width={dimensions.width}
          height={dimensions.height}
        />
        <FarmOverlay
          camera={camera}
          width={dimensions.width}
          height={dimensions.height}
        />
        <GachaOverlay
          camera={camera}
          width={dimensions.width}
          height={dimensions.height}
        />
        <InventoryBag
          camera={camera}
          width={dimensions.width}
          height={dimensions.height}
        />
        <LiveCanvas onLiveModeChange={setIsLiveMode} />
      </div>
      {!isLiveMode && (
        <LightSystem
          camera={camera}
          width={dimensions.width}
          height={dimensions.height}
          status={status}
          buildings={dynamicBuildings}
        />
      )}
      {!isLiveMode && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <HUD
            currentStatus={status}
            currentWeather={weather}
            manualTime={manualTime}
            manualWeather={manualWeather}
            setManualTime={setManualTime}
            setManualWeather={setManualWeather}
          />
          <InfoModal />
        </div>
      )}
    </div>
  );
}
