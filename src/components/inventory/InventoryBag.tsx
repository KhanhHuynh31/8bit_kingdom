"use client";

import {
  useEffect, useRef, useCallback, useState, useMemo,
} from "react";
import Image from "next/image";
import { useMapStore } from "@/stores/useMapStore";
import {
  ALL_DECOS, DecoBuilding,
  RARITY_COLOR, RARITY_GLOW, RARITY_LABEL,
} from "@/constants/decorationData";
import { PlacedDecoration } from "@/stores/slices/gachaSlice";
import { Camera } from "@/stores/types";
import { BUILDINGS, TILE_SIZE } from "@/constants/map";
import { worldToScreen, screenToWorld } from "@/utils/coords";
import { ShoppingBag, X, Trash2, Package } from "lucide-react";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:     "rgba(11,13,19,0.97)",
  bgCard: "rgba(20,17,10,0.95)",
  border: "rgba(180,140,60,0.28)",
  amber:  "#d4a843",
  amberD: "rgba(212,168,67,0.12)",
  text:   "#e8dfc8",
  muted:  "#8a7d5a",
  scroll: "#c4a484",
  red:    "#e05555",
  redD:   "rgba(224,85,85,0.12)",
};

// ─── Inventory Panel ──────────────────────────────────────────────────────────

function InventoryPanel({
  inventory, placingId, onStartPlace, onClose,
}: {
  inventory: Record<string, number>;
  placingId: string | null;
  onStartPlace: (id: string) => void;
  onClose: () => void;
}) {
  const owned = useMemo(
    () => ALL_DECOS.filter((d) => (inventory[d.id] ?? 0) > 0),
    [inventory],
  );

  return (
    <div style={{
      position: "absolute", top: 64, left: 16,
      width: 260, maxHeight: "calc(100vh - 100px)",
      background: C.bg, border: `1.5px solid ${C.border}`,
      borderRadius: 6, overflow: "hidden",
      boxShadow: `0 0 24px ${C.amberD}, 0 12px 40px rgba(0,0,0,.85)`,
      display: "flex", flexDirection: "column",
      pointerEvents: "auto", zIndex: 300,
    }}>
      <div style={{ height: 4, background: C.scroll, flexShrink: 0 }} />

      {/* Header */}
      <div style={{
        padding: "10px 14px 8px", flexShrink: 0,
        background: C.amberD, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 6, left: 6, width: 8, height: 8, borderTop: `1.5px solid ${C.amber}`, borderLeft: `1.5px solid ${C.amber}` }} />
        <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderTop: `1.5px solid ${C.amber}`, borderRight: `1.5px solid ${C.amber}` }} />

        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <ShoppingBag size={13} style={{ color: C.amber }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: ".1em" }}>
            Túi Đồ
          </span>
          <span style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "0 6px", fontSize: 9, color: C.muted,
          }}>
            {owned.length} loại
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Hint khi đang placing */}
      {placingId && (
        <div style={{
          padding: "6px 12px", background: "rgba(212,168,67,.1)",
          borderBottom: `1px solid ${C.border}`,
          fontSize: 9, color: C.amber, textAlign: "center",
          animation: "pulseBag 1.5s ease-in-out infinite",
        }}>
          📍 Click vào ô trống trên map để đặt công trình
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {owned.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 12 }}>
            <Package size={24} style={{ margin: "0 auto 8px", opacity: .4 }} />
            Chưa có công trình nào<br />
            <span style={{ fontSize: 9 }}>Thử cầu nguyện tại Cổng Triệu Hồi</span>
          </div>
        ) : (
          owned.map((deco) => (
            <DecoItem
              key={deco.id}
              deco={deco}
              count={inventory[deco.id]}
              isSelecting={placingId === deco.id}
              onSelect={() => onStartPlace(deco.id)}
            />
          ))
        )}
      </div>

      <div style={{ height: 4, background: C.scroll, flexShrink: 0 }} />

      <style>{`
        @keyframes pulseBag { 0%,100%{opacity:1} 50%{opacity:.55} }
      `}</style>
    </div>
  );
}

