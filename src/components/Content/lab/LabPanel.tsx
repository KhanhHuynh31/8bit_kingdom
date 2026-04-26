"use client";
// src/components/Content/lab/LabPanel.tsx
//
// NOTE – cần cập nhật thêm 2 file khác:
//
// 1) src/stores/slices/plantSlice.ts  – thêm vào SavedPlant:
//      bulletLayoutJson?: string;
//      bulletPrimaryColor?: string;
//      bulletDmg?: number;
//      bulletSpeed?: number;
//      bulletRadius?: number;
//    và cho phép savePlant nhận các field này.
//
// 2) src/components/Content/BattlePanel.tsx  – trong game loop, khi plant bắn đạn:
//    ưu tiên dùng plant.bulletLayoutJson thay vì global bullet selector
//    (xoá toàn bộ phần selectedBulletIdx và SavedBulletCard).

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
  Plus,
  Trash2,
  RotateCw,
  Target,
  CheckCircle2,
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
  StatBar,
  MODULE_ORDER,
  PREVIEW_W,
  PREVIEW_H,
  MODULE_BASE_SIZE,
  type PlacedModule,
} from "../shared/labBattleShared";
import BulletLabPanel from "./BulletLabPanel";
import {
  drawBulletOnCanvas,
  type PlacedBulletModule,
} from "@/constants/bulletModules";
import { type SavedBullet } from "@/stores/slices/bulletSlice";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_OFFSETS: Record<
  ModuleType,
  { x: number; y: number; scale: number; zIndex: number }
> = {
  body: { x: 0, y: 20,  scale: 1.0,  zIndex: 1 },
  head: { x: 0, y: -55, scale: 0.85, zIndex: 2 },
  leaf: { x: 0, y: -10, scale: 0.9,  zIndex: 3 },
  eye:  { x: 0, y: -58, scale: 0.5,  zIndex: 4 },
  acc:  { x: 0, y: -72, scale: 0.45, zIndex: 5 },
};

let _instanceCounter = 0;
function newInstanceId(): string {
  return `inst_${Date.now()}_${++_instanceCounter}`;
}

// ─── ModuleGrid ───────────────────────────────────────────────────────────────

