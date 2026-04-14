"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import Image from "next/image";
import { useMapStore } from "@/stores/useMapStore";
import { worldToScreen } from "@/utils/coords";
import { TILE_SIZE } from "@/constants/map";
import {
  FarmPlot,
  PlotStatus,
  computeFarmDimensions,
} from "@/stores/slices/farmSlice";
import { Camera } from "@/stores/types";
import { Sprout, Droplets, Wheat, X } from "lucide-react";

// ─── Ảnh cây theo 3 giai đoạn ────────────────────────────────────────────────
// Đặt ảnh vào /public/assets/farm/
const PLANT_IMAGES: Record<"seeded" | "watered" | "ready", string> = {
  seeded: "/assets/farm/avocado_seeded.png",
  watered: "/assets/farm/avocado_growing.png",
  ready: "/assets/farm/avocado_ready.png",
};

// ─── Màu ô đất ───────────────────────────────────────────────────────────────
const PLOT_BG: Record<PlotStatus, string> = {
  empty: "rgba(38,24,10,0.82)",
  seeded: "rgba(22,36,16,0.88)",
  watered: "rgba(16,32,48,0.88)",
  ready: "rgba(14,36,14,0.92)",
};
const PLOT_BORDER: Record<PlotStatus, string> = {
  empty: "rgba(90,58,24,0.55)",
  seeded: "rgba(72,108,56,0.65)",
  watered: "rgba(48,120,180,0.75)",
  ready: "rgba(56,200,80,0.9)",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type RainRect = { x: number; y: number; w: number; h: number };

interface Raindrop {
  x: number;
  y: number;
  speed: number;
  len: number;
  alpha: number;
}

// ─── Rain Canvas hook ─────────────────────────────────────────────────────────

function useRainCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  activeRects: RainRect[],
) {
  const dropsRef = useRef<Raindrop[]>([]);
  const rafRef = useRef<number>(0);
  const rectsRef = useRef<RainRect[]>([]);

  // Sync mutable ref để RAF loop luôn đọc giá trị mới nhất
  useEffect(() => {
    rectsRef.current = activeRects;
  }, [activeRects]);

  const isActive = activeRects.length > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isActive) {
      cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Tạo giọt mưa mới cho mỗi ô
    dropsRef.current = [];
    activeRects.forEach((r) => {
      for (let i = 0; i < 60; i++) {
        dropsRef.current.push({
          x: r.x + Math.random() * r.w,
          y: r.y - Math.random() * r.h,
          speed: 4 + Math.random() * 5,
          len: 8 + Math.random() * 10,
          alpha: 0.4 + Math.random() * 0.5,
        });
      }
    });

    const draw = () => {
      const rects = rectsRef.current;
      if (rects.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rects.forEach((r) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();

        ctx.fillStyle = "rgba(20,80,180,0.10)";
        ctx.fillRect(r.x, r.y, r.w, r.h);

        dropsRef.current
          .filter((d) => d.x >= r.x && d.x <= r.x + r.w)
          .forEach((drop) => {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x - 1.2, drop.y + drop.len);
            ctx.strokeStyle = `rgba(130,200,255,${drop.alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            drop.y += drop.speed;
            if (drop.y > r.y + r.h) {
              drop.y = r.y - Math.random() * 20;
              drop.x = r.x + Math.random() * r.w;
            }
          });
        ctx.restore();
      });
      rafRef.current = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, canvasRef]);
}

// ─── PlotCell ─────────────────────────────────────────────────────────────────

function PlotCell({
  plot,
  cellW,
  cellH,
  selected,
  onClick,
}: {
  plot: FarmPlot;
  cellW: number;
  cellH: number;
  selected: boolean;
  onClick: () => void;
}) {
  const imgSrc =
    plot.status === "empty"
      ? null
      : plot.status === "seeded"
        ? PLANT_IMAGES.seeded
        : plot.status === "watered"
          ? PLANT_IMAGES.watered
          : PLANT_IMAGES.ready;

  const isReady = plot.status === "ready";

  return (
    <div
      onClick={onClick}
      style={{
        width: cellW,
        height: cellH,
        background: PLOT_BG[plot.status],
        border: `1.5px solid ${selected ? "#60a5fa" : PLOT_BORDER[plot.status]}`,
        borderRadius: 5,
        boxShadow: selected
          ? "0 0 0 2px rgba(96,165,250,0.4)"
          : isReady
            ? "0 0 14px rgba(56,200,80,0.4)"
            : "none",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Ảnh cây */}
      {imgSrc && (
        <Image
          priority
          src={imgSrc}
          alt=""
          draggable={false}
          fill
          style={{
            position: "absolute",
            bottom: Math.round(cellH * 0.07),
            left: "50%",
            transform: "translateX(-50%)",
            animation: isReady ? "farmPulse 1.8s ease-in-out infinite" : "none",
          }}
        />
      )}

      {/* Progress bar (chỉ khi đang lớn) */}
      {plot.status === "watered" && (
        <div
          style={{
            position: "absolute",
            bottom: 3,
            left: 5,
            right: 5,
            height: 3,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${plot.progress}%`,
              background: "#34d399",
              borderRadius: 2,
              transition: "width 0.5s linear",
            }}
          />
        </div>
      )}

      {/* Badge ✓ khi ready */}
      {isReady && (
        <div
          style={{
            position: "absolute",
            top: 4,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(20,80,20,0.9)",
            border: "1px solid rgba(80,220,80,0.6)",
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: Math.max(8, Math.round(cellW * 0.11)),
            color: "#6ee7b7",
            fontWeight: 700,
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          ✓
        </div>
      )}
    </div>
  );
}

// ─── Popup hành động ──────────────────────────────────────────────────────────

function PlotPopup({
  plot,
  screenX,
  screenY,
  cellW,
  onSeed,
  onWater,
  onHarvest,
  onClose,
}: {
  plot: FarmPlot;
  screenX: number;
  screenY: number;
  cellW: number;
  onSeed: () => void;
  onWater: () => void;
  onHarvest: () => void;
  onClose: () => void;
}) {
  const POPUP_W = 170;

  const label: Record<PlotStatus, string> = {
    empty: "Đất trống",
    seeded: "Cây con 🌱",
    watered: `Đang lớn… ${plot.progress}%`,
    ready: "Sẵn thu hoạch! 🥑",
  };
  const labelColor: Record<PlotStatus, string> = {
    empty: "#9ca3af",
    seeded: "#86efac",
    watered: "#60a5fa",
    ready: "#fbbf24",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: screenX + cellW / 2 - POPUP_W / 2,
        top: screenY - 10,
        width: POPUP_W,
        transform: "translateY(-100%)",
        background: "rgba(8,14,8,0.97)",
        border: "1px solid rgba(80,140,60,0.5)",
        borderRadius: 10,
        padding: "10px 10px 8px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
        pointerEvents: "auto",
        zIndex: 300,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: labelColor[plot.status],
          }}
        >
          {label[plot.status]}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6b7280",
            display: "flex",
            padding: 0,
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Progress bar khi đang lớn */}
      {plot.status === "watered" && (
        <div
          style={{
            marginBottom: 8,
            height: 3,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${plot.progress}%`,
              background: "#34d399",
              borderRadius: 2,
              transition: "width 0.4s linear",
            }}
          />
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {plot.status === "empty" && (
          <Btn color="green" onClick={onSeed}>
            <Sprout size={12} /> Trồng cây bơ
          </Btn>
        )}
        {plot.status === "seeded" && (
          <Btn color="blue" onClick={onWater}>
            <Droplets size={12} /> Tưới nước
          </Btn>
        )}
        {plot.status === "ready" && (
          <Btn color="amber" onClick={onHarvest}>
            <Wheat size={12} /> Thu hoạch
          </Btn>
        )}
      </div>

      {/* Arrow xuống */}
      <div
        style={{
          position: "absolute",
          bottom: -6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid rgba(80,140,60,0.5)",
        }}
      />
    </div>
  );
}

function Btn({
  color,
  onClick,
  children,
}: {
  color: "green" | "blue" | "amber";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const s = {
    green: {
      bg: "rgba(16,50,16,0.8)",
      border: "rgba(60,180,60,0.55)",
      fg: "#86efac",
    },
    blue: {
      bg: "rgba(14,36,70,0.8)",
      border: "rgba(60,120,220,0.55)",
      fg: "#93c5fd",
    },
    amber: {
      bg: "rgba(50,36,8,0.8)",
      border: "rgba(200,150,30,0.55)",
      fg: "#fbbf24",
    },
  }[color];
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "6px 8px",
        borderRadius: 6,
        width: "100%",
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ─── Toast hook ───────────────────────────────────────────────────────────────

function useToast() {
  const t = useRef<ReturnType<typeof setTimeout>>(
    undefined as unknown as ReturnType<typeof setTimeout>,
  );
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((text: string) => {
    setMsg(text);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 2200);
  }, []);
  return { msg, show };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface FarmOverlayProps {
  camera: Camera;
  width: number;
  height: number;
}

export default function FarmOverlay({
  camera,
  width,
  height,
}: FarmOverlayProps) {
  const { farmPlots, seedPlot, waterPlot, harvestPlot, tickFarmProgress } =
    useMapStore();

  const rainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRafRef = useRef<number>(0);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const { msg: toast, show: showToast } = useToast();

  const dims = useMemo(() => computeFarmDimensions(), []);

  // ── Tick grow progress (mỗi 500ms) ───────────────────────────────────────
  useEffect(() => {
    let last = 0;
    const tick = (ts: number) => {
      if (ts - last > 500) {
        tickFarmProgress(Date.now());
        last = ts;
      }
      progressRafRef.current = requestAnimationFrame(tick);
    };
    progressRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progressRafRef.current);
  }, [tickFarmProgress]);

  // ── Coordinate math ───────────────────────────────────────────────────────
  const cX = width / 2;
  const cY = height / 2;
  const scaledTile = TILE_SIZE * camera.zoom;

  const { x: bScreenX, y: bScreenY } = worldToScreen(
    dims.originX,
    dims.originY,
    camera,
    cX,
    cY,
  );
  const bScreenW = dims.buildingWidth * scaledTile;
  const bScreenH = dims.buildingHeight * scaledTile;

  // Mỗi ô = 2×2 tiles
  const GAP = Math.max(2, Math.round(scaledTile * 0.06));
  const cellW = 2 * scaledTile - GAP;
  const cellH = 2 * scaledTile - GAP;

  // Grid căn giữa trong building
  const gridW = dims.cols * cellW + (dims.cols - 1) * GAP;
  const gridH = dims.rows * cellH + (dims.rows - 1) * GAP;
  const gridOX = (bScreenW - gridW) / 2;
  const gridOY = (bScreenH - gridH) / 2;

  // ── Rain rects (tick mỗi 200ms để wateringUntil expire đúng lúc) ─────────
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const rainRects = useMemo<RainRect[]>(() => {
    return farmPlots
      .filter((p) => p.wateringUntil != null && p.wateringUntil > nowTick)
      .map((p) => ({
        x: bScreenX + gridOX + p.col * (cellW + GAP),
        y: bScreenY + gridOY + p.row * (cellH + GAP),
        w: cellW,
        h: cellH,
      }));
  }, [
    farmPlots,
    nowTick,
    bScreenX,
    bScreenY,
    gridOX,
    gridOY,
    cellW,
    cellH,
    GAP,
  ]);

  useRainCanvas(rainCanvasRef, rainRects);

  // Sync canvas dimensions
  useEffect(() => {
    const c = rainCanvasRef.current;
    if (!c) return;
    c.width = width;
    c.height = height;
  }, [width, height]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePlotClick = useCallback((id: number) => {
    setSelectedPlotId((prev) => (prev === id ? null : id));
  }, []);

  const doSeed = useCallback(
    (id: number) => {
      seedPlot(id);
      showToast("🌱 Đã trồng cây bơ!");
      setSelectedPlotId(null);
    },
    [seedPlot, showToast],
  );

  const doWater = useCallback(
    (id: number) => {
      waterPlot(id);
      showToast("💧 Đang tưới nước…");
      setSelectedPlotId(null);
    },
    [waterPlot, showToast],
  );

  const doHarvest = useCallback(
    (id: number) => {
      harvestPlot(id);
      showToast("+2000🥑");
      setSelectedPlotId(null);
    },
    [harvestPlot, showToast],
  );

  const plotPos = useCallback(
    (p: FarmPlot) => ({
      x: bScreenX + gridOX + p.col * (cellW + GAP),
      y: bScreenY + gridOY + p.row * (cellH + GAP),
    }),
    [bScreenX, bScreenY, gridOX, gridOY, cellW, cellH, GAP],
  );

  if (width === 0 || height === 0) return null;

  return (
    <>
      <style>{`
        @keyframes farmPulse {
          0%,100% { transform: translateX(-50%) scale(1); }
          50%      { transform: translateX(-50%) scale(1.07); }
        }
      `}</style>

      {/* Rain canvas */}
      <canvas
        ref={rainCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 160,
        }}
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 select-none"
        style={{ zIndex: 155, pointerEvents: "none" }}
      >
        {/* ── Farm grid — LUÔN HIỆN ── */}
        <div
          style={{
            position: "absolute",
            left: bScreenX + gridOX,
            top: bScreenY + gridOY,
            display: "grid",
            gridTemplateColumns: `repeat(${dims.cols}, ${cellW}px)`,
            gridTemplateRows: `repeat(${dims.rows}, ${cellH}px)`,
            gap: GAP,
            pointerEvents: "auto",
          }}
        >
          {farmPlots.map((plot) => (
            <PlotCell
              key={plot.id}
              plot={plot}
              cellW={cellW}
              cellH={cellH}
              selected={selectedPlotId === plot.id}
              onClick={() => handlePlotClick(plot.id)}
            />
          ))}
        </div>

        {/* ── Popup hành động ── */}
        {selectedPlotId !== null &&
          (() => {
            const plot = farmPlots[selectedPlotId];
            if (!plot) return null;
            const pos = plotPos(plot);
            return (
              <PlotPopup
                plot={plot}
                screenX={pos.x}
                screenY={pos.y}
                cellW={cellW}
                onSeed={() => doSeed(plot.id)}
                onWater={() => doWater(plot.id)}
                onHarvest={() => doHarvest(plot.id)}
                onClose={() => setSelectedPlotId(null)}
              />
            );
          })()}

        {/* ── Toast ── */}
        {toast && (
          <div
            style={{
              position: "absolute",
              left: bScreenX + bScreenW / 2,
              top: Math.max(8, bScreenY - 70),
              transform: "translateX(-50%)",
              background: "rgba(6,16,6,0.97)",
              border: "1px solid rgba(72,180,60,0.55)",
              borderRadius: 8,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 600,
              color: "#d1fae5",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
              zIndex: 400,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
