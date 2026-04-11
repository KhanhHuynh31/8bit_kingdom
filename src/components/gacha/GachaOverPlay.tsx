"use client";
import { useEffect, useRef, useCallback, useState, useMemo, memo } from "react";
import Image from "next/image";
import { useMapStore } from "@/stores/useMapStore";
import {
  GachaResult,
  GachaCharacter,
  StarRarity,
  RARITY_COLOR,
  RARITY_GLOW,
  RARITY_LABEL,
  STAR_ANIM_COLOR,
  StarAnimRarity,
  GACHA_COST,
  GACHA_COST_10,
  ALL_CHARACTERS,
  batchStarColor,
} from "@/constants/gachaData";
import { GachaPullRecord } from "@/stores/slices/gachaSlice";
import { Camera } from "@/stores/types";
import { BUILDINGS, TILE_SIZE } from "@/constants/map";
import { worldToScreen } from "@/utils/coords";
import { Sparkles, Clock, BookOpen, X, Star, Scroll } from "lucide-react";

// ─── RPG palette ─────────────────────────────────────────────────────────────
const RPG = {
  bg: "#0b0d13",
  bgPanel: "#10121a",
  bgCard: "#14110a",
  bgParchment: "#1c1710",
  border: "rgba(180,140,60,0.25)",
  borderHover: "rgba(180,140,60,0.5)",
  amber: "#d4a843",
  amberDim: "rgba(212,168,67,0.12)",
  amberGlow: "rgba(212,168,67,0.3)",
  text: "#e8dfc8",
  textMuted: "#8a7d5a",
  textDim: "#4a4030",
  scroll: "#c4a484",
} as const;

