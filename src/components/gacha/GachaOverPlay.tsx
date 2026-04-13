"use client";

/**
 * GachaOverlay v3 — Popup nhỏ trên map
 * ──────────────────────────────────────
 * • Click building "summoning_gate" → mini popup ngay trên cổng:
 *     [×1 — 1.000🥑]  [×10 — 10.000🥑]
 * • Nhấn → animation ngôi sao rơi xuống cổng → hiện 1 hoặc 10 thẻ kết quả nhỏ
 * • Không có panel fullscreen nào cả
 * • Công trình quay được → vào Inventory (xem qua Bag)
 */

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
import { X, Sparkles } from "lucide-react";

// ─── RPG palette ──────────────────────────────────────────────────────────────
const C = {
  bg:     "rgba(11,13,19,0.97)",
  border: "rgba(180,140,60,0.35)",
  amber:  "#d4a843",
  amberD: "rgba(212,168,67,0.15)",
  text:   "#e8dfc8",
  muted:  "#8a7d5a",
  scroll: "#c4a484",
};

// ─── Canvas star animation ─────────────────────────────────────────────────────

interface FallingStar {
  id: number; x: number; startY: number;
  targetX: number; targetY: number;
  progress: number; speed: number; size: number;
  colorKey: StarAnimRarity;
  trail: { x: number; y: number; alpha: number }[];
  done: boolean;
}

