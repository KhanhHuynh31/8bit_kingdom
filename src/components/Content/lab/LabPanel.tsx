"use client";
// src/components/Content/LabPanel.tsx

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useMapStore } from "@/stores/useMapStore";
import {
  Shuffle,
  Save,
  FlaskConical,
  Swords,
  RotateCcw,
  Paintbrush,
  Sparkles,
} from "lucide-react";
import {
  PLANT_MODULES,
  MODULE_LABELS,
  DEFAULT_COLORS,
  getBulletType,
  getRandomEffect,
  type ModuleType,
  type PlantColors,
} from "@/constants/plantModules";
import {
  TabBtn,
  ActionBtn,
  StatBar,
  MODULE_ORDER,
  drawPlantOnCanvas,
} from "../shared/labBattleShared";

// ─── Màu sắc ngẫu nhiên theo bộ phận ────────────────────────────────────────
const PART_HUE_RANGES: Record<keyof PlantColors, [number, number]> = {
  head: [100, 160],
  body: [110, 150],
  leaf: [90, 170],
  eye: [0, 360],
  acc: [30, 60],
};

function randomColorForPart(part: keyof PlantColors): string {
  const [hMin, hMax] = PART_HUE_RANGES[part];
  const h = hMin + Math.random() * (hMax - hMin);
  const s = 55 + Math.random() * 20;
  const l = 42 + Math.random() * 20;
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ─── Component ModuleGrid ────────────────────────────────────────────────────
function ModuleGrid({
  type,
  selectedId,
  onSelect,
}: {
  type: ModuleType;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const modules = PLANT_MODULES[type];
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>{MODULE_LABELS[type]}</span>
        <span
          style={{
            fontSize: 9,
            color: "#4b5563",
            fontWeight: 400,
            marginLeft: "auto",
          }}
        >
          {modules.length} lựa chọn
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
          gap: 6,
        }}
      >
        {modules.map((mod) => {
          const isSelected = selectedId === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onSelect(mod.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "6px 4px",
                borderRadius: 8,
                border: `1.5px solid ${
                  isSelected ? "#3b82f6" : "rgba(107,76,30,0.3)"
                }`,
                background: isSelected
                  ? "rgba(59,130,246,0.12)"
                  : "rgba(38,24,10,0.4)",
                cursor: "pointer",
                transition: "all 0.15s",
                color: isSelected ? "#93c5fd" : "#c8a870",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1.2 }}>{mod.icon}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                {mod.label}
              </span>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  marginTop: 4,
                  fontSize: 8,
                  color: "#6b7280",
                }}
              >
                <span style={{ color: "#ef4444" }}>{mod.str}</span>
                <span style={{ color: "#3b82f6" }}>{mod.agi}</span>
                <span style={{ color: "#f59e0b" }}>{mod.lck}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ColorPicker ────────────────────────────────────────────────────
function ColorPicker({
  colors,
  onChange,
}: {
  colors: PlantColors;
  onChange: (part: keyof PlantColors, value: string) => void;
}) {
  const parts = Object.keys(colors) as (keyof PlantColors)[];
  const randomizePart = (part: keyof PlantColors) => {
    onChange(part, randomColorForPart(part));
  };
  const randomizeAll = () => {
    parts.forEach((part) => onChange(part, randomColorForPart(part)));
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#9ca3af",
            textTransform: "uppercase",
          }}
        >
          Màu sắc
        </span>
        <button
          onClick={randomizeAll}
          style={{
            background: "transparent",
            border: "1px solid rgba(107,76,30,0.4)",
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 10,
            color: "#c8a870",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Paintbrush size={12} /> Ngẫu nhiên
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 8,
        }}
      >
        {parts.map((part) => (
          <div
            key={part}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0,0,0,0.2)",
              padding: "4px 8px",
              borderRadius: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#9ca3af",
                textTransform: "capitalize",
                minWidth: 40,
              }}
            >
              {MODULE_LABELS[part as ModuleType] ?? part}
            </span>
            <input
              type="color"
              value={colors[part]}
              onChange={(e) => onChange(part, e.target.value)}
              style={{
                width: 32,
                height: 28,
                borderRadius: 4,
                border: "1px solid rgba(107,76,30,0.5)",
                cursor: "pointer",
                padding: 2,
                background: "transparent",
              }}
            />
            <button
              onClick={() => randomizePart(part)}
              style={{
                background: "transparent",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                padding: 2,
              }}
              title="Ngẫu nhiên màu này"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component chính ──────────────────────────────────────────────────────────
export default function LabPanel({
  onSwitchBattle,
}: {
  onSwitchBattle: () => void;
}) {
  const { savePlant } = useMapStore();

  const [selectedMods, setSelectedMods] = useState<
    Record<ModuleType, string | null>
  >({ head: null, body: null, leaf: null, eye: null, acc: null });
  const [colors, setColors] = useState<PlantColors>({ ...DEFAULT_COLORS });
  const [plantName, setPlantName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idleTRef = useRef(0);
  const rafRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // Idle animation
  useEffect(() => {
    const loop = () => {
      idleTRef.current++;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx)
          drawPlantOnCanvas(
            ctx,
            selectedMods,
            colors,
            idleTRef.current,
            200,
            250,
          );
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [selectedMods, colors]);

  const stats = useMemo(() => {
    let str = 0,
      agi = 0,
      lck = 0;
    (Object.entries(selectedMods) as [ModuleType, string | null][]).forEach(
      ([type, id]) => {
        if (!id) return;
        const m = PLANT_MODULES[type].find((x) => x.id === id);
        if (m) {
          str += m.str;
          agi += m.agi;
          lck += m.lck;
        }
      },
    );
    return { str, agi, lck };
  }, [selectedMods]);

  const bulletType = useMemo(
    () => getBulletType(stats.str, stats.agi, stats.lck),
    [stats],
  );

  const effect = useMemo(() => {
    const seed =
      stats.str * 17 +
      stats.agi * 31 +
      stats.lck * 53 +
      Object.values(selectedMods).filter(Boolean).length * 7;
    return getRandomEffect(stats.lck, seed);
  }, [stats, selectedMods]);

  const selectMod = useCallback((type: ModuleType, id: string) => {
    setSelectedMods((prev) => ({
      ...prev,
      [type]: prev[type] === id ? null : id,
    }));
  }, []);

  const randomizeAll = useCallback(() => {
    const newMods = {
      head: null,
      body: null,
      leaf: null,
      eye: null,
      acc: null,
    } as Record<ModuleType, string | null>;
    MODULE_ORDER.forEach((type) => {
      const arr = PLANT_MODULES[type];
      newMods[type] = arr[Math.floor(Math.random() * arr.length)].id;
    });
    setSelectedMods(newMods);
    const newColors: PlantColors = { ...colors };
    (Object.keys(newColors) as (keyof PlantColors)[]).forEach((part) => {
      newColors[part] = randomColorForPart(part);
    });
    setColors(newColors);
  }, [colors]);

  const handleSave = useCallback(() => {
    const hasAnyMod = Object.values(selectedMods).some(Boolean);
    if (!hasAnyMod) {
      showToast("Chọn ít nhất 1 module!");
      return;
    }
    const name = plantName.trim() || `Cây #${Date.now() % 10000}`;
    savePlant({
      name,
      mods: { ...selectedMods },
      colors: { ...colors },
      str: stats.str,
      agi: stats.agi,
      lck: stats.lck,
      bulletType,
      effect,
    });
    showToast(`✅ Đã lưu "${name}"!`);
    setPlantName("");
  }, [
    selectedMods,
    colors,
    stats,
    bulletType,
    effect,
    plantName,
    savePlant,
    showToast,
  ]);

  return (
    <div style={{ color: "#c8a870", maxWidth: 1400, margin: "0 auto" }}>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          borderBottom: "1px solid rgba(107,76,30,0.4)",
          paddingBottom: 12,
        }}
      >
        <TabBtn active>
          <FlaskConical size={14} /> Lai Tạo
        </TabBtn>
        <TabBtn onClick={onSwitchBattle}>
          <Swords size={14} /> Thực Chiến
        </TabBtn>
      </div>

      {/* Main content: responsive grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 1.2fr) 1fr",
          gap: 24,
          alignItems: "start",
        }}
        className="lab-grid"
      >
        {/* Cột trái: Modules + Màu */}
        <div
          style={{
            maxHeight: "calc(100vh - 180px)",
            overflowY: "auto",
            paddingRight: 8,
          }}
          className="hide-scrollbar"
        >
          {MODULE_ORDER.map((type) => (
            <ModuleGrid
              key={type}
              type={type}
              selectedId={selectedMods[type]}
              onSelect={(id) => selectMod(type, id)}
            />
          ))}
          <ColorPicker
            colors={colors}
            onChange={(part, val) =>
              setColors((prev) => ({ ...prev, [part]: val }))
            }
          />
        </div>

        {/* Cột phải: Preview + Stats + Lưu */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            position: "sticky",
            top: 12,
          }}
        >
          {/* Preview */}
          <div
            style={{
              background: "rgba(10,20,10,0.7)",
              border: "1px solid rgba(80,140,60,0.4)",
              borderRadius: 16,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <canvas
              ref={canvasRef}
              width={200}
              height={250}
              style={{
                borderRadius: 12,
                display: "block",
                maxWidth: "100%",
                height: "auto",
              }}
            />
            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "#6ee7b7",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={12} /> Idle animation
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              background: "rgba(10,16,10,0.6)",
              border: "1px solid rgba(80,140,60,0.3)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <StatBar label="Sức mạnh" value={stats.str} color="#ef4444" />
            <StatBar label="Nhanh nhẹn" value={stats.agi} color="#3b82f6" />
            <StatBar label="May mắn" value={stats.lck} color="#f59e0b" />
          </div>

          {/* Bullet & Effect */}
          <div
            style={{
              background: "rgba(10,16,10,0.6)",
              border: "1px solid rgba(80,140,60,0.3)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
              Loại đạn
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: bulletType.color,
                marginBottom: 4,
              }}
            >
              {bulletType.name}
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>
              Sát thương {bulletType.dmg} · Tốc độ {bulletType.speed.toFixed(1)}
            </div>
            {effect && (
              <>
                <div
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,0.06)",
                    margin: "12px 0",
                  }}
                />
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                  Hiệu ứng
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: `${effect.color}22`,
                    border: `1px solid ${effect.color}55`,
                    fontSize: 12,
                    fontWeight: 600,
                    color: effect.color,
                    marginBottom: 6,
                  }}
                >
                  {effect.name}
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>
                  {effect.desc}
                </div>
              </>
            )}
          </div>

          {/* Tên & Nút lưu */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <input
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Đặt tên cho cây..."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(107,76,30,0.5)",
                background: "rgba(38,24,10,0.7)",
                color: "#c8a870",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <ActionBtn onClick={handleSave} color="green">
                  <Save size={14} /> Lưu vào bộ sưu tập
                </ActionBtn>
              </div>
              <ActionBtn onClick={randomizeAll} color="amber">
                <Shuffle size={14} /> Random
              </ActionBtn>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(6,16,6,0.97)",
            border: "1px solid rgba(72,180,60,0.55)",
            borderRadius: 8,
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 600,
            color: "#d1fae5",
            zIndex: 9999,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {toast}
        </div>
      )}

      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 700px) {
          .lab-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .hide-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4a6a3a #1a2a1a;
        }
        .hide-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: #1a2a1a;
          border-radius: 4px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background: #4a6a3a;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}