// ─── Shared keyframes ─────────────────────────────────────────────────────────
const globalKeyframes = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes cardAppear { from { opacity:0; transform:translateY(12px) scale(.9); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes resultAppear { from { opacity:0; transform:scale(.82) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes gatePulse { 0%,100%{ filter:drop-shadow(0 0 10px ${RPG.amber}) drop-shadow(0 0 20px ${RPG.amber}); } 50%{ filter:drop-shadow(0 0 20px ${RPG.amber}) drop-shadow(0 0 40px ${RPG.amber}); } }
  @keyframes float { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-3px); } }
  @keyframes shimmer { 0%{ transform:translateX(-100%) skewX(-15deg); opacity:0; } 50%{ opacity:1; } 100%{ transform:translateX(200%) skewX(-15deg); opacity:0; } }
`;

// ─── Star Canvas types & hook ─────────────────────────────────────────────────
interface FallingStar {
  id: number;
  x: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  size: number;
  colorKey: StarAnimRarity;
  trail: { x: number; y: number; alpha: number }[];
  done: boolean;
}

const rarityRGB = (key: StarAnimRarity) =>
  key === 5 ? "245,200,66" : key === 4 ? "196,127,255" : "91,174,255";

const drawStarShape = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
) => {
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
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 2.5;
  ctx.fill();
  ctx.shadowBlur = 0;
};

const useStarCanvas = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  stars: FallingStar[],
  onDone: () => void,
) => {
  const raf = useRef<number>(0);
  const starsRef = useRef<FallingStar[]>([]);
  const onDoneRef = useRef(onDone);

  // Cập nhật onDoneRef trong effect để tránh lỗi react-hooks/refs
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!stars.length) return;
    starsRef.current = stars.map((s) => ({ ...s, trail: [] }));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let called = false;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;

      for (const s of starsRef.current) {
        if (s.done) continue;
        allDone = false;
        s.progress = Math.min(1, s.progress + s.speed);
        const e = s.progress ** 2;
        const cx = s.x + (s.targetX - s.x) * e;
        const cy = s.startY + (s.targetY - s.startY) * e;
        const rgb = rarityRGB(s.colorKey);
        const col = STAR_ANIM_COLOR[s.colorKey];

        s.trail.push({ x: cx, y: cy, alpha: 0.9 });
        if (s.trail.length > 20) s.trail.shift();
        s.trail.forEach((p, i) => {
          const f = i / s.trail.length;
          ctx.beginPath();
          ctx.arc(p.x, p.y, s.size * 0.28 * f, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb},${p.alpha * f * 0.65})`;
          ctx.fill();
          p.alpha *= 0.86;
        });

        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, s.size * 2.8);
        grd.addColorStop(0, `rgba(${rgb},0.85)`);
        grd.addColorStop(1, `rgba(${rgb},0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, s.size * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        drawStarShape(ctx, cx, cy, s.size, col);

        if (s.progress > 0.82) {
          const t = (s.progress - 0.82) / 0.18;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
              cx + Math.cos(a) * s.size * 4 * t,
              cy + Math.sin(a) * s.size * 4 * t,
            );
            ctx.strokeStyle = col;
            ctx.globalAlpha = 0.45;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
        if (s.progress >= 1) s.done = true;
      }

      if (allDone && !called) {
        called = true;
        const first = starsRef.current[0];
        if (first) {
          const rgb = rarityRGB(first.colorKey);
          const g = ctx.createRadialGradient(
            first.targetX,
            first.targetY,
            0,
            first.targetX,
            first.targetY,
            160,
          );
          g.addColorStop(0, `rgba(${rgb},.65)`);
          g.addColorStop(1, `rgba(${rgb},0)`);
          ctx.beginPath();
          ctx.arc(first.targetX, first.targetY, 160, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
        setTimeout(() => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          onDoneRef.current();
        }, 450);
        return;
      }
      raf.current = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      // Kiểm tra canvas tồn tại trước khi clear
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [stars, canvasRef]);
};

// ─── Reusable Components ──────────────────────────────────────────────────────
const ParchmentBtn = ({
  onClick,
  disabled,
  label,
  accent,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  accent?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      flex: 1,
      padding: "9px 8px",
      background: disabled
        ? "transparent"
        : accent
          ? RPG.amberDim
          : "transparent",
      border: `1.5px solid ${disabled ? RPG.textDim : accent ? RPG.amber : RPG.border}`,
      borderRadius: 2,
      color: disabled ? RPG.textDim : accent ? RPG.amber : RPG.textMuted,
      fontSize: 10,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      position: "relative",
      overflow: "hidden",
    }}
  >
    {!disabled && (
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg,transparent,${RPG.amberGlow},transparent)`,
          transform: "translateX(-100%)",
          transition: "transform 1s",
          pointerEvents: "none",
        }}
      />
    )}
    <Sparkles size={11} />
    {label}
  </button>
);

