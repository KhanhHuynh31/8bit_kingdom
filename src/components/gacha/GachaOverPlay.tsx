"use client";

import {
  useEffect, useRef, useCallback, useState, useMemo,
} from "react";
import Image from "next/image";
import { useMapStore } from "@/stores/useMapStore";
import {
  GachaResult, DecoBuilding,
  RARITY_COLOR, RARITY_GLOW, RARITY_LABEL,
  STAR_ANIM_COLOR, StarAnimRarity,
  GACHA_COST, GACHA_COST_10,
  batchStarColor,
} from "@/constants/decorationData";
import { Camera } from "@/stores/types";
import { BUILDINGS, TILE_SIZE } from "@/constants/map";
import { worldToScreen } from "@/utils/coords";
import { X } from "lucide-react";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:    "rgba(8,10,14,0.96)",
  line:  "rgba(255,255,255,0.07)",
  amber: "#c8973a",
  text:  "#d8cdb8",
  muted: "#5a5040",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Star {
  startX: number;
  startY: number;
  /** World-space gate centre — converted live each frame */
  gateWorldX: number;
  gateWorldY: number;
  /** Per-star random offset so stars spread around centre */
  offsetX: number;
  offsetY: number;
  progress: number;
  speed: number;
  size: number;
  colorKey: StarAnimRarity;
  trail: { x: number; y: number; alpha: number }[];
  done: boolean;
}

// ─── Canvas star hook ─────────────────────────────────────────────────────────

function rgb(k: StarAnimRarity) {
  return k === 5 ? "245,200,66" : k === 4 ? "196,127,255" : "91,174,255";
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number, color: string,
) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size * 0.42;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) {
      ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    } else {
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
  }
  ctx.closePath();
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = size * 2.5;
  ctx.fill(); ctx.shadowBlur = 0;
}

/**
 * FIX: Mỗi frame RAF đọc camera từ cameraRef (luôn mới nhất),
 * tính lại tọa độ screen của cổng từ world-space.
 * → Kéo map không làm sao lệch mục tiêu.
 */
function useStarCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  stars: Star[],
  cameraRef: React.RefObject<Camera>,
  containerW: number,
  containerH: number,
  onDone: () => void,
) {
  const rafRef    = useRef<number>(0);
  const starsRef  = useRef<Star[]>([]);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!stars.length) return;
    starsRef.current = stars.map((s) => ({ ...s, trail: [] }));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let called = false;
    const cX = containerW / 2;
    const cY = containerH / 2;

    const draw = () => {
      const cam = cameraRef.current;
      if (!cam) { rafRef.current = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;

      starsRef.current.forEach((s) => {
        if (s.done) return;
        allDone = false;

        s.progress = Math.min(1, s.progress + s.speed);
        const ease = s.progress * s.progress;

        // Recompute target from world-space every frame
        const gate = worldToScreen(s.gateWorldX, s.gateWorldY, cam, cX, cY);
        const tx   = gate.x + s.offsetX;
        const ty   = gate.y + s.offsetY;

        const px = s.startX + (tx - s.startX) * ease;
        const py = s.startY + (ty - s.startY) * ease;

        const col    = STAR_ANIM_COLOR[s.colorKey];
        const rgbStr = rgb(s.colorKey);

        // Trail
        s.trail.push({ x: px, y: py, alpha: 0.88 });
        if (s.trail.length > 18) s.trail.shift();
        s.trail.forEach((p, i) => {
          const f = i / s.trail.length;
          ctx.beginPath();
          ctx.arc(p.x, p.y, s.size * 0.27 * f, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgbStr},${p.alpha * f * 0.55})`;
          ctx.fill();
          p.alpha *= 0.86;
        });

        // Halo
        const grd = ctx.createRadialGradient(px, py, 0, px, py, s.size * 2.8);
        grd.addColorStop(0, `rgba(${rgbStr},.82)`);
        grd.addColorStop(1, `rgba(${rgbStr},0)`);
        ctx.beginPath(); ctx.arc(px, py, s.size * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        // Core star
        drawStarShape(ctx, px, py, s.size, col);

        // Burst rays near end
        if (s.progress > 0.82) {
          const t = (s.progress - 0.82) / 0.18;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + Math.cos(a) * s.size * 4.5 * t, py + Math.sin(a) * s.size * 4.5 * t);
            ctx.strokeStyle = col; ctx.globalAlpha = 0.4; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        if (s.progress >= 1) s.done = true;
      });

      if (allDone && !called) {
        called = true;
        const cam2 = cameraRef.current;
        if (cam2 && starsRef.current[0]) {
          const f  = starsRef.current[0];
          const gs = worldToScreen(f.gateWorldX, f.gateWorldY, cam2, cX, cY);
          const g  = ctx.createRadialGradient(gs.x, gs.y, 0, gs.x, gs.y, 160);
          g.addColorStop(0, `rgba(${rgb(f.colorKey)},.65)`);
          g.addColorStop(1, `rgba(${rgb(f.colorKey)},0)`);
          ctx.beginPath(); ctx.arc(gs.x, gs.y, 160, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
        }
        setTimeout(() => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          onDoneRef.current();
        }, 420);
        return;
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars.length]);
}

// ─── Ultra-minimal pull popup ─────────────────────────────────────────────────

function PullPopup({
  cx, cy, avocados, onPull1, onPull10,
}: {
  cx: number; cy: number; avocados: number;
  onPull1: () => void; onPull10: () => void; onClose: () => void;
}) {
  return (
    <div style={{
      position: "absolute",
      left: cx, top: cy - 10,
      transform: "translate(-50%, -100%)",
      pointerEvents: "auto", zIndex: 200,
    }}>
      <div style={{
        background: C.bg, border: `1px solid ${C.line}`,
        borderRadius: 8, padding: 6,
        display: "flex", flexDirection: "column", gap: 4,
        minWidth: 190,
        boxShadow: "0 8px 32px rgba(0,0,0,.75)",
      }}>
        <PullRow label="×1"  cost={GACHA_COST}    canAfford={avocados >= GACHA_COST}    onClick={onPull1} primary />
        <div style={{ height: 1, background: C.line }} />
        <PullRow label="×10" cost={GACHA_COST_10} canAfford={avocados >= GACHA_COST_10} onClick={onPull10} />
      </div>
      {/* Caret */}
      <div style={{
        width: 0, height: 0, margin: "0 auto",
        borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
        borderTop: `6px solid ${C.line}`,
      }} />
    </div>
  );
}

function PullRow({
  label, cost, canAfford, onClick, primary = false,
}: {
  label: string; cost: number; canAfford: boolean; onClick: () => void; primary?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={!canAfford} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "7px 10px", borderRadius: 5, border: "none",
      background: canAfford && primary ? "rgba(200,151,58,0.12)" : "transparent",
      cursor: canAfford ? "pointer" : "not-allowed", gap: 24, width: "100%",
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: canAfford ? (primary ? C.amber : C.text) : C.muted, letterSpacing: ".04em" }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: canAfford ? C.amber : C.muted }}>
        {cost.toLocaleString()} 🥑
      </span>
    </button>
  );
}

// ─── Minimal result panel (position: fixed — không bị ảnh hưởng bởi camera) ──

function ResultPanel({
  results, avocados, onPull1, onPull10, onClose,
}: {
  results: GachaResult[];
  screenH: number;
  avocados: number;
  onPull1: () => void; onPull10: () => void; onClose: () => void;
}) {
  const is10   = results.length >= 10;
  const panelW = is10
    ? Math.min(660, (typeof window !== "undefined" ? window.innerWidth : 660) - 32)
    : 270;

  return (
    <div style={{
      position: "fixed",
      left: "50%", top: "50%",
      transform: "translate(-50%, -50%)",
      width: panelW,
      pointerEvents: "auto", zIndex: 500,
      animation: "rIn .22s both",
    }}>
      <div style={{
        background: C.bg, border: `1px solid ${C.line}`,
        borderRadius: 10, overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,.88)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 14px", borderBottom: `1px solid ${C.line}`,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: ".08em" }}>
            {is10 ? "Triệu Hồi ×10" : "Triệu Hồi ×1"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
            <X size={14} />
          </button>
        </div>

        {/* Cards */}
        <div style={{
          padding: is10 ? "12px 8px" : "16px",
          display: "flex", flexWrap: "wrap", gap: is10 ? 7 : 0,
          justifyContent: "center",
        }}>
          {results.map((r, i) => <ResultCard key={i} result={r} idx={i} compact={is10} />)}
        </div>

        {/* Pull-again */}
        <div style={{
          display: "flex", gap: 5, padding: "7px 10px 9px",
          borderTop: `1px solid ${C.line}`,
        }}>
          <PullRow label="×1"  cost={GACHA_COST}    canAfford={avocados >= GACHA_COST}    onClick={onPull1}  primary />
          <PullRow label="×10" cost={GACHA_COST_10} canAfford={avocados >= GACHA_COST_10} onClick={onPull10} />
          <button onClick={onClose} style={{
            padding: "6px 12px", borderRadius: 5, border: `1px solid ${C.line}`,
            background: "transparent", color: C.muted, fontSize: 10, cursor: "pointer", flexShrink: 0,
          }}>Đóng</button>
        </div>
      </div>

      <style>{`
        @keyframes rIn { from{opacity:0;transform:translate(-50%,-50%)scale(.93)} to{opacity:1;transform:translate(-50%,-50%)scale(1)} }
        @keyframes cIn { from{opacity:0;transform:translateY(6px)scale(.9)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({
  result, idx, compact,
}: { result: GachaResult; idx: number; compact: boolean }) {
  const delay = `${idx * 42}ms`;
  const W = compact ? 58 : 110;
  const H = compact ? 74 : 140;

  if (result.kind === "avocado") {
    return (
      <div style={{ width: W, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, animation: "cIn .28s both", animationDelay: delay }}>
        <div style={{
          width: W, height: H, borderRadius: 5,
          background: "rgba(200,151,58,0.07)", border: "1px solid rgba(200,151,58,0.2)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
        }}>
          <span style={{ fontSize: compact ? 18 : 30 }}>🥑</span>
          <span style={{ fontSize: compact ? 9 : 13, fontWeight: 800, color: C.amber }}>+{result.amount}</span>
        </div>
        {!compact && <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase" }}>Bơ</span>}
      </div>
    );
  }

  const d = result as DecoBuilding;
  return (
    <div style={{ width: W, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, animation: "cIn .28s both", animationDelay: delay }}>
      <div style={{
        width: W, height: H, borderRadius: 5, overflow: "hidden", position: "relative",
        border: `1.5px solid ${RARITY_COLOR[d.rarity]}`,
        boxShadow: `0 0 9px ${RARITY_GLOW[d.rarity]}`,
      }}>
        <Image loading="eager" src={d.cardSrc} alt={d.name} fill unoptimized style={{ objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg,transparent 55%,${RARITY_COLOR[d.rarity]}40 100%)` }} />
      </div>
      <span style={{ fontSize: compact ? 7 : 9, color: C.text, textAlign: "center", lineHeight: 1.2, maxWidth: W }}>{d.name}</span>
      <span style={{ fontSize: compact ? 7 : 8, color: RARITY_COLOR[d.rarity], letterSpacing: 1 }}>{RARITY_LABEL[d.rarity]}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface GachaOverlayProps {
  camera: Camera;
  width: number;
  height: number;
}

export default function GachaOverlay({ camera, width, height }: GachaOverlayProps) {
  const {
    gachaOpen, gachaResults, gachaAnimating,
    avocados, openGacha, closeGacha,
    performPull, performPull10, finishAnim,
  } = useMapStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera>(camera);
  const [stars, setStars] = useState<Star[]>([]);

  // Keep cameraRef always current — RAF loop reads this, not camera prop directly
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  const gate = useMemo(() => BUILDINGS.find((b) => b.id === "summoning_gate"), []);

  // World-space gate centre (never changes)
  const gateWorld = useMemo(() => ({
    x: gate ? gate.worldX + gate.width  / 2 : 0,
    y: gate ? gate.worldY + gate.height / 2 : 0,
  }), [gate]);

  // Screen-space gate centre for popup anchor (re-derived each render when camera changes)
  const gateCx = useMemo(() => {
    if (!gate || !width) return width / 2;
    const st = TILE_SIZE * camera.zoom;
    const { x } = worldToScreen(gate.worldX, gate.worldY, camera, width / 2, height / 2);
    return x + gate.width * st / 2;
  }, [gate, camera, width, height]);

  const gateCy = useMemo(() => {
    if (!gate || !width) return height / 2;
    const { y } = worldToScreen(gate.worldX, gate.worldY, camera, width / 2, height / 2);
    return y;
  }, [gate, camera, width, height]);

  // Sync canvas size
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = width; c.height = height;
  }, [width, height]);

  const spawnStars = useCallback((results: GachaResult[]) => {
    const colorKey = batchStarColor(results);
    const count    = results.length >= 10 ? 20 : 5;
    const size     = colorKey === 5 ? 14 : colorKey === 4 ? 11 : 8;

    setStars(Array.from({ length: count }, (_, i) => ({
      startX:     (i / Math.max(count - 1, 1)) * width * 0.8 + width * 0.1 + (Math.random() - 0.5) * 60,
      startY:     -20 - Math.random() * 130,
      gateWorldX: gateWorld.x,
      gateWorldY: gateWorld.y,
      offsetX:    (Math.random() - 0.5) * 22,
      offsetY:    (Math.random() - 0.5) * 12,
      progress:   0,
      speed:      0.005 + Math.random() * 0.005,
      size, colorKey, trail: [], done: false,
    })));
  }, [gateWorld, width]);

  const handleDone = useCallback(() => { setStars([]); finishAnim(); }, [finishAnim]);

  useStarCanvas(canvasRef, stars, cameraRef, width, height, handleDone);

  const handlePull1 = useCallback(() => {
    const r = performPull(); if (r) spawnStars(r);
  }, [performPull, spawnStars]);

  const handlePull10 = useCallback(() => {
    const r = performPull10(); if (r) spawnStars(r);
  }, [performPull10, spawnStars]);

  if (!width || !height) return null;

  const showPopup   = gachaOpen && !gachaAnimating && !gachaResults;
  const showResults = !!gachaResults && !gachaAnimating;

  return (
    <>
      {/* Star canvas */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 170 }} />

      {/* Pull popup — anchored to gate, moves with camera */}
      {showPopup && (
        <div className="absolute inset-0 select-none" style={{ zIndex: 165, pointerEvents: "none" }}>
          <PullPopup
            cx={gateCx} cy={gateCy}
            avocados={avocados}
            onPull1={handlePull1} onPull10={handlePull10} onClose={closeGacha}
          />
        </div>
      )}

      {/* Result panel — fixed centre, camera-independent */}
      {showResults && gachaResults && (
        <ResultPanel
          results={gachaResults}
          screenH={height}
          avocados={avocados}
          onPull1={() => { closeGacha(); requestAnimationFrame(openGacha); }}
          onPull10={() => {
            useMapStore.setState({ gachaResults: null });
            setTimeout(() => { const r = performPull10(); if (r) spawnStars(r); }, 50);
          }}
          onClose={closeGacha}
        />
      )}
    </>
  );
}