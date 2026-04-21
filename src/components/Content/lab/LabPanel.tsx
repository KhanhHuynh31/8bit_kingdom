"use client";
// src/components/Content/lab/LabPanel.tsx

import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { useMapStore } from "@/stores/useMapStore";
import {
  Save,
  FlaskConical,
  Swords,
  RotateCcw,
  Sparkles,
  Move,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";
import {
  PLANT_MODULES,
  MODULE_LABELS,
  getBulletType,
  getRandomEffect,
  type ModuleType,
} from "@/constants/plantModules";
import {
  TabBtn,
  ActionBtn,
  StatBar,
  MODULE_ORDER,
} from "../shared/labBattleShared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PartTransform = {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
  zIndex: number;
  /** hex tint color, "" = no tint */
  tint: string;
};

export type LayoutMap = Record<ModuleType, PartTransform>;

export const DEFAULT_LAYOUT: LayoutMap = {
  body: { x: 0,   y: 20,  scale: 1.0,  visible: true, zIndex: 1, tint: "" },
  head: { x: 0,   y: -55, scale: 0.85, visible: true, zIndex: 2, tint: "" },
  leaf: { x: 0,   y: -10, scale: 0.9,  visible: true, zIndex: 3, tint: "" },
  eye:  { x: 0,   y: -58, scale: 0.5,  visible: true, zIndex: 4, tint: "" },
  acc:  { x: 0,   y: -72, scale: 0.45, visible: true, zIndex: 5, tint: "" },
};

const PREVIEW_W = 220;
const PREVIEW_H = 280;