const ResultCard = memo(({ result, index }: { result: GachaResult; index: number }) => {
  const delay = `${index * 60}ms`;
  const isAvocado = result.kind === "avocado";
  const border = isAvocado ? RPG.border : RARITY_COLOR[(result as GachaCharacter).rarity];
  const glow = isAvocado ? "none" : RARITY_GLOW[(result as GachaCharacter).rarity];

  return (
    <div
      style={{
        width: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isAvocado ? 6 : 5,
        animation: "cardAppear .4s both",
        animationDelay: delay,
      }}
    >
      <div
        style={{
          width: 80,
          height: 100,
          borderRadius: 6,
          overflow: "hidden",
          border: `2px solid ${border}`,
          boxShadow: glow !== "none" ? `0 0 12px ${glow}` : undefined,
          background: RPG.bgCard,
          position: "relative",
        }}
      >
        {isAvocado ? (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "repeating-linear-gradient(0deg,transparent,transparent 14px,rgba(180,140,60,0.04) 15px)",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 28 }}>🥑</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: RPG.amber }}>
                +{result.amount}
              </span>
            </div>
          </>
        ) : (
          <>
            <Image
              src={(result as GachaCharacter).cardSrc}
              alt={(result as GachaCharacter).name}
              fill
              unoptimized
              style={{ objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(180deg,transparent 55%,${border}33 100%)`,
              }}
            />
          </>
        )}
      </div>
      {isAvocado ? (
        <span
          style={{
            fontSize: 9,
            color: RPG.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Phần thưởng
        </span>
      ) : (
        <>
          <span style={{ fontSize: 9, color: RPG.text, lineHeight: 1.2 }}>
            {(result as GachaCharacter).name}
          </span>
          <span style={{ fontSize: 9, color: border, letterSpacing: 1 }}>
            {RARITY_LABEL[(result as GachaCharacter).rarity]}
          </span>
        </>
      )}
    </div>
  );
});
ResultCard.displayName = "ResultCard";

const HistoryRow = memo(({ record }: { record: GachaPullRecord }) => {
  const d = new Date(record.pulledAt);
  const ts = `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  if (record.result.kind === "avocado") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 10px",
          background: RPG.amberDim,
          borderRadius: 2,
          borderLeft: `3px solid ${RPG.amber}`,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 3,
            border: `1px solid ${RPG.border}`,
            background: RPG.bgCard,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          🥑
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: RPG.amber }}>
            Phần Thưởng Bơ
          </div>
          <div style={{ fontSize: 9, color: RPG.textMuted }}>
            +{record.result.amount} 🥑
          </div>
        </div>
        <div style={{ fontSize: 9, color: RPG.textDim }}>{ts}</div>
      </div>
    );
  }
  const c = record.result as GachaCharacter;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 10px",
        background: "rgba(255,255,255,.02)",
        borderRadius: 2,
        borderLeft: `3px solid ${RARITY_COLOR[c.rarity]}`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${RARITY_COLOR[c.rarity]}`,
          background: RPG.bgCard,
          position: "relative",
        }}
      >
        <Image
          src={c.cardSrc}
          alt={c.name}
          fill
          unoptimized
          style={{ objectFit: "cover" }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: RPG.text }}>
          {c.name}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontSize: 9,
            color: RARITY_COLOR[c.rarity],
            letterSpacing: 1,
          }}
        >
          {RARITY_LABEL[c.rarity]}
        </div>
        <div style={{ fontSize: 9, color: RPG.textDim, marginTop: 2 }}>
          {ts}
        </div>
      </div>
    </div>
  );
});
HistoryRow.displayName = "HistoryRow";

// ─── Character Detail Modal ──────────────────────────────────────────────────
const CharacterDetailModal = ({
  character,
  onClose,
}: {
  character: GachaCharacter;
  onClose: () => void;
}) => {
  const border = RARITY_COLOR[character.rarity];
  const glow = RARITY_GLOW[character.rarity];
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.3s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 500,
          width: "100%",
          background: `linear-gradient(135deg, ${RPG.bgPanel} 0%, ${RPG.bgParchment} 100%)`,
          border: `2px solid ${border}`,
          borderRadius: 12,
          boxShadow: `0 0 60px ${glow}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "modalSlideUp 0.3s ease-out",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "none",
            border: "none",
            color: RPG.textMuted,
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
        <div
          style={{
            width: 200,
            height: 250,
            borderRadius: 8,
            overflow: "hidden",
            border: `3px solid ${border}`,
            boxShadow: `0 0 30px ${glow}`,
            marginBottom: 20,
          }}
        >
          <Image
            src={character.cardSrc}
            alt={character.name}
            width={200}
            height={250}
            unoptimized
            style={{ objectFit: "cover" }}
          />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: RPG.text, margin: 0 }}>
          {character.name}
        </h2>
        <div
          style={{
            fontSize: 14,
            color: border,
            textTransform: "uppercase",
            letterSpacing: 2,
            marginTop: 4,
          }}
        >
          {RARITY_LABEL[character.rarity]}
        </div>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 20,
            color: RPG.textMuted,
            fontSize: 14,
          }}
        >
        </div>
        <p
          style={{
            marginTop: 20,
            color: RPG.textDim,
            fontSize: 12,
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          {character.description || "Một nhân vật huyền thoại..."}
        </p>
      </div>
      <style>{globalKeyframes}</style>
    </div>
  );
};

