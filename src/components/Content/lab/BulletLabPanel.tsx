"use client";
// src/components/Content/lab/BulletLabPanel.tsx

import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { useMapStore } from "@/stores/useMapStore";
import {
  Save, Target, RotateCcw, Plus, Trash2, Eye, EyeOff,
  ZoomIn, ZoomOut, RotateCw, Layers, Sparkles, Move,
} from "lucide-react";
import {
  BULLET_MODULES,
  BULLET_MODULE_LABELS,
  BULLET_MODULE_ORDER,
  drawBulletOnCanvas,
  calcBulletStats,
  findBulletModuleDef,
  type BulletModuleType,
  type PlacedBulletModule,
} from "@/constants/bulletModules";

// ─── Constants ────────────────────────────────────────────────────────────────

const PREVIEW_W = 340;
const PREVIEW_H = 120;
const BULLET_CANVAS_SCALE = 1.0;

let _bulletCounter = 0;
function newBulletInstanceId(): string {
  return `binst_${Date.now()}_${++_bulletCounter}`;
}

const DEFAULT_INST: Omit<PlacedBulletModule, "instanceId" | "type" | "moduleId"> = {
  offsetX: 0,
  offsetY: 0,
  scale: 1.0,
  rotationOffset: 0,
  visible: true,
  zIndex: 5,
  colorOverride: "",
  opacity: 1,
  spinSpeed: 0,
  pulseRate: 0,
  trailLength: 20,
};

// ─── BulletModuleGrid ─────────────────────────────────────────────────────────