function ModuleGrid({
  type,
  onAdd,
}: {
  type: ModuleType;
  onAdd: (type: ModuleType, moduleId: string) => void;
}) {
  const modules = PLANT_MODULES[type];
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11, fontWeight: 600, color: "#9ca3af",
          textTransform: "uppercase", letterSpacing: "0.05em",
          marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <span>{MODULE_LABELS[type]}</span>
        <span style={{ fontSize: 9, color: "#4b5563", fontWeight: 400, marginLeft: "auto" }}>
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
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => onAdd(type, mod.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "6px 4px", borderRadius: 8,
              border: "1.5px solid rgba(107,76,30,0.3)",
              background: "rgba(38,24,10,0.4)",
              cursor: "pointer", transition: "all 0.15s",
              color: "#c8a870", position: "relative",
            }}
            title={`Thêm ${mod.label}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mod.imagePath || "/assets/lab/placeholder.png"}
              alt={mod.label}
              style={{ width: 48, height: 48, objectFit: "contain" }}
            />
            <span style={{ fontSize: 9, fontWeight: 500, textAlign: "center", marginTop: 4 }}>
              {mod.label}
            </span>
            <div style={{ display: "flex", gap: 4, marginTop: 4, fontSize: 8, color: "#6b7280" }}>
              <span style={{ color: "#ef4444" }}>{mod.str}</span>
              <span style={{ color: "#3b82f6" }}>{mod.agi}</span>
              <span style={{ color: "#f59e0b" }}>{mod.lck}</span>
            </div>
            <div
              style={{
                position: "absolute", top: 3, right: 3,
                background: "rgba(59,130,246,0.2)", borderRadius: "50%",
                width: 16, height: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Plus size={9} color="#93c5fd" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── InteractivePreview ───────────────────────────────────────────────────────

type DragInfo = {
  instanceId: string;
  startMouseX: number;
  startMouseY: number;
  startPartX: number;
  startPartY: number;
};

function InteractivePreview({
  instances,
  onPatch,
  activeInstanceId,
  onActiveInstance,
}: {
  instances: PlacedModule[];
  onPatch: (instanceId: string, patch: Partial<PlacedModule>) => void;
  activeInstanceId: string | null;
  onActiveInstance: (id: string | null) => void;
}) {
  const dragRef = useRef<DragInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...instances].sort((a, b) => a.zIndex - b.zIndex),
    [instances],
  );

  const startDrag = useCallback(
    (e: React.MouseEvent, inst: PlacedModule) => {
      e.preventDefault();
      e.stopPropagation();
      onActiveInstance(inst.instanceId);
      dragRef.current = {
        instanceId: inst.instanceId,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPartX: inst.x,
        startPartY: inst.y,
      };
      if (containerRef.current) containerRef.current.style.cursor = "grabbing";
      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        onPatch(dragRef.current.instanceId, {
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
    },
    [onPatch, onActiveInstance],
  );

  const startTouchDrag = useCallback(
    (e: React.TouchEvent, inst: PlacedModule) => {
      e.stopPropagation();
      onActiveInstance(inst.instanceId);
      const touch = e.touches[0];
      dragRef.current = {
        instanceId: inst.instanceId,
        startMouseX: touch.clientX,
        startMouseY: touch.clientY,
        startPartX: inst.x,
        startPartY: inst.y,
      };
      const onMove = (ev: TouchEvent) => {
        if (!dragRef.current) return;
        const t = ev.touches[0];
        onPatch(dragRef.current.instanceId, {
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
    },
    [onPatch, onActiveInstance],
  );

  return (
    <div
      ref={containerRef}
      onClick={() => onActiveInstance(null)}
      style={{
        position: "relative", width: PREVIEW_W, height: PREVIEW_H,
        margin: "0 auto", borderRadius: 12, overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 80%, rgba(30,60,20,0.6) 0%, rgba(5,12,5,0.95) 100%)",
        border: "1px solid rgba(80,140,60,0.35)", userSelect: "none",
      }}
    >
      <svg width={PREVIEW_W} height={PREVIEW_H} style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }}>
        <line x1={PREVIEW_W / 2} y1={0} x2={PREVIEW_W / 2} y2={PREVIEW_H} stroke="#6ee7b7" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={0} y1={PREVIEW_H / 2} x2={PREVIEW_W} y2={PREVIEW_H / 2} stroke="#6ee7b7" strokeWidth={1} strokeDasharray="4 4" />
      </svg>
      <div
        style={{
          position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)",
          width: 80, height: 16, borderRadius: "50%",
          background: "rgba(0,0,0,0.35)", filter: "blur(6px)", pointerEvents: "none",
        }}
      />
      {sorted.map((inst) => {
        const modData = PLANT_MODULES[inst.type].find((m) => m.id === inst.moduleId);
        if (!modData?.imagePath || !inst.visible) return null;
        const imgSize = Math.round(MODULE_BASE_SIZE * inst.scale);
        const isActive = activeInstanceId === inst.instanceId;
        return (
          <div
            key={inst.instanceId}
            onMouseDown={(e) => startDrag(e, inst)}
            onTouchStart={(e) => startTouchDrag(e, inst)}
            onClick={(e) => { e.stopPropagation(); onActiveInstance(inst.instanceId); }}
            style={{
              position: "absolute",
              left: PREVIEW_W / 2 + inst.x - imgSize / 2,
              top: PREVIEW_H / 2 + inst.y - imgSize / 2,
              width: imgSize, height: imgSize,
              cursor: "grab", zIndex: inst.zIndex,
              transform: `rotate(${inst.rotation}deg)`,
              outline: isActive ? "2px solid rgba(59,130,246,0.85)" : "none",
              outlineOffset: 2, borderRadius: 4,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={modData.imagePath} alt={modData.label} draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
            {isActive && (
              <div style={{
                position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
                fontSize: 9, color: "#93c5fd", background: "rgba(0,0,0,0.8)",
                padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
              }}>
                {modData.label} ({inst.rotation}°)
              </div>
            )}
          </div>
        );
      })}
      {instances.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#374151", pointerEvents: "none" }}>
          <Layers size={28} opacity={0.4} />
          <span style={{ fontSize: 11 }}>Chọn module để thêm</span>
        </div>
      )}
    </div>
  );
}

// ─── InstanceControls ─────────────────────────────────────────────────────────

function InstanceControls({
  active,
  onPatch,
  onRemove,
  onResetAll,
}: {
  active: PlacedModule | null;
  onPatch: (instanceId: string, patch: Partial<PlacedModule>) => void;
  onRemove: (instanceId: string) => void;
  onResetAll: () => void;
}) {
  return (
    <div style={{ background: "rgba(10,16,10,0.6)", border: "1px solid rgba(80,140,60,0.3)", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          <Move size={12} /> Bố Cục
        </div>
        <button onClick={onResetAll} style={{ background: "transparent", border: "1px solid rgba(107,76,30,0.4)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#c8a870", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <RotateCcw size={10} /> Reset tất cả
        </button>
      </div>

      {active ? (
        <div>
          <div style={{ fontSize: 11, color: "#6ee7b7", marginBottom: 10, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Đang chỉnh: {MODULE_LABELS[active.type] ?? active.type}</span>
            <button onClick={() => onRemove(active.instanceId)} style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Trash2 size={10} /> Xóa
            </button>
          </div>

          {/* Scale */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>Kích cỡ</span>
              <span style={{ fontSize: 10, color: "#c8a870" }}>{Math.round(active.scale * 100)}%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ZoomOut size={12} style={{ color: "#6b7280", flexShrink: 0 }} />
              <input type="range" min={20} max={200} step={2} value={Math.round(active.scale * 100)}
                onChange={(e) => onPatch(active.instanceId, { scale: Number(e.target.value) / 100 })}
                style={{ flex: 1, accentColor: "#3b82f6", cursor: "pointer" }}
              />
              <ZoomIn size={12} style={{ color: "#6b7280", flexShrink: 0 }} />
            </div>
          </div>

          {/* Rotation */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                <RotateCw size={10} /> Xoay
              </span>
              <span style={{ fontSize: 10, color: "#c8a870" }}>{active.rotation}°</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, color: "#6b7280" }}>-180°</span>
              <input type="range" min={-180} max={180} step={1} value={active.rotation}
                onChange={(e) => onPatch(active.instanceId, { rotation: Number(e.target.value) })}
                style={{ flex: 1, accentColor: "#a78bfa", cursor: "pointer" }}
              />
              <span style={{ fontSize: 9, color: "#6b7280" }}>180°</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              {[-90, -45, 0, 45, 90, 180].map((deg) => (
                <button key={deg} onClick={() => onPatch(active.instanceId, { rotation: deg })}
                  style={{
                    flex: 1, padding: "3px 0", fontSize: 9, borderRadius: 4,
                    border: `1px solid ${active.rotation === deg ? "rgba(167,139,250,0.6)" : "rgba(107,76,30,0.35)"}`,
                    background: active.rotation === deg ? "rgba(167,139,250,0.15)" : "rgba(38,24,10,0.5)",
                    color: active.rotation === deg ? "#a78bfa" : "#c8a870", cursor: "pointer",
                  }}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Nudge */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 6 }}>
              Vị trí (x: {Math.round(active.x)}, y: {Math.round(active.y)})
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[
                { label: "← Trái", dx: -5, dy: 0 },
                { label: "Phải →", dx: 5, dy: 0 },
                { label: "↑ Lên", dx: 0, dy: -5 },
                { label: "↓ Xuống", dx: 0, dy: 5 },
              ].map(({ label, dx, dy }) => (
                <button key={label} onClick={() => onPatch(active.instanceId, { x: active.x + dx, y: active.y + dy })}
                  style={{ padding: "4px 0", fontSize: 10, borderRadius: 4, border: "1px solid rgba(107,76,30,0.35)", background: "rgba(38,24,10,0.5)", color: "#c8a870", cursor: "pointer" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Z-index */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>Lớp (z-index)</span>
              <span style={{ fontSize: 10, color: "#c8a870" }}>{active.zIndex}</span>
            </div>
            <input type="range" min={1} max={20} step={1} value={active.zIndex}
              onChange={(e) => onPatch(active.instanceId, { zIndex: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#a78bfa", cursor: "pointer" }}
            />
          </div>

          {/* Visibility */}
          <button
            onClick={() => onPatch(active.instanceId, { visible: !active.visible })}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
              borderRadius: 12, fontSize: 10, width: "100%", justifyContent: "center",
              border: `1px solid ${active.visible ? "rgba(110,231,183,0.4)" : "rgba(107,76,30,0.25)"}`,
              background: active.visible ? "rgba(110,231,183,0.08)" : "rgba(38,24,10,0.3)",
              color: active.visible ? "#6ee7b7" : "#4b5563", cursor: "pointer",
            }}
          >
            {active.visible ? <Eye size={10} /> : <EyeOff size={10} />}
            {active.visible ? "Hiển thị" : "Ẩn"}
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "#4b5563", textAlign: "center", padding: "6px 0" }}>
          Click vào bộ phận trong preview để chỉnh
        </div>
      )}
    </div>
  );
}

// ─── InstanceList ─────────────────────────────────────────────────────────────

function InstanceList({
  instances,
  activeInstanceId,
  onActiveInstance,
  onRemove,
}: {
  instances: PlacedModule[];
  activeInstanceId: string | null;
  onActiveInstance: (id: string | null) => void;
  onRemove: (id: string) => void;
}) {
  if (instances.length === 0) return null;
  return (
    <div style={{ background: "rgba(10,16,10,0.6)", border: "1px solid rgba(80,140,60,0.3)", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: 8 }}>
        Các Module ({instances.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
        {instances.map((inst) => {
          const modData = PLANT_MODULES[inst.type].find((m) => m.id === inst.moduleId);
          const isActive = activeInstanceId === inst.instanceId;
          return (
            <div key={inst.instanceId} onClick={() => onActiveInstance(isActive ? null : inst.instanceId)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 8px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${isActive ? "rgba(59,130,246,0.5)" : "rgba(107,76,30,0.25)"}`,
                background: isActive ? "rgba(59,130,246,0.1)" : "rgba(38,24,10,0.3)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={modData?.imagePath || "/assets/lab/placeholder.png"} alt={modData?.label}
                style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0, transform: `rotate(${inst.rotation}deg)` }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: isActive ? "#93c5fd" : "#c8a870", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                  {modData?.label ?? inst.moduleId}
                </div>
                <div style={{ fontSize: 9, color: "#4b5563" }}>
                  {MODULE_LABELS[inst.type]} · {inst.rotation}° · {Math.round(inst.scale * 100)}%
                </div>
              </div>
              {!inst.visible && <EyeOff size={10} color="#4b5563" />}
              <button onClick={(e) => { e.stopPropagation(); onRemove(inst.instanceId); }}
                style={{ background: "transparent", border: "none", color: "#4b5563", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BulletMiniCard ───────────────────────────────────────────────────────────
// Mini animated preview của 1 thiết kế đạn, dùng trong phần chọn đạn cho cây

function BulletMiniCard({
  bullet,
  selected,
  onClick,
}: {
  bullet: SavedBullet;
  selected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const instancesRef = useRef<PlacedBulletModule[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(bullet.layoutJson) as unknown;
      if (Array.isArray(parsed)) {
        instancesRef.current = parsed as PlacedBulletModule[];
      }
    } catch {
      instancesRef.current = [];
    }
  }, [bullet.layoutJson]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 56;
    const H = 32;
    const SPEED = 0.9;

    const loop = () => {
      frameRef.current++;
      const bx = ((frameRef.current * SPEED) % (W + 20)) - 10;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#060c06";
      ctx.fillRect(0, 0, W, H);

      if (instancesRef.current.length > 0) {
        drawBulletOnCanvas(ctx, instancesRef.current, bx, H / 2, frameRef.current, 0.42, 1);
      } else {
        ctx.fillStyle = bullet.primaryColor;
        ctx.beginPath();
        ctx.arc(bx, H / 2, Math.max(2, bullet.radius * 0.38), 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [bullet]);

  return (
    <div
      onClick={onClick}
      title={bullet.name}
      style={{
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        opacity: selected ? 1 : 0.65,
        transform: selected ? "scale(1.06)" : "scale(1)",
        transition: "transform 0.1s, opacity 0.1s",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        width={56}
        height={32}
        style={{
          borderRadius: 7,
          border: `1.5px solid ${selected ? "#f97316" : "rgba(107,76,30,0.35)"}`,
          display: "block",
        }}
      />
      {selected && (
        <div style={{ position: "absolute", top: -5, right: -5 }}>
          <CheckCircle2 size={13} color="#f97316" fill="#1a0a00" />
        </div>
      )}
      <div
        style={{
          fontSize: 8,
          color: selected ? "#fb923c" : "#6b7280",
          maxWidth: 56,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "center",
          fontWeight: selected ? 600 : 400,
        }}
      >
        {bullet.name}
      </div>
    </div>
  );
}

// ─── BulletSelectorPanel ──────────────────────────────────────────────────────
// Bảng chọn đạn nhỏ gọn trong phần lưu cây

function BulletSelectorPanel({
  savedBullets,
  selectedBulletId,
  onSelect,
}: {
  savedBullets: SavedBullet[];
  selectedBulletId: number | null;
  onSelect: (bullet: SavedBullet | null) => void;
}) {
  return (
    <div
      style={{
        background: "rgba(6,12,6,0.7)",
        border: "1px solid rgba(249,115,22,0.25)",
        borderRadius: 16,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#b0aa80",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Target size={11} color="#fb923c" />
        <span>Đạn cho cây này</span>
        {selectedBulletId !== null && (
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#fb923c", fontWeight: 600 }}>
            {savedBullets.find((b) => b.id === selectedBulletId)?.name ?? "—"}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* Tùy chọn "Tự động" (dùng bullet type tính từ stats) */}
        <div
          onClick={() => onSelect(null)}
          style={{
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            opacity: selectedBulletId === null ? 1 : 0.55,
            transform: selectedBulletId === null ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.1s, opacity 0.1s",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 56,
              height: 32,
              borderRadius: 7,
              border: `1.5px solid ${selectedBulletId === null ? "#9ca3af" : "rgba(107,76,30,0.35)"}`,
              background: "#060c06",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 8, color: "#6b7280", textAlign: "center", lineHeight: 1.2 }}>
              Tự động
            </span>
          </div>
          {selectedBulletId === null && (
            <div style={{ position: "absolute", top: -5, right: -5 }}>
              <CheckCircle2 size={13} color="#9ca3af" fill="#1a1a1a" />
            </div>
          )}
          <div style={{ fontSize: 8, color: selectedBulletId === null ? "#9ca3af" : "#4b5563", fontWeight: selectedBulletId === null ? 600 : 400 }}>
            Auto
          </div>
        </div>

        {/* Danh sách thiết kế đạn */}
        {savedBullets.map((b) => (
          <BulletMiniCard
            key={b.id}
            bullet={b}
            selected={selectedBulletId === b.id}
            onClick={() => onSelect(b)}
          />
        ))}

        {savedBullets.length === 0 && (
          <div style={{ fontSize: 10, color: "#374151", padding: "6px 0", display: "flex", alignItems: "center", gap: 6 }}>
            <Target size={10} opacity={0.4} />
            Chưa có thiết kế đạn — tạo ở tab Thiết Kế Đạn
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LabPanel({
  onSwitchBattle,
}: {
  onSwitchBattle: () => void;
}) {
  const { savePlant, savedBullets } = useMapStore();

  // ── Plant lab state ──────────────────────────────────────────────────────────
  const [instances, setInstances] = useState<PlacedModule[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [plantName, setPlantName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [subPanel, setSubPanel] = useState<"plant" | "bullet">("plant");

  // ── Bullet selection for this plant ─────────────────────────────────────────
  const [selectedBulletIdForPlant, setSelectedBulletIdForPlant] =
    useState<number | null>(null);

  const selectedBulletId =
    selectedBulletIdForPlant !== null &&
    savedBullets.some((b) => b.id === selectedBulletIdForPlant)
      ? selectedBulletIdForPlant
      : null;

  const selectedBulletForPlant =
    selectedBulletId !== null
      ? savedBullets.find((b) => b.id === selectedBulletId) ?? null
      : null;

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);


  // ── Plant module handlers ────────────────────────────────────────────────────

  const handleAddModule = useCallback(
    (type: ModuleType, moduleId: string) => {
      const def = DEFAULT_OFFSETS[type];
      const jitter = () => (Math.random() - 0.5) * 20;
      const newInst: PlacedModule = {
        instanceId: newInstanceId(),
        type,
        moduleId,
        x: def.x + jitter(),
        y: def.y + jitter(),
        scale: def.scale,
        rotation: 0,
        visible: true,
        zIndex: def.zIndex,
        tint: "",
      };
      setInstances((prev) => [...prev, newInst]);
      setActiveInstanceId(newInst.instanceId);
    },
    [],
  );

  const handlePatch = useCallback(
    (instanceId: string, patch: Partial<PlacedModule>) => {
      setInstances((prev) =>
        prev.map((inst) =>
          inst.instanceId === instanceId ? { ...inst, ...patch } : inst,
        ),
      );
    },
    [],
  );

  const handleRemove = useCallback((instanceId: string) => {
    setInstances((prev) =>
      prev.filter((inst) => inst.instanceId !== instanceId),
    );
    setActiveInstanceId((prev) => (prev === instanceId ? null : prev));
  }, []);

  const resetAll = useCallback(() => {
    setInstances([]);
    setActiveInstanceId(null);
  }, []);

  const activeInstance = useMemo(
    () => instances.find((i) => i.instanceId === activeInstanceId) ?? null,
    [instances, activeInstanceId],
  );

  // ── Stats derived from modules ───────────────────────────────────────────────

  const stats = useMemo(() => {
    let str = 0, agi = 0, lck = 0;
    instances.forEach((inst) => {
      const m = PLANT_MODULES[inst.type].find((x) => x.id === inst.moduleId);
      if (m) { str += m.str; agi += m.agi; lck += m.lck; }
    });
    return { str, agi, lck };
  }, [instances]);

  const bulletType = useMemo(
    () => getBulletType(stats.str, stats.agi, stats.lck),
    [stats],
  );

  const effect = useMemo(() => {
    const seed = stats.str * 17 + stats.agi * 31 + stats.lck * 53 + instances.length * 7;
    return getRandomEffect(stats.lck, seed);
  }, [stats, instances.length]);

  // ── Save plant (kèm thiết kế đạn đã chọn) ───────────────────────────────────

  const handleSave = useCallback(() => {
    if (instances.length === 0) {
      showToast("Thêm ít nhất 1 module!");
      return;
    }
    const name = plantName.trim() || `Cây #${Date.now() % 10000}`;

    const selectedMods: Record<ModuleType, string | null> = {
      head: null, body: null, leaf: null, eye: null, acc: null,
    };
    const partSnapshots: Record<
      ModuleType,
      { imagePath: string; tint: string } | null
    > = { head: null, body: null, leaf: null, eye: null, acc: null };

    instances.forEach((inst) => {
      selectedMods[inst.type] = inst.moduleId;
      const modData = PLANT_MODULES[inst.type].find((m) => m.id === inst.moduleId);
      if (modData) {
        partSnapshots[inst.type] = {
          imagePath: modData.imagePath || "",
          tint: inst.tint,
        };
      }
    });

    savePlant({
      name,
      mods: selectedMods,
      layoutJson: JSON.stringify(instances),
      partSnapshots,
      str: stats.str,
      agi: stats.agi,
      lck: stats.lck,
      bulletType,
      effect,
      // ▼ Thiết kế đạn riêng cho cây (null = dùng bulletType mặc định)
      bulletLayoutJson:   selectedBulletForPlant?.layoutJson    ?? undefined,
      bulletPrimaryColor: selectedBulletForPlant?.primaryColor  ?? undefined,
      bulletDmg:          selectedBulletForPlant?.dmg           ?? undefined,
      bulletSpeed:        selectedBulletForPlant?.speed         ?? undefined,
      bulletRadius:       selectedBulletForPlant?.radius        ?? undefined,
    });

    const bulletNote = selectedBulletForPlant
      ? ` + đạn "${selectedBulletForPlant.name}"`
      : "";
    showToast(`✅ Đã lưu "${name}"${bulletNote}!`);
    setPlantName("");
  }, [
    instances, stats, bulletType, effect,
    plantName, selectedBulletForPlant,
    savePlant, showToast,
  ]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={`plant-lab-container`}
      style={{
        color: "#c8a870",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 16px",
        transition: "all 0.3s ease",
        minHeight: "auto",
        height: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          borderBottom: "1px solid rgba(107,76,30,0.5)",
          paddingBottom: 8,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {/* Tab: Lai Tạo */}
          <TabBtn
            active={subPanel === "plant"}
            onClick={() => setSubPanel("plant")}
          >
            <FlaskConical size={14} /> Lai Tạo
          </TabBtn>

          {/* Tab: Thiết Kế Đạn */}
          <TabBtn
            active={subPanel === "bullet"}
            onClick={() => setSubPanel("bullet")}
          >
            <Target size={14} /> Thiết Kế Đạn
          </TabBtn>

          {/* Nút chuyển sang BattlePanel */}
          <TabBtn onClick={onSwitchBattle}>
            <Swords size={14} /> Thực Chiến
          </TabBtn>
        </div>


      </div>

      {/* ── Bullet tab ─────────────────────────────────────────────────────── */}
      {subPanel === "bullet" && (
        <div style={{ flex: 1 }}>
          <BulletLabPanel />
        </div>
      )}

      {/* ── Plant lab tab ───────────────────────────────────────────────────── */}
      {subPanel === "plant" && (
        <div
          className="lab-main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 1fr) minmax(300px, 1.3fr) minmax(280px, 1fr)",
            gap: 16,
            flex: 1,
            overflow: "visible",
          }}
        >
          {/* ── Cột trái: Module Picker ───────────────────────────────────── */}
          <div
            className="module-picker-col"
            style={{
              overflowY: "visible",
              maxHeight: "none",
              paddingRight: 4,
            }}
          >
            <div className="module-library">
              <div
                style={{
                  fontSize: 11, color: "#b9c4a8", marginBottom: 12,
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(0,0,0,0.4)", padding: "6px 12px",
                  borderRadius: 20, width: "fit-content",
                }}
              >
                <Plus size={11} /> Click để thêm · Thêm trùng hoặc nhiều tùy ý
              </div>
              {MODULE_ORDER.map((type) => (
                <ModuleGrid key={type} type={type} onAdd={handleAddModule} />
              ))}
            </div>
          </div>

          {/* ── Cột giữa: Preview + Stats + Save ─────────────────────────── */}
          <div
            className="preview-col"
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {/* Preview card */}
            <div className="preview-card-enhanced">
              <div className="preview-header-enhanced">
                <Move size={10} /> Kéo để di chuyển · Click để chọn
              </div>
              <InteractivePreview
                instances={instances}
                onPatch={handlePatch}
                activeInstanceId={activeInstanceId}
                onActiveInstance={setActiveInstanceId}
              />
              <div className="module-stats-badge-enhanced">
                <Sparkles size={11} />
                {instances.length} module ·{" "}
                {instances.filter((i) => i.visible).length} hiển thị
              </div>
            </div>

            {/* Stats panel */}
            <div className="stats-panel-enhanced">
              <StatBar label="Sức mạnh"  value={stats.str} color="#ef4444" />
              <StatBar label="Nhanh nhẹn" value={stats.agi} color="#3b82f6" />
              <StatBar label="May mắn"   value={stats.lck} color="#f59e0b" />
            </div>

            {/* Bullet & Effect panel */}
            <div className="effect-panel-enhanced">
              <div style={{ fontSize: 11, color: "#b0aa80", marginBottom: 6 }}>
                💥 Loại đạn mặc định
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: bulletType.color, marginBottom: 4 }}>
                {bulletType.name}
              </div>
              <div style={{ fontSize: 10, color: "#bcb28a" }}>
                Sát thương {bulletType.dmg} · Tốc độ {bulletType.speed.toFixed(1)}
              </div>
              {effect && (
                <>
                  <div className="divider-light-enhanced" />
                  <div style={{ fontSize: 11, color: "#b0aa80", marginBottom: 4 }}>✨ Hiệu ứng</div>
                  <div className="effect-badge-enhanced" style={{ borderColor: effect.color, background: `${effect.color}22`, color: effect.color }}>
                    {effect.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#bcb28a" }}>{effect.desc}</div>
                </>
              )}
            </div>

            {/* ── Chọn đạn cho cây ────────────────────────────────────────── */}
            <BulletSelectorPanel
              savedBullets={savedBullets}
              selectedBulletId={selectedBulletId}
              onSelect={(bullet) => setSelectedBulletIdForPlant(bullet?.id ?? null)}
            />

            {/* ── Đặt tên & Lưu ──────────────────────────────────────────── */}
            <div className="save-area-enhanced">
              <input
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="🌱 Đặt tên cho cây..."
                className="plant-name-input-enhanced"
              />
              <button onClick={handleSave} className="save-btn-enhanced">
                <Save size={14} /> Lưu vào bộ sưu tập
              </button>
            </div>
          </div>

          {/* ── Cột phải: Instance list + controls ───────────────────────── */}
          <div
            className="right-controls-col"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "visible",
              maxHeight: "none",
              paddingRight: 4,
            }}
          >
            <InstanceList
              instances={instances}
              activeInstanceId={activeInstanceId}
              onActiveInstance={setActiveInstanceId}
              onRemove={handleRemove}
            />
            <InstanceControls
              active={activeInstance}
              onPatch={handlePatch}
              onRemove={handleRemove}
              onResetAll={resetAll}
            />
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && <div className="toast-message-enhanced">{toast}</div>}

      {/* ── Styles ─────────────────────────────────────────────────────────── */}
      <style jsx>{`
        .plant-lab-container {
          scrollbar-width: thin;
          scrollbar-color: #6a9a4a #1a2a1a;
        }
        .plant-lab-container ::-webkit-scrollbar { width: 6px; height: 6px; }
        .plant-lab-container ::-webkit-scrollbar-track { background: #1a2a1a; border-radius: 4px; }
        .plant-lab-container ::-webkit-scrollbar-thumb { background: #6a9a4a; border-radius: 4px; }

        .module-library {
          background: rgba(6, 12, 6, 0.55);
          backdrop-filter: blur(2px);
          border-radius: 24px;
          padding: 16px;
          border: 1px solid rgba(100, 140, 70, 0.3);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }

        .preview-card-enhanced {
          background: rgba(10, 20, 10, 0.75);
          border: 1px solid rgba(120, 180, 80, 0.4);
          border-radius: 24px;
          padding: 16px;
          backdrop-filter: blur(4px);
        }

        .preview-header-enhanced {
          font-size: 10px;
          color: #9bc48a;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }

        .module-stats-badge-enhanced {
          font-size: 10px;
          color: #c8ffb0;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          justify-content: center;
          background: rgba(0,0,0,0.5);
          padding: 6px;
          border-radius: 20px;
        }

        .stats-panel-enhanced,
        .effect-panel-enhanced {
          background: rgba(6, 16, 6, 0.7);
          border: 1px solid rgba(80, 140, 60, 0.4);
          border-radius: 20px;
          padding: 16px;
        }

        .effect-badge-enhanced {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 40px;
          border: 1px solid;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .divider-light-enhanced {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 12px 0;
        }

        .save-area-enhanced {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .plant-name-input-enhanced {
          width: 100%;
          padding: 12px 16px;
          border-radius: 40px;
          border: 1px solid rgba(170, 130, 70, 0.6);
          background: rgba(20, 28, 16, 0.9);
          color: #eeddbb;
          font-size: 13px;
          outline: none;
          transition: 0.2s;
          box-sizing: border-box;
        }

        .plant-name-input-enhanced:focus {
          border-color: #c8a870;
          box-shadow: 0 0 6px #c8a87055;
        }

        .save-btn-enhanced {
          background: linear-gradient(135deg, #4a6a3a, #2c4422);
          border: none;
          border-radius: 40px;
          padding: 10px 16px;
          color: #f5efd0;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.2s;
        }

        .save-btn-enhanced:hover {
          background: #5e804a;
          transform: scale(0.98);
        }

        .toast-message-enhanced {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: #1c2a18e6;
          backdrop-filter: blur(8px);
          border: 1px solid #8bc46a;
          border-radius: 60px;
          padding: 8px 24px;
          font-size: 13px;
          font-weight: 600;
          color: #eaffd0;
          z-index: 9999;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 4px 12px black;
        }

        .expanded-mode { padding: 8px !important; }
        .expanded-mode .lab-main-grid { gap: 12px; }
        .expanded-mode .module-library,
        .expanded-mode .preview-card-enhanced,
        .expanded-mode .stats-panel-enhanced,
        .expanded-mode .effect-panel-enhanced,
        .expanded-mode .save-area-enhanced { padding: 12px; }

        @media (max-width: 900px) {
          .lab-main-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .module-picker-col,
          .right-controls-col {
            max-height: none !important;
            overflow-y: visible !important;
          }
          .expanded-mode {
            height: auto !important;
            min-height: 100vh !important;
          }
        }
      `}</style>
    </div>
  );
}