// ─── Result Modal ────────────────────────────────────────────────────────────
const ResultModal = ({
  results,
  avocados,
  onClose,
  onPull,
  onPull10,
}: {
  results: GachaResult[];
  avocados: number;
  onClose: () => void;
  onPull: () => void;
  onPull10: () => void;
}) => {
  const is10 = results.length >= 10;
  const bestRarity = results.reduce<StarRarity | null>((best, r) => {
    if (r.kind !== "character") return best;
    return best === null || r.rarity > best ? r.rarity : best;
  }, null);
  const headerColor = bestRarity ? RARITY_COLOR[bestRarity] : RPG.amber;
  const headerGlow = bestRarity ? RARITY_GLOW[bestRarity] : RPG.amberGlow;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: is10 ? 640 : 340,
          maxWidth: "96vw",
          maxHeight: "90vh",
          background: RPG.bgPanel,
          border: `1.5px solid ${headerColor}`,
          borderRadius: 4,
          boxShadow: `0 0 60px ${headerGlow}, 0 24px 60px rgba(0,0,0,.9)`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "resultAppear .35s cubic-bezier(.34,1.56,.64,1) both",
          position: "relative",
        }}
      >
        <div
          style={{ height: 6, background: RPG.scroll, width: "100%", flexShrink: 0 }}
        />
        <div
          style={{
            padding: "16px 20px 12px",
            flexShrink: 0,
            textAlign: "center",
            borderBottom: `1px solid ${RPG.border}`,
            background: `linear-gradient(180deg,${RPG.amberDim} 0%,transparent 100%)`,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: RPG.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              marginBottom: 4,
            }}
          >
            — Kết Quả Triệu Hồi —
          </div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: headerColor,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {is10 ? "Triệu Hồi ×10" : "Triệu Hồi ×1"}
          </h2>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 16px",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            alignContent: "flex-start",
          }}
        >
          {results.map((r, i) => (
            <ResultCard key={i} result={r} index={i} />
          ))}
        </div>
        <div
          style={{
            padding: "12px 20px 6px",
            flexShrink: 0,
            borderTop: `1px solid ${RPG.border}`,
            display: "flex",
            gap: 8,
          }}
        >
          <ParchmentBtn
            onClick={onPull}
            disabled={avocados < GACHA_COST}
            label={`Cầu Nguyện ×1 — ${GACHA_COST.toLocaleString()}🥑`}
          />
          <ParchmentBtn
            onClick={onPull10}
            disabled={avocados < GACHA_COST_10}
            label={`×10 — ${GACHA_COST_10.toLocaleString()}🥑`}
            accent
          />
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 2,
              border: `1px solid ${RPG.border}`,
              background: "transparent",
              color: RPG.textMuted,
              fontSize: 11,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Đóng
          </button>
        </div>
        <div
          style={{ height: 6, background: RPG.scroll, width: "100%", flexShrink: 0 }}
        />
      </div>
      <style>{globalKeyframes}</style>
    </div>
  );
};

// ─── Main Gacha Panel ────────────────────────────────────────────────────────
type Tab = "pull" | "history" | "collection";

