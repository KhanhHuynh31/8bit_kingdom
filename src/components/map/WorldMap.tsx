"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useMapStore } from "@/stores/mapStore";
import { useMapDrag } from "@/hooks/useMapDrag";
import { renderMap, TunaRenderState } from "./MapRenderer";
import { screenToWorld } from "@/utils/coords";
import { MIN_ZOOM, MAX_ZOOM, BUILDINGS } from "@/constants/map";
import HUD from "@/components/ui/HUD";
import InfoModal from "@/components/ui/InfoModal";
import CoordDisplay from "./overplay/CoordDisplay";
import LightSystem from "./overplay/LightSystem";
import { TimeStatus, WeatherType } from "@/hooks/useTimeCycle";
import dynamic from "next/dynamic";
import { Building } from "@/types";

const CELL_SIZE = 200;

interface GridCell {
  ids: string[];
}

function buildSpatialGrid(buildings: Building[]): Map<string, GridCell> {
  const grid = new Map<string, GridCell>();
  for (const b of buildings) {
    if (!b.interactive) continue;
    const x0 = Math.floor(b.worldX / CELL_SIZE);
    const x1 = Math.floor((b.worldX + b.width) / CELL_SIZE);
    const y0 = Math.floor(b.worldY / CELL_SIZE);
    const y1 = Math.floor((b.worldY + b.height) / CELL_SIZE);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const key = `${cx}:${cy}`;
        if (!grid.has(key)) grid.set(key, { ids: [] });
        grid.get(key)!.ids.push(b.id);
      }
    }
  }
  return grid;
}

function hitTest(
  wx: number,
  wy: number,
  grid: Map<string, GridCell>,
  buildingMap: Map<string, Building>,
  hiddenIds: Set<string>,
): string | null {
  const cx = Math.floor(wx / CELL_SIZE);
  const cy = Math.floor(wy / CELL_SIZE);
  const cell = grid.get(`${cx}:${cy}`);
  if (!cell) return null;
  let best: Building | null = null;
  for (const id of cell.ids) {
    if (hiddenIds.has(id)) continue;
    const b = buildingMap.get(id);
    if (!b) continue;
    if (
      wx >= b.worldX &&
      wx <= b.worldX + b.width &&
      wy >= b.worldY &&
      wy <= b.worldY + b.height
    ) {
      if (!best || (b.zIndex ?? 0) > (best.zIndex ?? 0)) best = b;
    }
  }
  return best?.id ?? null;
}