function DecoItem({
  deco, count, isSelecting, onSelect,
}: { deco: DecoBuilding; count: number; isSelecting: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "6px 8px", borderRadius: 4, cursor: "pointer",
        border: `1.5px solid ${isSelecting ? RARITY_COLOR[deco.rarity] : C.border}`,
        background: isSelecting ? `${RARITY_COLOR[deco.rarity]}15` : C.bgCard,
        transition: "all .15s",
        boxShadow: isSelecting ? `0 0 12px ${RARITY_GLOW[deco.rarity]}` : "none",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 4, overflow: "hidden", flexShrink: 0,
        border: `1.5px solid ${RARITY_COLOR[deco.rarity]}`,
        boxShadow: `0 0 8px ${RARITY_GLOW[deco.rarity]}`,
        background: C.bg, position: "relative",
      }}>
        <Image src={deco.cardSrc} alt={deco.name} fill unoptimized style={{ objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {deco.name}
        </div>
        <div style={{ fontSize: 9, color: RARITY_COLOR[deco.rarity], letterSpacing: 1, marginTop: 1 }}>
          {RARITY_LABEL[deco.rarity]}
        </div>
        <div style={{ fontSize: 8, color: C.muted, marginTop: 1 }}>
          {deco.tileW}×{deco.tileH} ô
        </div>
      </div>
      <div style={{
        minWidth: 28, height: 28, borderRadius: "50%",
        background: C.bg, border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, color: C.amber, flexShrink: 0,
      }}>
        {count}
      </div>
    </div>
  );
}

// ─── Delete popup — hiện ngay trên đầu công trình ────────────────────────────

