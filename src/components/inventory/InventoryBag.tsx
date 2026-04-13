"use client";

/**
 * InventoryBag — Túi đồ & Quản lý công trình trang trí
 * ────────────────────────────────────────────────────────
 * • Icon túi đồ ở góc trái trên HUD.
 * • Mở túi → danh sách công trình đã có.
 * • Kéo thả (hoặc click + click trên map) để đặt công trình.
 * • Công trình đã đặt: click → popup Xóa | giữ → di chuyển.
 * • Không đặt trùng vào ô đã có building.
 */

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
import { ShoppingBag, X, Trash2, Move, Package } from "lucide-react";

// ─── palette ──────────────────────────────────────────────────────────────────
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

interface InventoryPanelProps {
  inventory: Record<string, number>;
  onStartPlace: (decoId: string) => void;
  onClose: () => void;
  placingId: string | null;
}

function InventoryPanel({ inventory, onStartPlace, onClose, placingId }: InventoryPanelProps) {
  const owned = useMemo(() =>
    ALL_DECOS.filter((d) => (inventory[d.id] ?? 0) > 0),
    [inventory]
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
      {/* Scroll top */}
      <div style={{ height: 4, background: C.scroll, flexShrink: 0 }} />

      {/* Header */}
      <div style={{
        padding: "10px 14px 8px", flexShrink: 0,
        background: C.amberD, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative",
      }}>
        {/* Corner ornaments */}
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
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
          <X size={12} />
        </button>
      </div>

      {/* Hint khi đang placing */}
      {placingId && (
        <div style={{
          padding: "6px 12px", background: "rgba(212,168,67,.1)",
          borderBottom: `1px solid ${C.border}`,
          fontSize: 9, color: C.amber, textAlign: "center",
          animation: "pulse 1.5s ease-in-out infinite",
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

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>
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

// ─── Placed deco popup ────────────────────────────────────────────────────────

function PlacedDecoPopup({
  placed, screenX, screenY,
  onRemove, onStartMove, onClose,
}: {
  placed: PlacedDecoration;
  screenX: number; screenY: number;
  onRemove: () => void; onStartMove: () => void; onClose: () => void;
}) {
  const deco = ALL_DECOS.find((d) => d.id === placed.decoId);
  return (
    <div style={{
      position: "absolute",
      left: screenX,
      top: screenY - 10,
      transform: "translate(-50%, -100%)",
      pointerEvents: "auto", zIndex: 250,
      animation: "fadeUp .2s both",
    }}>
      <div style={{
        background: C.bg, border: `1.5px solid ${C.border}`,
        borderRadius: 5, overflow: "hidden",
        boxShadow: `0 8px 30px rgba(0,0,0,.8)`,
        minWidth: 160,
      }}>
        <div style={{ height: 3, background: C.scroll }} />
        <div style={{
          padding: "6px 10px 5px", background: C.amberD,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.amber }}>
            {deco?.name ?? placed.decoId}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
            <X size={10} />
          </button>
        </div>
        <div style={{ padding: "8px 10px", display: "flex", gap: 6 }}>
          <button
            onClick={onStartMove}
            style={{
              flex: 1, padding: "6px 8px", borderRadius: 3, cursor: "pointer",
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.muted, fontSize: 9, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              textTransform: "uppercase",
            }}
          >
            <Move size={11} /> Di chuyển
          </button>
          <button
            onClick={onRemove}
            style={{
              flex: 1, padding: "6px 8px", borderRadius: 3, cursor: "pointer",
              border: `1px solid ${C.red}40`, background: C.redD,
              color: C.red, fontSize: 9, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              textTransform: "uppercase",
            }}
          >
            <Trash2 size={11} /> Xóa bỏ
          </button>
        </div>
        <div style={{ height: 3, background: C.scroll }} />
      </div>
      <div style={{
        width: 0, height: 0, margin: "0 auto",
        borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
        borderTop: `6px solid ${C.border}`,
      }} />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translate(-50%,-90%)}to{opacity:1;transform:translate(-50%,-100%)}}`}</style>
    </div>
  );
}

// ─── Placed deco renderer on map ──────────────────────────────────────────────

function PlacedDecoOnMap({
  placed, camera, containerW, containerH,
  isMoving, isSelected,
  onPointerDown, onClick,
}: {
  placed: PlacedDecoration;
  camera: Camera; containerW: number; containerH: number;
  isMoving: boolean; isSelected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: () => void;
}) {
  const deco = useMemo(() => ALL_DECOS.find((d) => d.id === placed.decoId), [placed.decoId]);
  const st   = TILE_SIZE * camera.zoom;
  const { x, y } = worldToScreen(placed.worldX, placed.worldY, camera, containerW / 2, containerH / 2);
  const w = placed.tileW * st;
  const h = placed.tileH * st;

  if (!deco) return null;

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{
        position: "absolute",
        left: x, top: y, width: w, height: h,
        cursor: isMoving ? "grabbing" : "pointer",
        zIndex: 140,
        outline: isSelected ? `2px solid ${C.amber}` : "none",
        outlineOffset: 2,
        boxShadow: isMoving ? `0 0 20px ${C.amberD}` : undefined,
        opacity: isMoving ? 0.75 : 1,
        transition: "opacity .15s",
      }}
    >
      <Image
        src={deco.imageSrc}
        alt={deco.name}
        fill
        unoptimized
        draggable={false}
        style={{ objectFit: "contain", imageRendering: "pixelated" }}
      />
    </div>
  );
}

// ─── Ghost (preview khi đang đặt/di chuyển) ──────────────────────────────────

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
      left: x, top: y,
      width: tileW * st, height: tileH * st,
      border: `2px dashed ${valid ? C.amber : C.red}`,
      background: valid ? "rgba(212,168,67,.12)" : "rgba(224,85,85,.12)",
      borderRadius: 3, pointerEvents: "none", zIndex: 141,
    }}>
      <Image
        src={deco.imageSrc} alt=""
        fill unoptimized draggable={false}
        style={{ objectFit: "contain", imageRendering: "pixelated", opacity: .55 }}
      />
    </div>
  );
}

// ─── Main InventoryBag ────────────────────────────────────────────────────────

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

  const [bagOpen,     setBagOpen]     = useState(false);
  /** id của công trình đang chuẩn bị đặt */
  const [placingId,   setPlacingId]   = useState<string | null>(null);
  /** instanceId đang chuẩn bị di chuyển */
  const [movingId,    setMovingId]    = useState<string | null>(null);
  /** instanceId đang hiện popup */
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  /** Vị trí ghost (world tile — snap 1/1) */
  const [ghostPos,    setGhostPos]    = useState<{ x: number; y: number } | null>(null);
  /** Dùng để track hold timer */
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined as unknown as ReturnType<typeof setTimeout>);

  // Lấy meta của item đang placing / moving
  const activeDeco = useMemo(() => {
    const id = placingId ?? (movingId ? placedDecos.find((p) => p.instanceId === movingId)?.decoId : null);
    return id ? ALL_DECOS.find((d) => d.id === id) : null;
  }, [placingId, movingId, placedDecos]);

  // Kiểm tra vị trí ghost có hợp lệ không
  const ghostValid = useMemo(() => {
    if (!ghostPos || !activeDeco) return false;
    // Kiểm tra overlap với placed decos
    const occupied = placedDecos.some((p) => {
      if (movingId && p.instanceId === movingId) return false;
      const ax = ghostPos.x, ay = ghostPos.y;
      const aw = activeDeco.tileW, ah = activeDeco.tileH;
      return !(ax + aw <= p.worldX || ax >= p.worldX + p.tileW ||
               ay + ah <= p.worldY || ay >= p.worldY + p.tileH);
    });
    // Kiểm tra overlap với các BUILDINGS tĩnh
    const blockedByBuilding = BUILDINGS.some((b) => {
      if (!("width" in b)) return false;
      const bw = (b as { width: number; height: number; worldX: number; worldY: number }).width;
      const bh = (b as { width: number; height: number; worldX: number; worldY: number }).height;
      const bx = (b as { worldX: number }).worldX;
      const by = (b as { worldY: number }).worldY;
      const ax = ghostPos.x, ay = ghostPos.y;
      const aw = activeDeco.tileW, ah = activeDeco.tileH;
      return !(ax + aw <= bx || ax >= bx + bw || ay + ah <= by || ay >= by + bh);
    });
    return !occupied && !blockedByBuilding;
  }, [ghostPos, activeDeco, placedDecos, movingId]);

  // Xử lý mouse move → cập nhật ghost position (snap to integer tiles)
  const handleMapMouseMove = useCallback((e: MouseEvent) => {
    if (!activeDeco || (!placingId && !movingId)) return;
    const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.() ??
      { left: 0, top: 0, width: width, height: height };
    const world = screenToWorld(
      e.clientX - rect.left, e.clientY - rect.top,
      camera, width / 2, height / 2,
    );
    // Snap: lấy tâm deco rồi round
    const snapX = Math.round(world.x - activeDeco.tileW / 2);
    const snapY = Math.round(world.y - activeDeco.tileH / 2);
    setGhostPos({ x: snapX, y: snapY });
  }, [activeDeco, placingId, movingId, camera, width, height]);

  // Click trên map khi đang placing / moving
  const handleMapClick = useCallback((e: MouseEvent) => {
    if (!ghostPos || !activeDeco) return;
    if (!ghostValid) return;

    if (placingId) {
      const ok = placeDecoration(placingId, ghostPos.x, ghostPos.y);
      if (ok) { setPlacingId(null); setGhostPos(null); }
    } else if (movingId) {
      const ok = moveDecoration(movingId, ghostPos.x, ghostPos.y);
      if (ok) { setMovingId(null); setGhostPos(null); }
    }
  }, [ghostPos, activeDeco, ghostValid, placingId, movingId, placeDecoration, moveDecoration]);

  // Cancel placing/moving
  const cancelAction = useCallback(() => {
    setPlacingId(null); setMovingId(null); setGhostPos(null);
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") cancelAction(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cancelAction]);

  // Map container event listeners — chúng ta inject vào container div của WorldMap
  const mapListenerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = document.getElementById("world-map-container");
    if (!el) return;
    const mm = (e: MouseEvent) => handleMapMouseMove(e as MouseEvent);
    const mc = (e: MouseEvent) => handleMapClick(e as MouseEvent);
    el.addEventListener("mousemove", mm);
    el.addEventListener("click", mc);
    return () => { el.removeEventListener("mousemove", mm); el.removeEventListener("click", mc); };
  }, [handleMapMouseMove, handleMapClick]);

  // selected popup position
  const selectedPlaced  = useMemo(() => placedDecos.find((p) => p.instanceId === selectedId), [placedDecos, selectedId]);
  const selectedScreenPos = useMemo(() => {
    if (!selectedPlaced) return null;
    const st = TILE_SIZE * camera.zoom;
    const { x, y } = worldToScreen(selectedPlaced.worldX, selectedPlaced.worldY, camera, width / 2, height / 2);
    return { x: x + selectedPlaced.tileW * st / 2, y };
  }, [selectedPlaced, camera, width, height]);

  // Hủy select khi click ngoài
  useEffect(() => {
    if (!selectedId) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-deco-popup]") && !t.closest("[data-placed-deco]")) {
        setSelectedId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedId]);

  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* ── Bag icon (left HUD) ── */}
      <div style={{
        position: "absolute", top: 16, left: 16,
        zIndex: 400, pointerEvents: "auto",
      }}>
        <button
          onClick={() => setBagOpen((v) => !v)}
          style={{
            width: 40, height: 40,
            background: "rgba(0,0,0,.8)", border: `1px solid ${bagOpen ? C.amber : "rgba(255,255,255,.12)"}`,
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
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20,
          padding: "6px 16px", fontSize: 10, color: C.muted, pointerEvents: "auto",
          zIndex: 300, cursor: "pointer",
        }} onClick={cancelAction}>
          ESC hoặc nhấn đây để hủy
        </div>
      )}

      {/* ── Placed decos on map ── */}
      {placedDecos.map((p) => (
        <PlacedDecoOnMap
          key={p.instanceId}
          placed={p} camera={camera}
          containerW={width} containerH={height}
          isMoving={movingId === p.instanceId}
          isSelected={selectedId === p.instanceId}
          onPointerDown={(e) => {
            e.stopPropagation();
            // Hold = 500ms → di chuyển
            holdTimer.current = setTimeout(() => {
              setSelectedId(null);
              setMovingId(p.instanceId);
              setPlacingId(null);
              setGhostPos(null);
            }, 500);
          }}
          onClick={() => {
            clearTimeout(holdTimer.current);
            if (movingId === p.instanceId) return; // ignore click khi đang move
            setSelectedId((prev) => prev === p.instanceId ? null : p.instanceId);
          }}
        />
      ))}

      {/* ── Placed deco popup ── */}
      {selectedId && selectedPlaced && selectedScreenPos && (
        <div data-deco-popup style={{ position: "absolute", zIndex: 260, pointerEvents: "none" }}>
          <PlacedDecoPopup
            placed={selectedPlaced}
            screenX={selectedScreenPos.x} screenY={selectedScreenPos.y}
            onRemove={() => { removeDecoration(selectedId); setSelectedId(null); }}
            onStartMove={() => {
              setMovingId(selectedId); setPlacingId(null);
              setSelectedId(null); setGhostPos(null);
            }}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </>
  );
}