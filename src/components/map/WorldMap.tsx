"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useMapStore } from "@/stores/mapStore";
import { useMapDrag } from "@/hooks/useMapDrag";
import { useBuildings } from "@/hooks/useBuildings";
import { renderMap } from "./MapRenderer";
import { screenToWorld } from "@/utils/coords";
import { MIN_ZOOM, MAX_ZOOM } from "@/constants/map";

import HUD from "@/components/ui/HUD";
import InfoModal from "@/components/ui/InfoModal";
import CoordDisplay from "./overplay/CoordDisplay";
import LightSystem from "./overplay/LightSystem";
import { TimeStatus, WeatherType } from "@/hooks/useTimeCycle";
import dynamic from "next/dynamic";
import { Building } from "@/types";

// ─── Spatial Grid ──────────────────────────────────────────────────────────
const CELL_SIZE = 200; // world units per grid cell

interface GridCell {
  ids: string[];
}

function buildSpatialGrid(buildings: Building[]): Map<string, GridCell> {
  const grid = new Map<string, GridCell>();
  for (const b of buildings) {
    if (!b.interactive) continue;
    // A building may span multiple cells
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
): string | null {
  const cx = Math.floor(wx / CELL_SIZE);
  const cy = Math.floor(wy / CELL_SIZE);
  const cell = grid.get(`${cx}:${cy}`);
  if (!cell) return null;
  for (const id of cell.ids) {
    const b = buildingMap.get(id);
    if (b && wx >= b.worldX && wx <= b.worldX + b.width &&
        wy >= b.worldY && wy <= b.worldY + b.height) {
      return id;
    }
  }
  return null;
}
// ───────────────────────────────────────────────────────────────────────────

interface WorldMapProps {
  status: TimeStatus;
  weather: WeatherType;
  manualTime: TimeStatus | null;
  manualWeather: WeatherType | null;
  setManualTime: (val: TimeStatus | null) => void;
  setManualWeather: (val: WeatherType | null) => void;
}

const WorldOverlay = dynamic(() => import("./overplay/WorldOverplay"), {
  ssr: false,
});

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

  // ── Refs để RAF loop đọc giá trị mới nhất mà KHÔNG cần restart ──
  const cameraRef = useRef(useMapStore.getState().camera);
  const statusRef = useRef(status);
  const weatherRef = useRef(weather);
  const hoveredIdRef = useRef<string | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Chỉ dùng state cho những thứ cần trigger re-render UI
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const { setZoom } = useMapStore();
  const { onPointerDown, onPointerMove: onDragMove, onPointerUp } = useMapDrag(canvasRef);
const { buildings, handleClick: handleBuildingClick } = useBuildings();

  // ── Đồng bộ refs với props/state mới nhất ───────────────────────
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);

  // Subscribe trực tiếp vào store để cập nhật cameraRef mà không re-render
  useEffect(() => {
    return useMapStore.subscribe((state) => {
      cameraRef.current = state.camera;
    });
  }, []);

  // ── Spatial index: precompute khi buildings thay đổi ────────────
  const { spatialGrid, buildingMap } = useMemo(() => {
    const buildingMap = new Map(buildings.map((b) => [b.id, b]));
    const spatialGrid = buildSpatialGrid(buildings);
    return { spatialGrid, buildingMap };
  }, [buildings]);

  // ── 1. Hover với O(1) hit-test ──────────────────────────────────
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const world = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
        cameraRef.current,    // dùng ref, không tạo closure mới
        rect.width / 2,
        rect.height / 2,
      );
      const found = hitTest(world.x, world.y, spatialGrid, buildingMap);
      if (found !== hoveredIdRef.current) {
        hoveredIdRef.current = found;
        setHoveredId(found);  // chỉ trigger re-render khi thực sự đổi
      }
    },
    [spatialGrid, buildingMap], // chỉ re-create khi buildings thay đổi
  );

  // ── 2. Resize: chỉ cập nhật canvas size, không liên quan RAF ───
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
      const next = { width, height };
      dimensionsRef.current = next;
      setDimensions(next);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ── 3. RAF loop: khởi động 1 lần duy nhất, đọc qua refs ────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false }); // alpha: false = nhanh hơn
    if (!ctx) return;

    const loop = () => {
      const { width, height } = dimensionsRef.current;
      if (width > 0 && height > 0) {
        renderMap(
          ctx,
          cameraRef.current,
          width,
          height,
          hoveredIdRef.current,
          statusRef.current,
          weatherRef.current,
        );
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []); // deps rỗng = loop chạy mãi mãi, không bao giờ restart

  // ── 4. Wheel zoom ───────────────────────────────────────────────
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

const handleCanvasClick = useCallback(
  (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) handleBuildingClick(e.clientX, e.clientY, cameraRef.current, rect);
  },
  [handleBuildingClick],
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
          camera={cameraRef.current}
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>

      <LightSystem
        camera={cameraRef.current}
        width={dimensions.width}
        height={dimensions.height}
        status={status}
        buildings={buildings}
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