function BulletModuleGrid({
  type,
  onAdd,
}: {
  type: BulletModuleType;
  onAdd: (type: BulletModuleType, moduleId: string) => void;
}) {
  const modules = BULLET_MODULES[type];
  const previewCanvases = useRef<Record<string, HTMLCanvasElement | null>>({});
  const rafRefs = useRef<Record<string, number>>({});
  const frameRefs = useRef<Record<string, number>>({});

  useEffect(() => {
    modules.forEach((mod) => {
      const canvas = previewCanvases.current[mod.id];
      if (!canvas) return;

      const singleInst: PlacedBulletModule = {
        ...DEFAULT_INST,
        instanceId: `preview_${mod.id}`,
        type: mod.type,
        moduleId: mod.id,
        scale: 0.7,
        spinSpeed: mod.defaultSpinSpeed,
        pulseRate: mod.defaultPulseRate,
        zIndex: 1,
      };

      const loop = () => {
        frameRefs.current[mod.id] = (frameRefs.current[mod.id] ?? 0) + 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#060c06";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          drawBulletOnCanvas(
            ctx,
            [singleInst],
            canvas.width / 2,
            canvas.height / 2,
            frameRefs.current[mod.id],
            BULLET_CANVAS_SCALE,
            1,
          );
        }
        rafRefs.current[mod.id] = requestAnimationFrame(loop);
      };

      rafRefs.current[mod.id] = requestAnimationFrame(loop);
    });

    return () => {
      Object.values(rafRefs.current).forEach((id) => cancelAnimationFrame(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11, fontWeight: 600, color: "#9ca3af",
          textTransform: "uppercase", letterSpacing: "0.05em",
          marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <span>{BULLET_MODULE_LABELS[type]}</span>
        <span style={{ fontSize: 9, color: "#4b5563", fontWeight: 400, marginLeft: "auto" }}>
          {modules.length} lựa chọn
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))",
          gap: 6,
        }}
      >
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => onAdd(type, mod.id)}
            title={mod.description}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "6px 4px", borderRadius: 8,
              border: "1.5px solid rgba(107,76,30,0.3)",
              background: "rgba(38,24,10,0.4)",
              cursor: "pointer", transition: "all 0.15s",
              color: "#c8a870", position: "relative",
            }}
          >
            <canvas
              ref={(el) => { previewCanvases.current[mod.id] = el; }}
              width={48}
              height={48}
              style={{ borderRadius: 6, display: "block" }}
            />
            <span style={{ fontSize: 9, fontWeight: 500, textAlign: "center", marginTop: 4 }}>
              {mod.label}
            </span>
            <div style={{ display: "flex", gap: 3, marginTop: 3, fontSize: 8, color: "#6b7280" }}>
              <span style={{ color: "#ef4444" }}>+{mod.dmgBonus}</span>
              <span style={{ color: "#3b82f6" }}>+{mod.speedBonus}</span>
            </div>
            <div
              style={{
                position: "absolute", top: 3, right: 3,
                background: "rgba(59,130,246,0.2)", borderRadius: "50%",
                width: 14, height: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Plus size={8} color="#93c5fd" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── BulletPreview ────────────────────────────────────────────────────────────

function BulletPreview({ instances }: { instances: PlacedBulletModule[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const instancesRef = useRef(instances);

  useEffect(() => { instancesRef.current = instances; }, [instances]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SPEED = 1.8;
    const loop = () => {
      frameRef.current++;
      const t = frameRef.current;
      const bx = ((t * SPEED) % (PREVIEW_W + 100)) - 50;

      ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
      ctx.fillStyle = "#030a03";
      ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

      // Flight path
      ctx.strokeStyle = "rgba(110,231,183,0.06)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(0, PREVIEW_H / 2);
      ctx.lineTo(PREVIEW_W, PREVIEW_H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (instancesRef.current.length > 0) {
        drawBulletOnCanvas(
          ctx,
          instancesRef.current,
          bx,
          PREVIEW_H / 2,
          t,
          BULLET_CANVAS_SCALE,
          1,
        );
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Thêm module để xem preview →", PREVIEW_W / 2, PREVIEW_H / 2);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={PREVIEW_W}
      height={PREVIEW_H}
      style={{
        borderRadius: 10,
        display: "block",
        width: "100%",
        border: "1px solid rgba(110,231,183,0.2)",
        background: "#030a03",
      }}
    />
  );
}

// ─── Instance List ────────────────────────────────────────────────────────────

function BulletInstanceList({
  instances,
  activeInstanceId,
  onActiveInstance,
  onRemove,
}: {
  instances: PlacedBulletModule[];
  activeInstanceId: string | null;
  onActiveInstance: (id: string | null) => void;
  onRemove: (id: string) => void;
}) {
  if (instances.length === 0) return null;
  return (
    <div
      style={{
        background: "rgba(10,16,10,0.6)",
        border: "1px solid rgba(80,140,60,0.3)",
        borderRadius: 12, padding: 12,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: 8 }}>
        Các lớp ({instances.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
        {instances.map((inst) => {
          const def = findBulletModuleDef(inst.moduleId);
          const isActive = activeInstanceId === inst.instanceId;
          return (
            <div
              key={inst.instanceId}
              onClick={() => onActiveInstance(isActive ? null : inst.instanceId)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 8px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${isActive ? "rgba(59,130,246,0.5)" : "rgba(107,76,30,0.25)"}`,
                background: isActive ? "rgba(59,130,246,0.1)" : "rgba(38,24,10,0.3)",
              }}
            >
              <div
                style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: inst.colorOverride || def?.defaultColor || "#86efac",
                  flexShrink: 0, border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: isActive ? "#93c5fd" : "#c8a870", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {def?.label ?? inst.moduleId}
                </div>
                <div style={{ fontSize: 9, color: "#4b5563" }}>
                  {BULLET_MODULE_LABELS[inst.type]} · z:{inst.zIndex} · {Math.round(inst.opacity * 100)}%
                </div>
              </div>
              {!inst.visible && <EyeOff size={10} color="#4b5563" />}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(inst.instanceId); }}
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

// ─── SliderRow ───────────────────────────────────────────────────────────────

function SliderRow({
  label, value, min, max, step, onChange, unit = "",
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "#9ca3af" }}>{label}</span>
        <span style={{ fontSize: 10, color: "#c8a870" }}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
      />
    </div>
  );
}

// ─── Instance Controls ────────────────────────────────────────────────────────

function BulletInstanceControls({
  active,
  onPatch,
  onRemove,
  onResetAll,
}: {
  active: PlacedBulletModule | null;
  onPatch: (instanceId: string, patch: Partial<PlacedBulletModule>) => void;
  onRemove: (instanceId: string) => void;
  onResetAll: () => void;
}) {
  const def = active ? findBulletModuleDef(active.moduleId) : null;

  return (
    <div style={{ background: "rgba(10,16,10,0.6)", border: "1px solid rgba(80,140,60,0.3)", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          <Move size={12} /> Điều chỉnh
        </div>
        <button
          onClick={onResetAll}
          style={{ background: "transparent", border: "1px solid rgba(107,76,30,0.4)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#c8a870", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <RotateCcw size={10} /> Xóa tất cả
        </button>
      </div>

      {active && def ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "#6ee7b7", fontWeight: 600 }}>
              {BULLET_MODULE_LABELS[active.type]}: {def.label}
            </span>
            <button
              onClick={() => onRemove(active.instanceId)}
              style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Trash2 size={10} /> Xóa
            </button>
          </div>

          {/* Color override */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>Màu sắc</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="color"
                  value={active.colorOverride || def.defaultColor}
                  onChange={(e) => onPatch(active.instanceId, { colorOverride: e.target.value })}
                  style={{ width: 28, height: 20, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 0 }}
                />
                {active.colorOverride && (
                  <button
                    onClick={() => onPatch(active.instanceId, { colorOverride: "" })}
                    style={{ fontSize: 9, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <SliderRow label="Kích cỡ" value={Math.round(active.scale * 100)} min={20} max={300} step={5}
            onChange={(v) => onPatch(active.instanceId, { scale: v / 100 })} unit="%" />

          <SliderRow label="Độ trong" value={Math.round(active.opacity * 100)} min={10} max={100} step={5}
            onChange={(v) => onPatch(active.instanceId, { opacity: v / 100 })} unit="%" />

          {/* Spin speed */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                <RotateCw size={10} /> Tốc độ xoay
              </span>
              <span style={{ fontSize: 10, color: "#c8a870" }}>{active.spinSpeed.toFixed(1)}°/f</span>
            </div>
            <input
              type="range" min={0} max={12} step={0.5} value={active.spinSpeed}
              onChange={(e) => onPatch(active.instanceId, { spinSpeed: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#a78bfa", cursor: "pointer" }}
            />
            <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
              {[0, 1, 2, 4, 8].map((v) => (
                <button
                  key={v}
                  onClick={() => onPatch(active.instanceId, { spinSpeed: v })}
                  style={{
                    flex: 1, padding: "3px 0", fontSize: 9, borderRadius: 4,
                    border: `1px solid ${active.spinSpeed === v ? "rgba(167,139,250,0.6)" : "rgba(107,76,30,0.35)"}`,
                    background: active.spinSpeed === v ? "rgba(167,139,250,0.15)" : "rgba(38,24,10,0.5)",
                    color: active.spinSpeed === v ? "#a78bfa" : "#c8a870", cursor: "pointer",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Pulse rate */}
          <SliderRow label="Nhịp đập (0=tắt)" value={active.pulseRate} min={0} max={120} step={5}
            onChange={(v) => onPatch(active.instanceId, { pulseRate: v })} unit="f" />

          {/* Trail length (only for trail type) */}
          {active.type === "trail" && (
            <SliderRow label="Độ dài vệt" value={active.trailLength} min={0} max={50} step={2}
              onChange={(v) => onPatch(active.instanceId, { trailLength: v })} />
          )}

          {/* Rotation offset */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>Xoay gốc</span>
              <span style={{ fontSize: 10, color: "#c8a870" }}>{active.rotationOffset}°</span>
            </div>
            <input
              type="range" min={-180} max={180} step={1} value={active.rotationOffset}
              onChange={(e) => onPatch(active.instanceId, { rotationOffset: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#a78bfa", cursor: "pointer" }}
            />
          </div>

          {/* Z-index */}
          <SliderRow label="Lớp (z-index)" value={active.zIndex} min={1} max={20} step={1}
            onChange={(v) => onPatch(active.instanceId, { zIndex: v })} />

          {/* Offset */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 6 }}>
              Lệch tâm (x:{Math.round(active.offsetX)}, y:{Math.round(active.offsetY)})
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[
                { label: "← Trái", dx: -3, dy: 0 }, { label: "Phải →", dx: 3, dy: 0 },
                { label: "↑ Lên", dx: 0, dy: -3 },  { label: "↓ Xuống", dx: 0, dy: 3 },
              ].map(({ label, dx, dy }) => (
                <button
                  key={label}
                  onClick={() => onPatch(active.instanceId, { offsetX: active.offsetX + dx, offsetY: active.offsetY + dy })}
                  style={{ padding: "4px 0", fontSize: 10, borderRadius: 4, border: "1px solid rgba(107,76,30,0.35)", background: "rgba(38,24,10,0.5)", color: "#c8a870", cursor: "pointer" }}
                >
                  {label}
                </button>
              ))}
            </div>
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
          Click vào lớp để chỉnh sửa
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BulletLabPanel() {
  const { saveBullet } = useMapStore();

  const [instances, setInstances] = useState<PlacedBulletModule[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bulletName, setBulletName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const handleAddModule = useCallback((type: BulletModuleType, moduleId: string) => {
    const def = findBulletModuleDef(moduleId);
    const newInst: PlacedBulletModule = {
      ...DEFAULT_INST,
      instanceId: newBulletInstanceId(),
      type,
      moduleId,
      spinSpeed: def?.defaultSpinSpeed ?? 0,
      pulseRate: def?.defaultPulseRate ?? 0,
      zIndex: type === "glow" ? 1 : type === "trail" ? 2 : type === "shell" ? 3 : type === "core" ? 4 : 5,
    };
    setInstances((prev) => [...prev, newInst]);
    setActiveId(newInst.instanceId);
  }, []);

  const handlePatch = useCallback((instanceId: string, patch: Partial<PlacedBulletModule>) => {
    setInstances((prev) =>
      prev.map((inst) => inst.instanceId === instanceId ? { ...inst, ...patch } : inst)
    );
  }, []);

  const handleRemove = useCallback((instanceId: string) => {
    setInstances((prev) => prev.filter((inst) => inst.instanceId !== instanceId));
    setActiveId((prev) => (prev === instanceId ? null : prev));
  }, []);

  const resetAll = useCallback(() => {
    setInstances([]);
    setActiveId(null);
  }, []);

  const activeInstance = useMemo(
    () => instances.find((i) => i.instanceId === activeId) ?? null,
    [instances, activeId],
  );

  const stats = useMemo(() => calcBulletStats(instances), [instances]);

  const handleSave = useCallback(() => {
    if (instances.length === 0) { showToast("Thêm ít nhất 1 module!"); return; }
    const name = bulletName.trim() || `Đạn #${Date.now() % 10000}`;
    saveBullet({
      name,
      layoutJson: JSON.stringify(instances),
      primaryColor: stats.primaryColor,
      dmg: stats.dmg,
      speed: stats.speed,
      radius: stats.radius,
    });
    showToast(`✅ Đã lưu "${name}"!`);
    setBulletName("");
  }, [instances, stats, bulletName, saveBullet, showToast]);

  return (
    <div style={{ color: "#c8a870", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* 3-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(240px, 1fr) minmax(280px, 1.2fr) minmax(260px, 1fr)",
          gap: 16,
        }}
      >
        {/* Left: Module picker */}
        <div
          style={{
            background: "rgba(6,12,6,0.55)", borderRadius: 24, padding: 16,
            border: "1px solid rgba(100,140,70,0.3)",
            maxHeight: "calc(100vh - 200px)", overflowY: "auto",
          }}
        >
          <div style={{ fontSize: 10, color: "#b9c4a8", marginBottom: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.4)", padding: "5px 10px", borderRadius: 20, width: "fit-content" }}>
            <Plus size={10} /> Click để thêm lớp đạn
          </div>
          {BULLET_MODULE_ORDER.map((type) => (
            <BulletModuleGrid key={type} type={type} onAdd={handleAddModule} />
          ))}
        </div>

        {/* Center: Preview + Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Preview card */}
          <div style={{ background: "rgba(10,20,10,0.75)", border: "1px solid rgba(120,180,80,0.4)", borderRadius: 24, padding: 16 }}>
            <div style={{ fontSize: 10, color: "#9bc48a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={11} /> Preview bay thực tế
            </div>
            <BulletPreview instances={instances} />
            <div style={{ fontSize: 10, color: "#c8ffb0", display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "5px", borderRadius: 20 }}>
              <Sparkles size={10} />
              {instances.length} lớp · {instances.filter((i) => i.visible).length} hiển thị
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: "rgba(6,16,6,0.7)", border: "1px solid rgba(80,140,60,0.4)", borderRadius: 20, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#b0aa80", marginBottom: 10 }}>📊 Chỉ số đạn</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Sát thương", value: stats.dmg, color: "#ef4444" },
                { label: "Tốc độ",     value: stats.speed, color: "#3b82f6" },
                { label: "Bán kính",   value: stats.radius, color: "#f59e0b" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: "center", background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "8px 4px" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: stats.primaryColor, border: "1px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "#9ca3af" }}>Màu chính: {stats.primaryColor}</span>
            </div>
          </div>

          {/* Name + Save */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={bulletName}
              onChange={(e) => setBulletName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="💥 Đặt tên cho đạn..."
              style={{
                width: "100%", padding: "11px 16px", borderRadius: 40,
                border: "1px solid rgba(170,130,70,0.6)",
                background: "rgba(20,28,16,0.9)", color: "#eeddbb",
                fontSize: 13, outline: "none", boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleSave}
              style={{
                background: "linear-gradient(135deg, #4a6a3a, #2c4422)",
                border: "none", borderRadius: 40, padding: "10px 16px",
                color: "#f5efd0", fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: "pointer",
              }}
            >
              <Save size={14} /> Lưu thiết kế đạn
            </button>
          </div>
        </div>

        {/* Right: Instance list + controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          <BulletInstanceList
            instances={instances}
            activeInstanceId={activeId}
            onActiveInstance={setActiveId}
            onRemove={handleRemove}
          />
          <BulletInstanceControls
            active={activeInstance}
            onPatch={handlePatch}
            onRemove={handleRemove}
            onResetAll={resetAll}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "#1c2a18e6", backdropFilter: "blur(8px)", border: "1px solid #8bc46a", borderRadius: 60, padding: "8px 24px", fontSize: 13, fontWeight: 600, color: "#eaffd0", zIndex: 9999, whiteSpace: "nowrap", pointerEvents: "none" }}>
          {toast}
        </div>
      )}

      {/* Responsive */}
      <style jsx>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}