function DeletePopup({
  name, screenX, screenY,
  onRemove, onClose,
}: {
  name: string;
  screenX: number;
  screenY: number;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <div
      // Dùng fixed để popup không bị ảnh hưởng bởi transform của parent
      style={{
        position: "fixed",
        left: screenX,
        top: screenY,
        transform: "translate(-50%, -100%)",
        marginTop: -10,
        pointerEvents: "auto",
        zIndex: 9000,
      }}
    >
      <div style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,.9)",
        minWidth: 150,
      }}>
        {/* Tên + nút đóng */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "7px 10px 6px",
          borderBottom: `1px solid ${C.border}`,
          gap: 6,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: C.text,
            maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </span>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.muted, display: "flex", padding: 0, flexShrink: 0,
            }}
          >
            <X size={11} />
          </button>
        </div>

        {/* Nút xóa */}
        <div style={{ padding: "8px 10px" }}>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              width: "100%", padding: "8px 0",
              borderRadius: 5,
              border: `1px solid rgba(224,85,85,0.5)`,
              background: C.redD,
              color: C.red,
              fontSize: 11, fontWeight: 700,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Trash2 size={12} />
            Thu hồi
          </button>
        </div>
      </div>

      {/* Caret chỉ xuống */}
      <div style={{
        width: 0, height: 0, margin: "0 auto",
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderTop: `6px solid ${C.border}`,
      }} />

      <style>{`
        @keyframes popUp {
          from { opacity: 0; transform: translate(-50%, -95%); }
          to   { opacity: 1; transform: translate(-50%, -100%) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

// ─── Placed deco on map ───────────────────────────────────────────────────────

function PlacedDecoOnMap({
  placed, camera, containerW, containerH,
  isMoving, isSelected, instanceId,
  onPointerDown, onClick,
}: {
  placed: PlacedDecoration;
  camera: Camera; containerW: number; containerH: number;
  isMoving: boolean; isSelected: boolean; instanceId: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  const deco = useMemo(() => ALL_DECOS.find((d) => d.id === placed.decoId), [placed.decoId]);
  const st   = TILE_SIZE * camera.zoom;
  const { x, y } = worldToScreen(placed.worldX, placed.worldY, camera, containerW / 2, containerH / 2);
  const w = placed.tileW * st;
  const h = placed.tileH * st;

  if (!deco) return null;

  return (
    <div
      data-placed-deco={instanceId}
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{
        position: "absolute",
        left: x, top: y, width: w, height: h,
        cursor: isMoving ? "grabbing" : "pointer",
        zIndex: 140,
        outline: isSelected ? `2px solid ${C.amber}` : "none",
        outlineOffset: 2,
        boxShadow: isMoving ? `0 0 20px rgba(212,168,67,.25)` : "none",
        opacity: isMoving ? 0.7 : 1,
        transition: "opacity .15s",
        userSelect: "none",
      }}
    >
      <Image
        src={deco.imageSrc}
        alt={deco.name}
        fill
        unoptimized
        draggable={false}
        style={{ objectFit: "contain", imageRendering: "pixelated", pointerEvents: "none" }}
      />
    </div>
  );
}

// ─── Ghost preview ────────────────────────────────────────────────────────────

function GhostPreview({
  decoId, tileW, tileH, worldX, worldY,
  camera, containerW, containerH, valid,
}: {
  decoId: string; tileW: number; tileH: number;
  worldX: number; worldY: number;
  camera: Camera; containerW: number; containerH: number;
  valid: boolean;
}) {
  const deco = useMemo(() => ALL_DECOS.find((d) => d.id === decoId), [decoId]);
  const st   = TILE_SIZE * camera.zoom;
  const { x, y } = worldToScreen(worldX, worldY, camera, containerW / 2, containerH / 2);
  if (!deco) return null;

  return (
    <div style={{
      position: "absolute",
      left: x, top: y, width: tileW * st, height: tileH * st,
      border: `2px dashed ${valid ? C.amber : C.red}`,
      background: valid ? "rgba(212,168,67,.12)" : "rgba(224,85,85,.12)",
      borderRadius: 3, pointerEvents: "none", zIndex: 141,
    }}>
      <Image
        src={deco.imageSrc} alt=""
        fill unoptimized draggable={false}
        style={{ objectFit: "contain", imageRendering: "pixelated", opacity: .5 }}
      />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface InventoryBagProps {
  camera: Camera;
  width: number;
  height: number;
}

export default function InventoryBag({ camera, width, height }: InventoryBagProps) {
  const {
    inventory, placedDecos,
    placeDecoration, moveDecoration, removeDecoration,
  } = useMapStore();

  const [bagOpen,    setBagOpen]    = useState(false);
  const [placingId,  setPlacingId]  = useState<string | null>(null);
  const [movingId,   setMovingId]   = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ghostPos,   setGhostPos]   = useState<{ x: number; y: number } | null>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout>>(
    undefined as unknown as ReturnType<typeof setTimeout>,
  );
  // Track nếu đây là hold-drag (không mở popup sau khi thả)
  const isHolding = useRef(false);

  // ── Active deco meta ──────────────────────────────────────────────────────
  const activeDeco = useMemo(() => {
    const id = placingId
      ?? (movingId ? placedDecos.find((p) => p.instanceId === movingId)?.decoId : null);
    return id ? ALL_DECOS.find((d) => d.id === id) : null;
  }, [placingId, movingId, placedDecos]);

  // ── Ghost validity check ──────────────────────────────────────────────────
  // Dùng cùng hàm rectsOverlap với gachaSlice để đảm bảo nhất quán.
  const ghostValid = useMemo(() => {
    if (!ghostPos || !activeDeco) return false;
    const ax = ghostPos.x, ay = ghostPos.y;
    const aw = activeDeco.tileW, ah = activeDeco.tileH;

    /** Hai rect chồng nhau không? (integer tile coords, no tolerance) */
    const hits = (bx: number, by: number, bw: number, bh: number) =>
      ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

    // 1. Kiểm tra chồng với các deco đã đặt
    const overPlaced = placedDecos.some((p) => {
      if (movingId && p.instanceId === movingId) return false;
      return hits(p.worldX, p.worldY, p.tileW, p.tileH);
    });
    if (overPlaced) return false;

    // 2. Kiểm tra chồng với BUILDINGS tĩnh
    // BUILDINGS có thể là nhiều kiểu khác nhau — chỉ xét những item có đủ
    // worldX, worldY, width, height (bỏ qua item không phải building thật).
    const overBuilding = BUILDINGS.some((b: unknown) => {
      const bb = b as Record<string, unknown>;
      const bx = bb.worldX, by = bb.worldY, bw = bb.width, bh = bb.height;
      if (typeof bx !== "number" || typeof by !== "number" ||
          typeof bw !== "number" || typeof bh !== "number") return false;
      return hits(bx, by, bw, bh);
    });
    return !overBuilding;
  }, [ghostPos, activeDeco, placedDecos, movingId]);

  // ── Popup position — computed directly (not memo) so it's always live ────
  const selectedPlaced = placedDecos.find((p) => p.instanceId === selectedId) ?? null;

  // Tính screen position của popup từ world coords của công trình được chọn
  // Tính inline mỗi render để luôn follow camera pan/zoom
  let popupScreenX = 0;
  let popupScreenY = 0;
  if (selectedPlaced) {
    const st = TILE_SIZE * camera.zoom;
    const { x, y } = worldToScreen(
      selectedPlaced.worldX, selectedPlaced.worldY,
      camera, width / 2, height / 2,
    );
    // Căn giữa theo chiều ngang, neo phía trên công trình
    popupScreenX = x + (selectedPlaced.tileW * st) / 2;
    popupScreenY = y;
  }

  // ── Map mouse/click listeners (for ghost placing) ─────────────────────────
  const handleMapMouseMove = useCallback((e: MouseEvent) => {
    if (!activeDeco || (!placingId && !movingId)) return;
    const el = document.getElementById("world-map-container");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const world = screenToWorld(
      e.clientX - rect.left, e.clientY - rect.top,
      camera, width / 2, height / 2,
    );
    setGhostPos({
      x: Math.round(world.x - activeDeco.tileW / 2),
      y: Math.round(world.y - activeDeco.tileH / 2),
    });
  }, [activeDeco, placingId, movingId, camera, width, height]);

  const handleMapClick = useCallback((e: MouseEvent) => {
    // Nếu click vào một placed deco thì bỏ qua (handled riêng)
    const target = e.target as HTMLElement;
    if (target.closest("[data-placed-deco]")) return;

    if (!ghostPos || !activeDeco || !ghostValid) return;

    if (placingId) {
      const ok = placeDecoration(placingId, ghostPos.x, ghostPos.y);
      if (ok) { setPlacingId(null); setGhostPos(null); }
    } else if (movingId) {
      const ok = moveDecoration(movingId, ghostPos.x, ghostPos.y);
      if (ok) { setMovingId(null); setGhostPos(null); }
    }
  }, [ghostPos, activeDeco, ghostValid, placingId, movingId, placeDecoration, moveDecoration]);

  useEffect(() => {
    const el = document.getElementById("world-map-container");
    if (!el) return;
    el.addEventListener("mousemove", handleMapMouseMove);
    el.addEventListener("click", handleMapClick);
    return () => {
      el.removeEventListener("mousemove", handleMapMouseMove);
      el.removeEventListener("click", handleMapClick);
    };
  }, [handleMapMouseMove, handleMapClick]);

  // ── ESC to cancel ─────────────────────────────────────────────────────────
  const cancelAction = useCallback(() => {
    setPlacingId(null); setMovingId(null); setGhostPos(null);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") { cancelAction(); setSelectedId(null); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [cancelAction]);

  // ── Click-outside to dismiss popup ───────────────────────────────────────
  // Dùng "click" thay vì "mousedown" để không conflict với placed-deco onClick
  useEffect(() => {
    if (!selectedId) return;
    const fn = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // Không đóng nếu click vào popup hoặc chính công trình đang selected
      if (t.closest("[data-delete-popup]")) return;
      if (t.closest(`[data-placed-deco="${selectedId}"]`)) return;
      setSelectedId(null);
    };
    // Slight delay để không bị dismiss ngay bởi click mở popup
    const id = setTimeout(() => window.addEventListener("click", fn), 10);
    return () => { clearTimeout(id); window.removeEventListener("click", fn); };
  }, [selectedId]);

  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* ── Bag icon ── */}
      <div style={{
        position: "absolute", top: 16, left: 16,
        zIndex: 400, pointerEvents: "auto",
      }}>
        <button
          onClick={() => setBagOpen((v) => !v)}
          style={{
            width: 40, height: 40,
            background: "rgba(0,0,0,.8)",
            border: `1px solid ${bagOpen ? C.amber : "rgba(255,255,255,.12)"}`,
            borderRadius: 10, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: bagOpen ? `0 0 12px ${C.amberD}` : "none",
            transition: "all .2s", position: "relative",
          }}
        >
          <ShoppingBag size={18} style={{ color: bagOpen ? C.amber : "rgba(255,255,255,.45)" }} />
          {totalItems > 0 && (
            <div style={{
              position: "absolute", top: -4, right: -4,
              width: 16, height: 16, borderRadius: "50%",
              background: C.amber, border: "1.5px solid rgba(0,0,0,.8)",
              fontSize: 8, fontWeight: 800, color: "#000",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {totalItems > 99 ? "99+" : totalItems}
            </div>
          )}
        </button>
      </div>

      {/* ── Inventory panel ── */}
      {bagOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 300, pointerEvents: "none" }}>
          <InventoryPanel
            inventory={inventory}
            placingId={placingId}
            onStartPlace={(id) => {
              setPlacingId(id);
              setMovingId(null);
              setSelectedId(null);
            }}
            onClose={() => setBagOpen(false)}
          />
        </div>
      )}

      {/* ── Ghost preview ── */}
      {ghostPos && activeDeco && (placingId || movingId) && (
        <GhostPreview
          decoId={activeDeco.id}
          tileW={activeDeco.tileW} tileH={activeDeco.tileH}
          worldX={ghostPos.x} worldY={ghostPos.y}
          camera={camera} containerW={width} containerH={height}
          valid={ghostValid}
        />
      )}

      {/* ── Cancel hint ── */}
      {(placingId || movingId) && (
        <div
          onClick={cancelAction}
          style={{
            position: "absolute", bottom: 24, left: "50%",
            transform: "translateX(-50%)",
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "6px 16px",
            fontSize: 10, color: C.muted,
            pointerEvents: "auto", zIndex: 300, cursor: "pointer",
          }}
        >
          ESC hoặc nhấn đây để hủy
        </div>
      )}

      {/* ── Placed decos on map ── */}
      {placedDecos.map((p) => (
        <PlacedDecoOnMap
          key={p.instanceId}
          placed={p}
          instanceId={p.instanceId}
          camera={camera}
          containerW={width}
          containerH={height}
          isMoving={movingId === p.instanceId}
          isSelected={selectedId === p.instanceId}
          onPointerDown={(e) => {
            e.stopPropagation();
            isHolding.current = false;
            // Nếu đang placing/moving thì không trigger hold
            if (placingId || movingId) return;
            holdTimer.current = setTimeout(() => {
              isHolding.current = true;
              setSelectedId(null);
              setMovingId(p.instanceId);
              setPlacingId(null);
              setGhostPos(null);
            }, 500);
          }}
          onClick={(e) => {
            e.stopPropagation();
            clearTimeout(holdTimer.current);
            // Đang moving — không làm gì
            if (movingId === p.instanceId) return;
            if (isHolding.current) { isHolding.current = false; return; }
            // Toggle popup
            setSelectedId((prev) => prev === p.instanceId ? null : p.instanceId);
          }}
        />
      ))}

      {/* ── Delete popup — ngay trên đầu công trình ── */}
      {selectedId && selectedPlaced && (
        <DeletePopup
          name={ALL_DECOS.find((d) => d.id === selectedPlaced.decoId)?.name ?? selectedPlaced.decoId}
          screenX={popupScreenX}
          screenY={popupScreenY}
          onRemove={() => {
            removeDecoration(selectedId);
            setSelectedId(null);
          }}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}