// ─── ModuleGrid ───────────────────────────────────────────────────────────────

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
      <div style={{
        fontSize: 11, fontWeight: 600, color: "#9ca3af",
        textTransform: "uppercase", letterSpacing: "0.05em",
        marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>{MODULE_LABELS[type]}</span>
        <span style={{ fontSize: 9, color: "#4b5563", fontWeight: 400, marginLeft: "auto" }}>
          {modules.length} lựa chọn
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 6 }}>
        {modules.map((mod) => {
          const isSelected = selectedId === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onSelect(mod.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "6px 4px", borderRadius: 8,
                border: `1.5px solid ${isSelected ? "#3b82f6" : "rgba(107,76,30,0.3)"}`,
                background: isSelected ? "rgba(59,130,246,0.12)" : "rgba(38,24,10,0.4)",
                cursor: "pointer", transition: "all 0.15s",
                color: isSelected ? "#93c5fd" : "#c8a870",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mod.imagePath || "/assets/lab/placeholder.png"}
                alt={mod.label}
                style={{ width: 48, height: 48, objectFit: "contain" }}
              />
              <span style={{ fontSize: 9, fontWeight: 500, textAlign: "center", marginTop: 4 }}>{mod.label}</span>
              <div style={{ display: "flex", gap: 4, marginTop: 4, fontSize: 8, color: "#6b7280" }}>
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


// ─── Interactive Preview ──────────────────────────────────────────────────────

type DragInfo = {
  part: ModuleType;
  startMouseX: number;
  startMouseY: number;
  startPartX: number;
  startPartY: number;
};

function InteractivePreview({
  selectedMods,
  layout,
  onLayoutChange,
  activePart,
  onActivePart,
}: {
  selectedMods: Record<ModuleType, string | null>;
  layout: LayoutMap;
  onLayoutChange: (type: ModuleType, patch: Partial<PartTransform>) => void;
  activePart: ModuleType | null;
  onActivePart: (t: ModuleType | null) => void;
}) {
  // ✅ dragRef is NEVER read during render — fixes react-hooks/refs error
  const dragRef = useRef<DragInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // sortedParts is derived from layout values only, not dragRef
  const sortedParts = useMemo(
    () => (Object.keys(layout) as ModuleType[]).sort((a, b) => layout[a].zIndex - layout[b].zIndex),
    [layout],
  );

  const startDrag = useCallback((e: React.MouseEvent, type: ModuleType) => {
    e.preventDefault();
    e.stopPropagation();
    onActivePart(type);
    dragRef.current = {
      part: type,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPartX: layout[type].x,
      startPartY: layout[type].y,
    };
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      onLayoutChange(dragRef.current.part, {
        x: dragRef.current.startPartX + (ev.clientX - dragRef.current.startMouseX),
        y: dragRef.current.startPartY + (ev.clientY - dragRef.current.startMouseY),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      if (containerRef.current) containerRef.current.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [layout, onLayoutChange, onActivePart]);

  const startTouchDrag = useCallback((e: React.TouchEvent, type: ModuleType) => {
    e.stopPropagation();
    onActivePart(type);
    const touch = e.touches[0];
    dragRef.current = {
      part: type,
      startMouseX: touch.clientX,
      startMouseY: touch.clientY,
      startPartX: layout[type].x,
      startPartY: layout[type].y,
    };
    const onMove = (ev: TouchEvent) => {
      if (!dragRef.current) return;
      const t = ev.touches[0];
      onLayoutChange(dragRef.current.part, {
        x: dragRef.current.startPartX + (t.clientX - dragRef.current.startMouseX),
        y: dragRef.current.startPartY + (t.clientY - dragRef.current.startMouseY),
      });
    };
    const onEnd = () => {
      dragRef.current = null;
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  }, [layout, onLayoutChange, onActivePart]);

  const hasAnyMod = Object.values(selectedMods).some(Boolean);

  return (
    <div
      ref={containerRef}
      onClick={() => onActivePart(null)}
      style={{
        position: "relative", width: PREVIEW_W, height: PREVIEW_H,
        margin: "0 auto", borderRadius: 12, overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 80%, rgba(30,60,20,0.6) 0%, rgba(5,12,5,0.95) 100%)",
        border: "1px solid rgba(80,140,60,0.35)", userSelect: "none",
      }}
    >
      {/* Guide lines */}
      <svg width={PREVIEW_W} height={PREVIEW_H}
        style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }}>
        <line x1={PREVIEW_W / 2} y1={0} x2={PREVIEW_W / 2} y2={PREVIEW_H} stroke="#6ee7b7" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={0} y1={PREVIEW_H / 2} x2={PREVIEW_W} y2={PREVIEW_H / 2} stroke="#6ee7b7" strokeWidth={1} strokeDasharray="4 4" />
      </svg>

      {/* Ground shadow */}
      <div style={{
        position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)",
        width: 80, height: 16, borderRadius: "50%",
        background: "rgba(0,0,0,0.35)", filter: "blur(6px)", pointerEvents: "none",
      }} />

      {/* ✅ Parts — only layout state values are used here, dragRef is NOT touched */}
      {sortedParts.map((type) => {
        const modId = selectedMods[type];
        if (!modId) return null;
        const modData = PLANT_MODULES[type].find((m) => m.id === modId);
        if (!modData?.imagePath) return null;
        const t = layout[type];
        if (!t.visible) return null;

        const isActive = activePart === type;
        const imgSize = Math.round(110 * t.scale);

        return (
          <div
            key={type}
            onMouseDown={(e) => startDrag(e, type)}
            onTouchStart={(e) => startTouchDrag(e, type)}
            onClick={(e) => { e.stopPropagation(); onActivePart(type); }}
            style={{
              position: "absolute",
              left: PREVIEW_W / 2 + t.x - imgSize / 2,
              top: PREVIEW_H / 2 + t.y - imgSize / 2,
              width: imgSize,
              height: imgSize,
              cursor: "grab",
              zIndex: t.zIndex,
              outline: isActive ? "2px solid rgba(59,130,246,0.85)" : "none",
              outlineOffset: 2,
              borderRadius: 4,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={modData.imagePath}
              alt={modData.label}
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />

            {/* Active label */}
            {isActive && (
              <div style={{
                position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
                fontSize: 9, color: "#93c5fd", background: "rgba(0,0,0,0.8)",
                padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
              }}>
                {modData.label}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {!hasAnyMod && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 8, color: "#374151", pointerEvents: "none",
        }}>
          <Layers size={28} opacity={0.4} />
          <span style={{ fontSize: 11 }}>Chọn module để xem trước</span>
        </div>
      )}
    </div>
  );
}

// ─── Layout Controls ──────────────────────────────────────────────────────────

function LayoutControls({
  activePart,
  layout,
  onLayoutChange,
  onResetLayout,
}: {
  activePart: ModuleType | null;
  layout: LayoutMap;
  onLayoutChange: (type: ModuleType, patch: Partial<PartTransform>) => void;
  onResetLayout: () => void;
}) {
  return (
    <div style={{
      background: "rgba(10,16,10,0.6)", border: "1px solid rgba(80,140,60,0.3)",
      borderRadius: 12, padding: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          <Move size={12} /> Bố Cục
        </div>
        <button
          onClick={onResetLayout}
          style={{
            background: "transparent", border: "1px solid rgba(107,76,30,0.4)",
            borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#c8a870",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <RotateCcw size={10} /> Reset
        </button>
      </div>

      {activePart ? (
        <div>
          <div style={{ fontSize: 11, color: "#6ee7b7", marginBottom: 10, fontWeight: 600 }}>
            Đang chỉnh: {MODULE_LABELS[activePart] ?? activePart}
          </div>

          {/* Scale */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>Kích cỡ</span>
              <span style={{ fontSize: 10, color: "#c8a870" }}>{Math.round(layout[activePart].scale * 100)}%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ZoomOut size={12} style={{ color: "#6b7280", flexShrink: 0 }} />
              <input
                type="range" min={20} max={200} step={2}
                value={Math.round(layout[activePart].scale * 100)}
                onChange={(e) => onLayoutChange(activePart, { scale: Number(e.target.value) / 100 })}
                style={{ flex: 1, accentColor: "#3b82f6", cursor: "pointer" }}
              />
              <ZoomIn size={12} style={{ color: "#6b7280", flexShrink: 0 }} />
            </div>
          </div>

          {/* Nudge */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 6 }}>
              Vị trí (x: {Math.round(layout[activePart].x)}, y: {Math.round(layout[activePart].y)})
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[
                { label: "← Trái", dx: -5, dy: 0 },
                { label: "Phải →", dx: 5, dy: 0 },
                { label: "↑ Lên", dx: 0, dy: -5 },
                { label: "↓ Xuống", dx: 0, dy: 5 },
              ].map(({ label, dx, dy }) => (
                <button
                  key={label}
                  onClick={() => onLayoutChange(activePart, {
                    x: layout[activePart].x + dx,
                    y: layout[activePart].y + dy,
                  })}
                  style={{
                    padding: "4px 0", fontSize: 10, borderRadius: 4,
                    border: "1px solid rgba(107,76,30,0.35)",
                    background: "rgba(38,24,10,0.5)",
                    color: "#c8a870", cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Z-index */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>Lớp (z-index)</span>
              <span style={{ fontSize: 10, color: "#c8a870" }}>{layout[activePart].zIndex}</span>
            </div>
            <input
              type="range" min={1} max={10} step={1}
              value={layout[activePart].zIndex}
              onChange={(e) => onLayoutChange(activePart, { zIndex: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#a78bfa", cursor: "pointer" }}
            />
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "#4b5563", textAlign: "center", padding: "6px 0" }}>
          Click vào bộ phận trong preview để chỉnh
        </div>
      )}

      {/* Visibility */}
      <div style={{
        marginTop: 12, paddingTop: 10,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", gap: 6, flexWrap: "wrap",
      }}>
        {(Object.keys(layout) as ModuleType[]).map((type) => (
          <button
            key={type}
            onClick={() => onLayoutChange(type, { visible: !layout[type].visible })}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 12, fontSize: 10,
              border: `1px solid ${layout[type].visible ? "rgba(110,231,183,0.4)" : "rgba(107,76,30,0.25)"}`,
              background: layout[type].visible ? "rgba(110,231,183,0.08)" : "rgba(38,24,10,0.3)",
              color: layout[type].visible ? "#6ee7b7" : "#4b5563",
              cursor: "pointer",
            }}
          >
            {layout[type].visible ? <Eye size={10} /> : <EyeOff size={10} />}
            {MODULE_LABELS[type] ?? type}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LabPanel({ onSwitchBattle }: { onSwitchBattle: () => void }) {
  const { savePlant } = useMapStore();

  const [selectedMods, setSelectedMods] = useState<Record<ModuleType, string | null>>(
    { head: null, body: null, leaf: null, eye: null, acc: null },
  );
  const [layout, setLayout] = useState<LayoutMap>(
    JSON.parse(JSON.stringify(DEFAULT_LAYOUT)) as LayoutMap,
  );
  const [activePart, setActivePart] = useState<ModuleType | null>(null);
  const [plantName, setPlantName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const handleLayoutChange = useCallback((type: ModuleType, patch: Partial<PartTransform>) => {
    setLayout((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)) as LayoutMap);
  }, []);

  const stats = useMemo(() => {
    let str = 0, agi = 0, lck = 0;
    (Object.entries(selectedMods) as [ModuleType, string | null][]).forEach(([type, id]) => {
      if (!id) return;
      const m = PLANT_MODULES[type].find((x) => x.id === id);
      if (m) { str += m.str; agi += m.agi; lck += m.lck; }
    });
    return { str, agi, lck };
  }, [selectedMods]);

  const bulletType = useMemo(() => getBulletType(stats.str, stats.agi, stats.lck), [stats]);

  const effect = useMemo(() => {
    const seed = stats.str * 17 + stats.agi * 31 + stats.lck * 53 +
      Object.values(selectedMods).filter(Boolean).length * 7;
    return getRandomEffect(stats.lck, seed);
  }, [stats, selectedMods]);

  const selectMod = useCallback((type: ModuleType, id: string) => {
    setSelectedMods((prev) => ({ ...prev, [type]: prev[type] === id ? null : id }));
  }, []);

  const handleSave = useCallback(() => {
    const hasAnyMod = Object.values(selectedMods).some(Boolean);
    if (!hasAnyMod) { showToast("Chọn ít nhất 1 module!"); return; }
    const name = plantName.trim() || `Cây #${Date.now() % 10000}`;

    // Snapshot: imagePath + tint for each selected part — used by BattlePanel renderer
    const partSnapshots: Record<ModuleType, { imagePath: string; tint: string } | null> = {
      head: null, body: null, leaf: null, eye: null, acc: null,
    };
    (Object.keys(selectedMods) as ModuleType[]).forEach((type) => {
      const id = selectedMods[type];
      if (!id) return;
      const modData = PLANT_MODULES[type].find((m) => m.id === id);
      if (!modData) return;
      partSnapshots[type] = { imagePath: modData.imagePath || "", tint: layout[type].tint };
    });

    savePlant({
      name,
      mods: { ...selectedMods },
      // Serialize layout as JSON string — avoids type conflict with plantSlice string field
      layoutJson: JSON.stringify(layout),
      partSnapshots,
      str: stats.str,
      agi: stats.agi,
      lck: stats.lck,
      bulletType,
      effect,
    });
    showToast(`✅ Đã lưu "${name}"!`);
    setPlantName("");
  }, [selectedMods, layout, stats, bulletType, effect, plantName, savePlant, showToast]);

  return (
    <div style={{ color: "#c8a870", maxWidth: 1400, margin: "0 auto" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(107,76,30,0.4)", paddingBottom: 12 }}>
        <TabBtn active><FlaskConical size={14} /> Lai Tạo</TabBtn>
        <TabBtn onClick={onSwitchBattle}><Swords size={14} /> Thực Chiến</TabBtn>
      </div>

      {/* Grid */}
      <div className="lab-grid" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1.2fr) 1fr", gap: 24, alignItems: "start" }}>
        {/* Left */}
        <div className="hide-scrollbar" style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto", paddingRight: 8 }}>
          {MODULE_ORDER.map((type) => (
            <ModuleGrid key={type} type={type} selectedId={selectedMods[type]} onSelect={(id) => selectMod(type, id)} />
          ))}

        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 12 }}>
          {/* Preview */}
          <div style={{
            background: "rgba(10,20,10,0.7)", border: "1px solid rgba(80,140,60,0.4)",
            borderRadius: 16, padding: 16,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <div style={{ fontSize: 10, color: "#4b5563", display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start" }}>
              <Move size={10} /> Kéo để di chuyển · Click để chọn bộ phận
            </div>
            <InteractivePreview
              selectedMods={selectedMods}
              layout={layout}
              onLayoutChange={handleLayoutChange}
              activePart={activePart}
              onActivePart={setActivePart}
            />
            <div style={{ fontSize: 10, color: "#6ee7b7", display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={11} />
              {Object.values(selectedMods).filter(Boolean).length}/5 bộ phận
            </div>
          </div>

          <LayoutControls activePart={activePart} layout={layout} onLayoutChange={handleLayoutChange} onResetLayout={resetLayout} />

          {/* Stats */}
          <div style={{ background: "rgba(10,16,10,0.6)", border: "1px solid rgba(80,140,60,0.3)", borderRadius: 12, padding: 16 }}>
            <StatBar label="Sức mạnh" value={stats.str} color="#ef4444" />
            <StatBar label="Nhanh nhẹn" value={stats.agi} color="#3b82f6" />
            <StatBar label="May mắn" value={stats.lck} color="#f59e0b" />
          </div>

          {/* Bullet & effect */}
          <div style={{ background: "rgba(10,16,10,0.6)", border: "1px solid rgba(80,140,60,0.3)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Loại đạn</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: bulletType.color, marginBottom: 4 }}>{bulletType.name}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>Sát thương {bulletType.dmg} · Tốc độ {bulletType.speed.toFixed(1)}</div>
            {effect && (
              <>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Hiệu ứng</div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", borderRadius: 20,
                  background: `${effect.color}22`, border: `1px solid ${effect.color}55`,
                  fontSize: 12, fontWeight: 600, color: effect.color, marginBottom: 6,
                }}>
                  {effect.name}
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{effect.desc}</div>
              </>
            )}
          </div>

          {/* Name + save */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Đặt tên cho cây..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid rgba(107,76,30,0.5)",
                background: "rgba(38,24,10,0.7)",
                color: "#c8a870", fontSize: 13, outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <ActionBtn onClick={handleSave} color="green"><Save size={14} /> Lưu vào bộ sưu tập</ActionBtn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: "rgba(6,16,6,0.97)", border: "1px solid rgba(72,180,60,0.55)",
          borderRadius: 8, padding: "8px 20px",
          fontSize: 13, fontWeight: 600, color: "#d1fae5",
          zIndex: 9999, whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          {toast}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 700px) { .lab-grid { grid-template-columns: 1fr !important; } }
        .hide-scrollbar { scrollbar-width: thin; scrollbar-color: #4a6a3a #1a2a1a; }
        .hide-scrollbar::-webkit-scrollbar { width: 6px; }
        .hide-scrollbar::-webkit-scrollbar-track { background: #1a2a1a; border-radius: 4px; }
        .hide-scrollbar::-webkit-scrollbar-thumb { background: #4a6a3a; border-radius: 4px; }
      `}</style>
    </div>
  );
}