const WorldOverlay = dynamic(() => import("../map/overplay/WorldOverplay"), { ssr: false });

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

  // Store state & actions
  const camera = useMapStore((s) => s.camera);
  const setZoom = useMapStore((s) => s.setZoom);
  const animateTuna = useMapStore((s) => s.animateTuna);
  const sinkTuna = useMapStore((s) => s.sinkTuna);
  const toggleTunaInfo = useMapStore((s) => s.toggleTunaInfo);
  const showT1LeftOfTrophy = useMapStore((s) => s.showT1LeftOfTrophy);
  const startT1MoveAcrossTrophy = useMapStore((s) => s.startT1MoveAcrossTrophy);
  const updateT1Animation = useMapStore((s) => s.updateT1Animation);
  const t1Visible = useMapStore((s) => s.t1Visible);
  const t1WorldX = useMapStore((s) => s.t1WorldX);
  const t1WorldY = useMapStore((s) => s.t1WorldY);
  const trophyVisible = useMapStore((s) => s.trophyVisible);
  const mergedVisible = useMapStore((s) => s.mergedVisible);

  // State để hiển thị tên tạm thời cho secondary building
  const [clickedSecondary, setClickedSecondary] = useState<{ id: string; name: string } | null>(null);

  const showTempName = useCallback((id: string, name: string) => {
    setClickedSecondary({ id, name });
    setTimeout(() => setClickedSecondary(null), 2000);
  }, []);

  // Refs cho RAF loop
  const cameraRef = useRef(camera);
  const statusRef = useRef(status);
  const weatherRef = useRef(weather);
  const hoveredIdRef = useRef<string | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Tuna state refs
  const tunaVisibleRef = useRef(false);
  const tunaAnimOffsetYRef = useRef(0);
  const tunaAnimatingRef = useRef(false);
  const tunaDivingRef = useRef(false);
  const tunaProgressRef = useRef(0);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const { onPointerDown, onPointerMove: onDragMove, onPointerUp } = useMapDrag(canvasRef);

  // Đồng bộ refs
  useEffect(() => { cameraRef.current = camera; }, [camera]);
  useEffect(() => {
    statusRef.current = status;
    weatherRef.current = weather;
  }, [status, weather]);

  // Subscribe tuna state
  useEffect(() => {
    const unsubVisible  = useMapStore.subscribe((s) => { tunaVisibleRef.current     = s.tunaVisible; });
    const unsubOffset   = useMapStore.subscribe((s) => { tunaAnimOffsetYRef.current  = s.tunaAnimOffsetY; });
    const unsubAnim     = useMapStore.subscribe((s) => { tunaAnimatingRef.current    = s.tunaAnimating; });
    const unsubDiving   = useMapStore.subscribe((s) => { tunaDivingRef.current       = s.tunaDiving; });
    const unsubProgress = useMapStore.subscribe((s) => { tunaProgressRef.current     = s.tunaProgress; });
    return () => { unsubVisible(); unsubOffset(); unsubAnim(); unsubDiving(); unsubProgress(); };
  }, []);

  // Tạo danh sách buildings động:
  // - t1: theo t1Visible/t1WorldX/t1WorldY
  // - trophy: khi mergedVisible → đổi imageSrc thành ảnh merged, đổi name thành T1,
  //           giữ interactive:true để hover/click hoạt động bình thường
  //           khi trophyVisible false (đang animate) → ẩn đi
  const dynamicBuildings = useMemo((): Building[] => {
    // Lấy tên T1 từ BUILDINGS gốc
    const t1StaticName = BUILDINGS.find((b) => b.id === "t1")?.name ?? "T1";

    return BUILDINGS.map((b) => {
      if (b.id === "t1") {
        return {
          ...b,
          worldX: t1WorldX,
          worldY: t1WorldY,
          interactive: t1Visible,
        };
      }

      if (b.id === "trophy") {
        if (mergedVisible) {
          // Trophy trở thành ảnh merged, tên hiển thị là tên T1
          return {
            ...b,
            imageSrc: "/assets/decorate/t1_trophy_merged.png",
            name: t1StaticName,
            interactive: true,
            // Giữ nguyên type "secondary" để showTempName khi click
            type: "secondary",
          };
        }
        return {
          ...b,
          interactive: trophyVisible,
        };
      }

      return b;
    });
  }, [t1Visible, t1WorldX, t1WorldY, trophyVisible, mergedVisible]);

  // Spatial index từ dynamicBuildings
  const { spatialGrid, buildingMap } = useMemo(() => {
    const buildingMap = new Map(dynamicBuildings.map((b) => [b.id, b]));
    const spatialGrid = buildSpatialGrid(dynamicBuildings);
    return { spatialGrid, buildingMap };
  }, [dynamicBuildings]);

  // hiddenIds (tuna)
  const hiddenIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    return useMapStore.subscribe((state) => {
      const next = new Set<string>();
      if (!state.tunaVisible || state.tunaDiving) next.add("tuna");
      hiddenIdsRef.current = next;
    });
  }, []);

  // Hover hit-test
  const onMouseMove = useCallback(
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
      const found = hitTest(world.x, world.y, spatialGrid, buildingMap, hiddenIdsRef.current);
      if (found !== hoveredIdRef.current) {
        hoveredIdRef.current = found;
        setHoveredId(found);
      }
    },
    [spatialGrid, buildingMap],
  );

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = width; canvas.height = height; }
      dimensionsRef.current = { width, height };
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const loop = () => {
      const now = performance.now();
      updateT1Animation(now);

      const { width, height } = dimensionsRef.current;
      if (width > 0 && height > 0) {
        const isEvolved = tunaProgressRef.current >= 1000;
        const tunaState: TunaRenderState = {
          visible: tunaVisibleRef.current,
          animating: tunaAnimatingRef.current,
          animOffsetY: tunaAnimOffsetYRef.current,
          diving: tunaDivingRef.current,
          isEvolved,
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
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [dynamicBuildings, updateT1Animation, clickedSecondary]);

  // Wheel zoom
  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, parseFloat((cameraRef.current.zoom + delta).toFixed(1))),
      );
      setZoom(newZoom);
    },
    [setZoom],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      onDragMove(e);
      onMouseMove(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    },
    [onDragMove, onMouseMove],
  );

  // Click handler
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
      const clickedId = hitTest(world.x, world.y, spatialGrid, buildingMap, hiddenIdsRef.current);
      if (!clickedId) return;

      if (clickedId === "pool") {
        const { tunaVisible, tunaAnimating, tunaDiving } = useMapStore.getState();
        if (tunaVisible && !tunaAnimating && !tunaDiving) sinkTuna();
        else if (!tunaVisible && !tunaAnimating && !tunaDiving) animateTuna();
        return;
      }

      if (clickedId === "trophy") {
        // Khi mergedVisible, trophy đã đổi thành secondary → xử lý showTempName bên dưới
        // Khi chưa merged → xử lý animation T1
        if (!mergedVisible) {
          if (!trophyVisible) return;
          if (!t1Visible) {
            showT1LeftOfTrophy();
          } else {
            startT1MoveAcrossTrophy();
          }
          return;
        }
      }

      if (clickedId === "tuna") {
        toggleTunaInfo();
        return;
      }

      // Tất cả building còn lại (bao gồm trophy khi mergedVisible vì type="secondary")
      const building = buildingMap.get(clickedId);
      if (building && building.interactive) {
        if (building.type === "secondary") {
          showTempName(building.id, building.name);
        } else {
          useMapStore.getState().selectBuilding(building);
        }
      }
    },
    [
      spatialGrid, buildingMap,
      animateTuna, sinkTuna, toggleTunaInfo,
      showT1LeftOfTrophy, startT1MoveAcrossTrophy,
      t1Visible, trophyVisible, mergedVisible,
      showTempName,
    ],
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#05070a]"
      style={{ touchAction: "none" }}
    >
      <div
        className={`absolute inset-0 z-0 transition-all duration-[2000ms] ease-in-out ${
          status === "night" ? "brightness-[0.6] contrast-[1.1]" : ""
        }`}
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
      </div>

      <LightSystem
        camera={camera}
        width={dimensions.width}
        height={dimensions.height}
        status={status}
        buildings={dynamicBuildings}
      />

      <div className="absolute inset-0 z-50 pointer-events-none">
        <HUD
          currentStatus={status}
          currentWeather={weather}
          manualTime={manualTime}
          manualWeather={manualWeather}
          setManualTime={setManualTime}
          setManualWeather={setManualWeather}
        />
        <CoordDisplay />
        <InfoModal />
      </div>
    </div>
  );
}