const GachaPanel = ({
  avocados,
  history,
  collection,
  totalPulls,
  onClose,
  onPull,
  onPull10,
}: {
  avocados: number;
  history: GachaPullRecord[];
  collection: Record<string, number>;
  totalPulls: number;
  onClose: () => void;
  onPull: () => void;
  onPull10: () => void;
}) => {
  const [tab, setTab] = useState<Tab>("pull");
  const [selectedChar, setSelectedChar] = useState<GachaCharacter | null>(null);

  const TABS = [
    { id: "pull" as Tab, icon: <Sparkles size={11} />, label: "Cầu Nguyện" },
    {
      id: "history" as Tab,
      icon: <Clock size={11} />,
      label: `Lịch Sử (${history.length})`,
    },
    {
      id: "collection" as Tab,
      icon: <BookOpen size={11} />,
      label: "Bộ Sưu Tập",
    },
  ];

  const renderCollectionCard = (char: GachaCharacter, count: number) => {
    const border = RARITY_COLOR[char.rarity];
    const glow = RARITY_GLOW[char.rarity];
    return (
      <div
        key={char.id}
        className="collection-card"
        style={{
          width: 72,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          cursor: "pointer",
        }}
        onClick={() => setSelectedChar(char)}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 5,
            overflow: "hidden",
            position: "relative",
            border: `2px solid ${border}`,
            boxShadow: `0 0 10px ${glow}`,
            background: RPG.bgCard,
          }}
        >
          <Image
            src={char.cardSrc}
            alt={char.name}
            fill
            unoptimized
            style={{ objectFit: "cover" }}
          />
          {count > 1 && (
            <div
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                background: "rgba(0,0,0,.85)",
                borderRadius: 8,
                padding: "0 4px",
                fontSize: 9,
                color: RPG.amber,
                fontWeight: 800,
                border: `1px solid ${RPG.border}`,
              }}
            >
              ×{count}
            </div>
          )}
        </div>
        <span
          style={{
            fontSize: 8,
            color: RPG.text,
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: 68,
          }}
        >
          {char.name}
        </span>
        <span style={{ fontSize: 8, color: border, letterSpacing: 1 }}>
          {RARITY_LABEL[char.rarity]}
        </span>
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)",
          backdropFilter: "blur(8px)",
          padding: 16,
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <style>{`
          ${globalKeyframes}
          .parchment-btn { position: relative; overflow: hidden; transition: all 0.25s; }
          .parchment-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,215,120,0.2), transparent); transition: left 0.5s; }
          .parchment-btn:hover::before { left: 100%; }
          .parchment-btn:active { transform: scale(0.98); }
          .gate-glow { animation: gatePulse 2s infinite; }
          .tab-btn { position: relative; transition: all 0.2s; }
          .tab-btn:hover { color: ${RPG.amber} !important; text-shadow: 0 0 4px ${RPG.amber}; }
          .tab-btn::after { content: ''; position: absolute; bottom: -2px; left: 50%; width: 0; height: 2px; background: ${RPG.amber}; transition: all 0.3s; transform: translateX(-50%); }
          .tab-btn:hover::after { width: 80%; }
          .history-item { animation: slideInRight 0.3s ease-out; transition: all 0.2s; }
          .history-item:hover { transform: translateX(4px); background: ${RPG.amberDim}20 !important; }
          @keyframes slideInRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
          .collection-card { transition: all 0.3s; animation: cardAppear 0.4s ease-out; }
          .collection-card:hover { transform: translateY(-5px) scale(1.02); border-color: ${RPG.amber} !important; box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 12px ${RPG.amber} !important; }
          .rate-card { transition: all 0.2s; cursor: default; }
          .rate-card:hover { transform: translateY(-2px); border-color: ${RPG.amber}40 !important; }
          .fantasy-scroll { scrollbar-width: thin; scrollbar-color: #7a5a28 #100c06; }
          .fantasy-scroll::-webkit-scrollbar { width: 10px; }
          .fantasy-scroll::-webkit-scrollbar-track { background: #100c06; border-left: 1px solid #2a1e0e; border-right: 1px solid #2a1e0e; }
          .fantasy-scroll::-webkit-scrollbar-track-piece { background: repeating-linear-gradient(180deg, #100c06 0px, #100c06 6px, #1a1208 6px, #1a1208 12px); }
          .fantasy-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #c8a040, #8b6530, #c8a040); border-radius: 2px; border: 1px solid #5a3e14; box-shadow: 0 0 6px rgba(200,160,60,0.4), inset 0 1px 0 rgba(255,220,100,0.25); }
          .fantasy-scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #f0d060, #a07830, #f0d060); box-shadow: 0 0 12px rgba(240,200,80,0.6), inset 0 1px 0 rgba(255,230,120,0.4); }
        `}</style>

        <div
          style={{
            width: 480,
            maxWidth: "96vw",
            maxHeight: "90vh",
            background: `linear-gradient(135deg, ${RPG.bgPanel} 0%, ${RPG.bgParchment} 100%)`,
            border: `2px solid ${RPG.amber}`,
            borderRadius: 12,
            boxShadow: `0 0 80px ${RPG.amberGlow}, 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "modalSlideUp 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)",
            position: "relative",
          }}
        >
          {/* Top ornate scroll */}
          <div
            style={{
              height: 8,
              background: `linear-gradient(90deg, transparent, ${RPG.amber}, ${RPG.amberGlow}, ${RPG.amber}, transparent)`,
              flexShrink: 0,
            }}
          />

          {/* Header */}
          <div
            style={{
              padding: "16px 20px 12px",
              flexShrink: 0,
              borderBottom: `2px solid ${RPG.amber}`,
              background: `linear-gradient(180deg, ${RPG.amberDim}40 0%, transparent 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  padding: 10,
                  background: `radial-gradient(circle, ${RPG.bgCard} 0%, #1a1510 100%)`,
                  border: `2px solid ${RPG.amber}`,
                  borderRadius: 8,
                  boxShadow: `0 0 16px ${RPG.amberGlow}`,
                  animation: "float 3s infinite",
                }}
              >
                <Star size={16} style={{ color: RPG.amber }} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${RPG.amber} 0%, #FFE4A0 50%, ${RPG.amber} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                  }}
                >
                  Cổng Triệu Hồi
                </h2>
                <p
                  style={{
                    fontSize: 9,
                    color: RPG.textMuted,
                    margin: "4px 0 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.25em",
                  }}
                >
                  ⚔️ Tổng {totalPulls} lần cầu nguyện ⚔️
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  background: `linear-gradient(135deg, ${RPG.bgCard} 0%, #1a1510 100%)`,
                  border: `1px solid ${RPG.amber}`,
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: RPG.amber,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>🥑</span>
                {avocados.toLocaleString()}
              </div>
              <button
                onClick={onClose}
                className="parchment-btn"
                style={{
                  background: `linear-gradient(135deg, ${RPG.bgCard} 0%, #1a1510 100%)`,
                  border: `1px solid ${RPG.border}`,
                  borderRadius: 6,
                  padding: "6px 8px",
                  cursor: "pointer",
                  color: RPG.textMuted,
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              padding: "0 20px",
              flexShrink: 0,
              borderBottom: `1px solid ${RPG.border}`,
              background: `linear-gradient(180deg, ${RPG.bgParchment} 0%, ${RPG.bgPanel} 100%)`,
              gap: 4,
            }}
          >
            {TABS.map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="tab-btn"
                style={{
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  borderBottom: `3px solid ${tab === id ? RPG.amber : "transparent"}`,
                  color: tab === id ? RPG.amber : RPG.textMuted,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div
            className="fantasy-scroll"
            style={{ flex: 1, overflowY: "auto", padding: 20 }}
          >
            {tab === "pull" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div
                  className="gate-glow"
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: `3px solid ${RPG.amber}`,
                    boxShadow: `0 0 40px ${RPG.amberGlow}, inset 0 0 20px rgba(0,0,0,0.5)`,
                    position: "relative",
                    background: `radial-gradient(circle, ${RPG.bgCard} 0%, #0a0806 100%)`,
                  }}
                >
                  <Image
                    src="/assets/gacha/banner.png"
                    alt="Cổng Triệu Hồi"
                    fill
                    unoptimized
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(135deg, transparent 30%, ${RPG.amberDim} 50%, transparent 70%)`,
                      animation: "shimmer 3s infinite",
                    }}
                  />
                </div>

                {/* Rates */}
                <div
                  style={{
                    width: "100%",
                    background: `linear-gradient(135deg, ${RPG.bgCard} 0%, #1a1510 100%)`,
                    borderRadius: 8,
                    border: `1px solid ${RPG.amber}40`,
                    padding: "14px 18px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    { label: "5★ Huyền Thoại", rate: "10%", color: RARITY_COLOR[5] },
                    { label: "4★ Hiếm", rate: "20%", color: RARITY_COLOR[4] },
                    { label: "🥑 Bơ Ngẫu Nhiên", rate: "70%", color: RPG.amber },
                  ].map((r) => (
                    <div key={r.label} className="rate-card" style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: r.color,
                          textShadow: `0 0 8px ${r.color}`,
                        }}
                      >
                        {r.rate}
                      </div>
                      <div style={{ fontSize: 9, color: RPG.textMuted, marginTop: 4 }}>
                        {r.label}
                      </div>
                    </div>
                  ))}
                </div>

            

                {/* Buttons */}
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    onClick={onPull}
                    disabled={avocados < GACHA_COST}
                    className="parchment-btn"
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      background:
                        avocados >= GACHA_COST
                          ? `linear-gradient(135deg, ${RPG.amberDim} 0%, ${RPG.amber} 100%)`
                          : `linear-gradient(135deg, #2a2520 0%, #1a1510 100%)`,
                      border: `2px solid ${avocados >= GACHA_COST ? RPG.amber : RPG.border}`,
                      borderRadius: 8,
                      color: avocados >= GACHA_COST ? "#fff" : RPG.textMuted,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: avocados >= GACHA_COST ? "pointer" : "not-allowed",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    ✨ Cầu Nguyện ×1 — {GACHA_COST.toLocaleString()} 🥑 ✨
                  </button>
                  <button
                    onClick={onPull10}
                    disabled={avocados < GACHA_COST_10}
                    className="parchment-btn"
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      background:
                        avocados >= GACHA_COST_10
                          ? `linear-gradient(135deg, #4a3520 0%, ${RPG.amberDim} 100%)`
                          : `linear-gradient(135deg, #2a2520 0%, #1a1510 100%)`,
                      border: `2px solid ${avocados >= GACHA_COST_10 ? RPG.amber : RPG.border}`,
                      borderRadius: 8,
                      color: avocados >= GACHA_COST_10 ? RPG.amber : RPG.textMuted,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: avocados >= GACHA_COST_10 ? "pointer" : "not-allowed",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    🔮 Triệu Hồi ×10 — {GACHA_COST_10.toLocaleString()} 🥑 🔮
                  </button>
                  {avocados < GACHA_COST && (
                    <p style={{ fontSize: 10, color: RPG.amberDim, textAlign: "center", margin: 0 }}>
                      ⚠️ Cần thêm {(GACHA_COST - avocados).toLocaleString()} 🥑 ⚠️
                    </p>
                  )}
                </div>
              </div>
            )}

            {tab === "history" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      background: `linear-gradient(135deg, ${RPG.bgCard} 0%, #1a1510 100%)`,
                      borderRadius: 8,
                      border: `1px dashed ${RPG.border}`,
                    }}
                  >
                    <Scroll size={32} style={{ color: RPG.textMuted, opacity: 0.5, marginBottom: 12 }} />
                    <p style={{ color: RPG.textMuted, fontSize: 12, fontStyle: "italic" }}>
                      📜 Chưa có lịch sử cầu nguyện 📜
                    </p>
                  </div>
                ) : (
                  history.map((r, idx) => (
                    <div key={r.id} className="history-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <HistoryRow record={r} />
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "collection" && (
              <div>
                {Object.keys(collection).length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      background: `linear-gradient(135deg, ${RPG.bgCard} 0%, #1a1510 100%)`,
                      borderRadius: 8,
                      border: `1px dashed ${RPG.border}`,
                    }}
                  >
                    <Star size={32} style={{ color: RPG.textMuted, opacity: 0.5, marginBottom: 12 }} />
                    <p style={{ color: RPG.textMuted, fontSize: 12, fontStyle: "italic" }}>
                      🌟 Chưa có nhân vật nào trong bộ sưu tập 🌟
                    </p>
                  </div>
                ) : (
                  ([5, 4] as StarRarity[]).map((rarity) => {
                    const owned = Object.entries(collection).filter(
                      ([id]) => ALL_CHARACTERS.find((c) => c.id === id)?.rarity === rarity,
                    );
                    if (owned.length === 0) return null;
                    return (
                      <div key={rarity} style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                          <div
                            style={{
                              height: 2,
                              flex: 1,
                              background: `linear-gradient(90deg, transparent, ${RARITY_COLOR[rarity]}66)`,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: RARITY_COLOR[rarity],
                              textTransform: "uppercase",
                              letterSpacing: "0.2em",
                              textShadow: `0 0 6px ${RARITY_COLOR[rarity]}`,
                            }}
                          >
                            {RARITY_LABEL[rarity]} ({owned.length})
                          </span>
                          <div
                            style={{
                              height: 2,
                              flex: 1,
                              background: `linear-gradient(90deg, ${RARITY_COLOR[rarity]}66, transparent)`,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                            gap: 10,
                          }}
                        >
                          {owned.map(([id, count]) => {
                            const char = ALL_CHARACTERS.find((c) => c.id === id);
                            return char ? renderCollectionCard(char, count) : null;
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Bottom ornate scroll */}
          <div
            style={{
              height: 8,
              background: `linear-gradient(90deg, transparent, ${RPG.amber}, ${RPG.amberGlow}, ${RPG.amber}, transparent)`,
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Character Detail Modal */}
      {selectedChar && (
        <CharacterDetailModal character={selectedChar} onClose={() => setSelectedChar(null)} />
      )}
    </>
  );
};

// ─── Main GachaOverlay ────────────────────────────────────────────────────────
export interface GachaOverlayProps {
  camera: Camera;
  width: number;
  height: number;
}

export default function GachaOverlay({ camera, width, height }: GachaOverlayProps) {
  const {
    gachaOpen,
    gachaResults,
    gachaAnimating,
    gachaHistory,
    gachaCollection,
    gachaTotalPulls,
    avocados,
    openGacha,
    closeGacha,
    performPull,
    performPullTen,
    finishAnimation,
  } = useMapStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<FallingStar[]>([]);

  const gatePos = useMemo(() => {
    const b = BUILDINGS.find((b) => b.id === "summoning_gate");
    if (!b || width === 0) return { x: width / 2, y: height / 2 };
    const st = TILE_SIZE * camera.zoom;
    const { x, y } = worldToScreen(b.worldX, b.worldY, camera, width / 2, height / 2);
    return { x: x + (b.width * st) / 2, y: y + (b.height * st) / 2 };
  }, [camera, width, height]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, [width, height]);

  const handleDone = useCallback(() => {
    setStars([]);
    finishAnimation();
  }, [finishAnimation]);

  useStarCanvas(canvasRef, stars, handleDone);

  const spawnStars = useCallback(
    (results: GachaResult[]) => {
      const colorKey = batchStarColor(results);
      const count = results.length >= 10 ? 20 : 5;
      const size = colorKey === 5 ? 15 : colorKey === 4 ? 11 : 8;
      setStars(
        Array.from({ length: count }, (_, i) => ({
          id: Date.now() + i,
          x: (i / (count - 1)) * width * 0.8 + width * 0.1 + (Math.random() - 0.5) * 60,
          startY: -20 - Math.random() * 130,
          targetX: gatePos.x + (Math.random() - 0.5) * (results.length >= 10 ? 40 : 16),
          targetY: gatePos.y,
          progress: 0,
          speed: 0.005 + Math.random() * 0.005,
          size,
          colorKey,
          trail: [],
          done: false,
        })),
      );
    },
    [width, gatePos],
  );

  const handlePull = useCallback(() => {
    const results = performPull();
    if (results) spawnStars(results);
  }, [performPull, spawnStars]);

  const handlePull10 = useCallback(() => {
    const results = performPullTen();
    if (results) spawnStars(results);
  }, [performPullTen, spawnStars]);

  if (width === 0 || height === 0) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 170 }}
      />
      {gachaOpen && !gachaAnimating && !gachaResults && (
        <GachaPanel
          avocados={avocados}
          history={gachaHistory}
          collection={gachaCollection}
          totalPulls={gachaTotalPulls}
          onClose={closeGacha}
          onPull={handlePull}
          onPull10={handlePull10}
        />
      )}
      {gachaResults && !gachaAnimating && (
        <ResultModal
          results={gachaResults}
          avocados={avocados}
          onClose={closeGacha}
          onPull={() => {
            closeGacha();
            requestAnimationFrame(openGacha);
          }}
          onPull10={() => {
            const results = performPullTen();
            if (results) {
              useMapStore.setState({ gachaResults: null });
              setTimeout(() => spawnStars(results), 50);
            }
          }}
        />
      )}
    </>
  );
}