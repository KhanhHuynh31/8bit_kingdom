"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useMapStore } from "@/stores/mapStore";
import { useMapDrag } from "@/hooks/useMapDrag";
import { useBuildings } from "@/hooks/useBuildings";
import { renderMap, TunaRenderState } from "./MapRenderer";
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

// ── hitTest: trả về building có zIndex cao nhất tại điểm click ─────────────
// Hỗ trợ nhiều vật thể chồng nhau — vật thể z cao hơn luôn được ưu tiên.
// hiddenIds: tập ID các building hiện đang bị ẩn (không thể click).
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
    // Bỏ qua building đang ẩn
    if (hiddenIds.has(id)) continue;

    const b = buildingMap.get(id);
    if (!b) continue;

    if (
      wx >= b.worldX &&
      wx <= b.worldX + b.width &&
      wy >= b.worldY &&
      wy <= b.worldY + b.height
    ) {
      // Chọn building có zIndex cao nhất (mặc định 0 nếu không có)
      if (!best || (b.zIndex ?? 0) > (best.zIndex ?? 0)) {
        best = b;
      }
    }
  }

  return best?.id ?? null;
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

  // Tuna state refs — đọc bởi RAF loop không qua re-render
  const tunaVisibleRef = useRef(false);
  const tunaAnimOffsetYRef = useRef(0);
  const tunaAnimatingRef = useRef(false);
  const tunaDivingRef = useRef(false);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const setZoom = useMapStore((s) => s.setZoom);
  const animateTuna = useMapStore((s) => s.animateTuna);
  const sinkTuna = useMapStore((s) => s.sinkTuna);
  const toggleTunaInfo = useMapStore((s) => s.toggleTunaInfo);

  const {
    onPointerDown,
    onPointerMove: onDragMove,
    onPointerUp,
  } = useMapDrag(canvasRef);
  const { buildings, handleClick: handleBuildingClick } = useBuildings();

  // ── Đồng bộ refs với props ───────────────────────────────────────
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  // Subscribe camera — không re-render
  useEffect(() => {
    return useMapStore.subscribe((state) => {
      cameraRef.current = state.camera;
    });
  }, []);

  // Subscribe tuna state — cập nhật refs để RAF loop đọc
  useEffect(() => {
    return useMapStore.subscribe((state) => {
      tunaVisibleRef.current = state.tunaVisible;
      tunaAnimOffsetYRef.current = state.tunaAnimOffsetY;
      tunaAnimatingRef.current = state.tunaAnimating;
      tunaDivingRef.current = state.tunaDiving;
    });
  }, []);

  // ── Spatial index ────────────────────────────────────────────────
  const { spatialGrid, buildingMap } = useMemo(() => {
    const buildingMap = new Map(buildings.map((b) => [b.id, b]));
    const spatialGrid = buildSpatialGrid(buildings);
    return { spatialGrid, buildingMap };
  }, [buildings]);

  // ── hiddenIds ref: hitTest đọc qua ref, không trigger re-render ──
  // Khởi tạo đồng bộ từ getState() tránh snapshot loop
  // Replace lines 165-168 with this:
  const hiddenIdsRef = useRef<Set<string>>(
    (() => {
      const s = useMapStore.getState();
      return !s.tunaVisible || s.tunaDiving
        ? new Set(["tuna"])
        : new Set<string>();
    })(), // Notice the () here to execute the function immediately
  );
  useEffect(() => {
    return useMapStore.subscribe((state) => {
      const next = new Set<string>();
      // Ẩn khỏi hitTest khi chưa visible (kể cả lúc đang trồi lên)
      // Chỉ cho phép click tuna sau khi animation trồi lên xong hoàn toàn
      // Khi đang lặn (diving) thì cũng không cho click
      if (!state.tunaVisible || state.tunaDiving) next.add("tuna");
      hiddenIdsRef.current = next;
    });
  }, []);

  // ── Hover với O(1) hit-test ──────────────────────────────────────
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
      const found = hitTest(
        world.x,
        world.y,
        spatialGrid,
        buildingMap,
        hiddenIdsRef.current,
      );
      if (found !== hoveredIdRef.current) {
        hoveredIdRef.current = found;
        setHoveredId(found);
      }
    },
    [spatialGrid, buildingMap],
  );

  // ── Resize ──────────────────────────────────────────────────────
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

  // ── RAF loop ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const loop = () => {
      const { width, height } = dimensionsRef.current;
      if (width > 0 && height > 0) {
        // Đọc tuna state từ refs — không cần re-render WorldMap
        const tunaState: TunaRenderState = {
          visible: tunaVisibleRef.current,
          animating: tunaAnimatingRef.current,
          animOffsetY: tunaAnimOffsetYRef.current,
          diving: tunaDivingRef.current,
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
        );
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Wheel zoom ──────────────────────────────────────────────────
  const onWheel = useCallback(
    (e: WheelEvent) => {
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

  // ── Click handler: pool → animateTuna, các building khác → handleBuildingClick
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

      // Tìm building được click (tôn trọng z-order và hidden)
      const clickedId = hitTest(
        world.x,
        world.y,
        spatialGrid,
        buildingMap,
        hiddenIdsRef.current,
      );

      if (clickedId === "pool") {
        // Toggle tuna: nếu visible → lặn xuống, nếu ẩn → trồi lên
        const { tunaVisible, tunaAnimating, tunaDiving } =
          useMapStore.getState();
        if (tunaVisible && !tunaAnimating && !tunaDiving) {
          sinkTuna();
        } else if (!tunaVisible && !tunaAnimating && !tunaDiving) {
          animateTuna();
        }
        // Không gọi handleBuildingClick pool để tránh mở modal
        return;
      }

      if (clickedId === "tuna") {
        // Click tuna → toggle hiển thị description
        toggleTunaInfo();
        return;
      }

      handleBuildingClick(e.clientX, e.clientY, cameraRef.current, rect);
    },
    [
      handleBuildingClick,
      spatialGrid,
      buildingMap,
      animateTuna,
      sinkTuna,
      toggleTunaInfo,
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