function rgb(k: StarAnimRarity) {
  return k === 5 ? "245,200,66" : k === 4 ? "196,127,255" : "91,174,255";
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
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

function useStarCanvas(
  ref: React.RefObject<HTMLCanvasElement | null>,
  stars: FallingStar[],
  onDone: () => void,
) {
  const rafRef    = useRef<number>(0);
  const starsRef  = useRef<FallingStar[]>([]);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!stars.length) return;
    starsRef.current = stars.map((s) => ({ ...s, trail: [] }));
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let called = false;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;

      starsRef.current.forEach((s) => {
        if (s.done) return;
        allDone = false;
        s.progress = Math.min(1, s.progress + s.speed);
        const e  = s.progress * s.progress;
        const cx = s.x      + (s.targetX - s.x)      * e;
        const cy = s.startY + (s.targetY - s.startY) * e;
        const col = STAR_ANIM_COLOR[s.colorKey];
        const rgbStr = rgb(s.colorKey);

        s.trail.push({ x: cx, y: cy, alpha: 0.9 });
        if (s.trail.length > 18) s.trail.shift();
        s.trail.forEach((p, i) => {
          const f = i / s.trail.length;
          ctx.beginPath(); ctx.arc(p.x, p.y, s.size * 0.28 * f, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgbStr},${p.alpha * f * 0.6})`; ctx.fill();
          p.alpha *= 0.86;
        });

        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, s.size * 2.6);
        grd.addColorStop(0, `rgba(${rgbStr},.8)`); grd.addColorStop(1, `rgba(${rgbStr},0)`);
        ctx.beginPath(); ctx.arc(cx, cy, s.size * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        drawStar(ctx, cx, cy, s.size, col);

        if (s.progress > 0.82) {
          const t = (s.progress - 0.82) / 0.18;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * s.size * 4 * t, cy + Math.sin(a) * s.size * 4 * t);
            ctx.strokeStyle = col; ctx.globalAlpha = 0.4; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
        if (s.progress >= 1) s.done = true;
      });

      if (allDone && !called) {
        called = true;
        const f = starsRef.current[0];
        if (f) {
          const g = ctx.createRadialGradient(f.targetX, f.targetY, 0, f.targetX, f.targetY, 150);
          g.addColorStop(0, `rgba(${rgb(f.colorKey)},.6)`); g.addColorStop(1, `rgba(${rgb(f.colorKey)},0)`);
          ctx.beginPath(); ctx.arc(f.targetX, f.targetY, 150, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
        }
        setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); onDoneRef.current(); }, 450);
        return;
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ctx.clearRect(0, 0, canvas.width, canvas.height); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars.length]);
}

// ─── Result card (compact) ────────────────────────────────────────────────────

function ResultCard({ result, idx }: { result: GachaResult; idx: number }) {
  const delay = `${idx * 55}ms`;
  if (result.kind === "avocado") {
    return (
      <div style={{
        width: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        animation: "cardIn .35s both", animationDelay: delay,
      }}>
        <div style={{
          width: 64, height: 80, borderRadius: 5, background: C.bg,
          border: `1.5px solid ${C.border}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 11px,rgba(180,140,60,.04) 12px)" }} />
          <span style={{ fontSize: 22, position: "relative" }}>🥑</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.amber, position: "relative" }}>+{result.amount}</span>
        </div>
        <span style={{ fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em" }}>Bơ</span>
      </div>
    );
  }
  const d = result as DecoBuilding;
  return (
    <div style={{
      width: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      animation: "cardIn .35s both", animationDelay: delay,
    }}>
      <div style={{
        width: 64, height: 80, borderRadius: 5, overflow: "hidden", position: "relative",
        border: `2px solid ${RARITY_COLOR[d.rarity]}`,
        boxShadow: `0 0 10px ${RARITY_GLOW[d.rarity]}`,
        background: C.bg,
      }}>
        <Image src={d.cardSrc} alt={d.name} fill unoptimized style={{ objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg,transparent 55%,${RARITY_COLOR[d.rarity]}33 100%)` }} />
      </div>
      <span style={{ fontSize: 8, color: C.text, textAlign: "center", lineHeight: 1.2, maxWidth: 68 }}>{d.name}</span>
      <span style={{ fontSize: 8, color: RARITY_COLOR[d.rarity], letterSpacing: 1 }}>{RARITY_LABEL[d.rarity]}</span>
    </div>
  );
}

// ─── Mini pull popup (ngay trên cổng) ────────────────────────────────────────

function GatePullPopup({
  gateScreenX, gateScreenY, gateScreenW,
  avocados, onPull1, onPull10, onClose,
}: {
  gateScreenX: number; gateScreenY: number; gateScreenW: number;
  avocados: number;
  onPull1: () => void; onPull10: () => void; onClose: () => void;
}) {
  const can1  = avocados >= GACHA_COST;
  const can10 = avocados >= GACHA_COST_10;
  const cx    = gateScreenX + gateScreenW / 2;

  return (
    <div style={{
      position: "absolute",
      left: cx,
      top: gateScreenY - 12,
      transform: "translate(-50%, -100%)",
      pointerEvents: "auto",
      zIndex: 200,
    }}>
      <div style={{
        background: C.bg, border: `1.5px solid ${C.border}`,
        borderRadius: 6, overflow: "hidden",
        boxShadow: `0 0 24px ${C.amberD}, 0 8px 32px rgba(0,0,0,.8)`,
        minWidth: 240,
      }}>
        {/* Top scroll bar */}
        <div style={{ height: 4, background: C.scroll }} />

        {/* Header */}
        <div style={{
          padding: "8px 12px 6px",
          background: C.amberD,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={12} style={{ color: C.amber }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Cổng Triệu Hồi
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
            <X size={12} />
          </button>
        </div>

        {/* Buttons */}
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          <PullBtn label="×1 Cầu Nguyện" cost={GACHA_COST} canAfford={can1} onClick={onPull1} accent />
          <PullBtn label="×10 Triệu Hồi" cost={GACHA_COST_10} canAfford={can10} onClick={onPull10} />
          <div style={{ fontSize: 9, color: C.muted, textAlign: "center", marginTop: 2 }}>
            🥑 {avocados.toLocaleString()} — 5★:10% 4★:20% 🥑:70%
          </div>
        </div>

        {/* Bottom scroll bar */}
        <div style={{ height: 4, background: C.scroll }} />
      </div>

      {/* Arrow */}
      <div style={{
        width: 0, height: 0, margin: "0 auto",
        borderLeft: "7px solid transparent", borderRight: "7px solid transparent",
        borderTop: `7px solid ${C.border}`,
      }} />
    </div>
  );
}

function PullBtn({
  label, cost, canAfford, onClick, accent = false,
}: { label: string; cost: number; canAfford: boolean; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={!canAfford}
      style={{
        width: "100%", padding: "8px 12px",
        borderRadius: 3, border: `1.5px solid ${canAfford ? (accent ? C.amber : C.border) : "rgba(80,70,50,.4)"}`,
        background: canAfford && accent ? C.amberD : "transparent",
        color: canAfford ? (accent ? C.amber : C.text) : C.muted,
        fontSize: 11, fontWeight: 700, cursor: canAfford ? "pointer" : "not-allowed",
        textTransform: "uppercase", letterSpacing: "0.06em",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 10, opacity: .75 }}>{cost.toLocaleString()}🥑</span>
    </button>
  );
}

// ─── Result mini panel (hiện sau animation) ───────────────────────────────────

function ResultPanel({
  results, gateScreenX, gateScreenY, gateScreenW, screenH,
  avocados, onPull1, onPull10, onClose,
}: {
  results: GachaResult[];
  gateScreenX: number; gateScreenY: number; gateScreenW: number; screenH: number;
  avocados: number;
  onPull1: () => void; onPull10: () => void; onClose: () => void;
}) {
  const is10 = results.length >= 10;
  const panelW = is10 ? Math.min(700, gateScreenW * 3) : 280;
  const cx = gateScreenX + gateScreenW / 2;

  // Nếu panel tràn xuống → hiển thị phía trên
  const fitsBelow = gateScreenY + 300 < screenH;

  return (
    <div style={{
      position: "absolute",
      left: Math.max(8, Math.min(cx - panelW / 2, window.innerWidth - panelW - 8)),
      top: fitsBelow ? gateScreenY + 16 : gateScreenY - 16,
      transform: fitsBelow ? "none" : "translateY(-100%)",
      width: panelW,
      pointerEvents: "auto",
      zIndex: 200,
      animation: "fadeUp .3s both",
    }}>
      <div style={{
        background: C.bg, border: `1.5px solid ${C.border}`,
        borderRadius: 6, overflow: "hidden",
        boxShadow: `0 0 30px ${C.amberD}, 0 12px 40px rgba(0,0,0,.9)`,
      }}>
        <div style={{ height: 4, background: C.scroll }} />

        {/* Header */}
        <div style={{
          padding: "7px 12px", background: C.amberD, borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: ".1em" }}>
            {is10 ? "Kết Quả ×10" : "Kết Quả"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
            <X size={12} />
          </button>
        </div>

        {/* Cards */}
        <div style={{
          padding: "12px 10px",
          display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center",
        }}>
          {results.map((r, i) => <ResultCard key={i} result={r} idx={i} />)}
        </div>

        {/* Pull again buttons */}
        <div style={{ padding: "8px 12px 6px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 6 }}>
          <PullBtn label="×1" cost={GACHA_COST} canAfford={avocados >= GACHA_COST} onClick={onPull1} accent />
          <PullBtn label="×10" cost={GACHA_COST_10} canAfford={avocados >= GACHA_COST_10} onClick={onPull10} />
          <button onClick={onClose} style={{
            padding: "6px 10px", borderRadius: 3, border: `1px solid ${C.border}`,
            background: "none", color: C.muted, fontSize: 10, cursor: "pointer", flexShrink: 0,
          }}>Đóng</button>
        </div>

        <div style={{ height: 4, background: C.scroll }} />
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
      `}</style>
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

  const canvasRef        = useRef<HTMLCanvasElement | null>(null);
  const [stars, setStars] = useState<FallingStar[]>([]);

  const gate = useMemo(() => BUILDINGS.find((b) => b.id === "summoning_gate"), []);
  const gatePos = useMemo(() => {
    if (!gate || !width) return { x: width / 2, y: height / 2, w: 0 };
    const st = TILE_SIZE * camera.zoom;
    const { x, y } = worldToScreen(gate.worldX, gate.worldY, camera, width / 2, height / 2);
    return { x, y, w: gate.width * st };
  }, [gate, camera, width, height]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    c.width = width; c.height = height;
  }, [width, height]);

  const spawnStars = useCallback((results: GachaResult[]) => {
    const colorKey = batchStarColor(results);
    const count    = results.length >= 10 ? 20 : 5;
    const size     = colorKey === 5 ? 14 : colorKey === 4 ? 11 : 8;
    const tx       = gatePos.x + gatePos.w / 2;
    const ty       = gatePos.y;
    setStars(Array.from({ length: count }, (_, i) => ({
      id:       Date.now() + i,
      x:        (i / Math.max(count - 1, 1)) * width * 0.8 + width * 0.1 + (Math.random() - .5) * 60,
      startY:   -20 - Math.random() * 120,
      targetX:  tx + (Math.random() - .5) * 18,
      targetY:  ty,
      progress: 0,
      speed:    0.005 + Math.random() * 0.005,
      size, colorKey, trail: [], done: false,
    })));
  }, [gatePos, width]);

  const handlePull1 = useCallback(() => {
    const r = performPull();
    if (r) spawnStars(r);
  }, [performPull, spawnStars]);

  const handlePull10 = useCallback(() => {
    const r = performPull10();
    if (r) spawnStars(r);
  }, [performPull10, spawnStars]);

  const handleDone = useCallback(() => { setStars([]); finishAnim(); }, [finishAnim]);

  useStarCanvas(canvasRef, stars, handleDone);

  if (!width || !height) return null;

  const showPullPopup = gachaOpen && !gachaAnimating && !gachaResults;
  const showResults   = !!gachaResults && !gachaAnimating;

  return (
    <>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 170 }} />

      <div className="absolute inset-0 select-none" style={{ zIndex: 165, pointerEvents: "none" }}>
        {showPullPopup && (
          <GatePullPopup
            gateScreenX={gatePos.x} gateScreenY={gatePos.y} gateScreenW={gatePos.w}
            avocados={avocados}
            onPull1={handlePull1} onPull10={handlePull10} onClose={closeGacha}
          />
        )}

        {showResults && gachaResults && (
          <ResultPanel
            results={gachaResults}
            gateScreenX={gatePos.x} gateScreenY={gatePos.y} gateScreenW={gatePos.w}
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
      </div>
    </>
  );
}