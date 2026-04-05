"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { selectSelectedBuilding, useMapStore } from "@/stores/mapStore";
import { worldToScreen } from "@/utils/coords";
import { BUILDINGS, TILE_SIZE } from "@/constants/map";
import { Camera } from "@/types";
import { toggleTorch } from "@/utils/torchManager";
import { Megaphone } from "lucide-react";
import { newsList } from "@/components/Content/NewsContent";

// ─── CSS inject 1 lần duy nhất khi module load, không tạo lại mỗi render ──
if (typeof document !== "undefined") {
  const STYLE_ID = "__worldoverlay_keyframes__";
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      @keyframes floatUp {
        0%   { transform: translate(-50%, 0);      opacity: 1; }
        100% { transform: translate(-50%, -150px); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
}

// ─── Lấy news building 1 lần, không tìm lại mỗi render ────────────────────
const NEWS_BUILDING = BUILDINGS.find((b) => b.id === "news") ?? null;

// ─── Selector gộp → 1 subscription duy nhất thay vì 3 ─────────────────────

// ─── Popup type ─────────────────────────────────────────────────────────────
interface Popup {
  id: number;
  x: number; // world coords — chuyển screen khi render
  y: number;
}

export default function WorldOverlay({
  camera,
  width,
  height,
}: {
  camera: Camera;
  width: number;
  height: number;
}) {
  const lastReadIdRef = useRef<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const processedClickRef = useRef<string | null>(null);
  const addAvocados = useMapStore((s) => s.addAvocados);
  const harvest = useMapStore((s) => s.harvest);
  const selectedBuilding = useMapStore(selectSelectedBuilding);

  const latestNews = newsList[0] ?? null;

  // Tính cX/cY 1 lần, không tạo mảng mỗi render
  const cX = width / 2;
  const cY = height / 2;

  // ── Khởi tạo: đọc localStorage 1 lần ──────────────────────────────────────
  useEffect(() => {
    const savedId = localStorage.getItem("last_read_news_id");
    lastReadIdRef.current = savedId;
    if (latestNews && String(savedId) !== String(latestNews.id)) {
      setShowBubble(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tọa độ bảng tin: chỉ tính lại khi camera/size đổi ────────────────────
  // Khi showBubble=false thì skip tính toán hoàn toàn
  const newsPos = useMemo(() => {
    if (!NEWS_BUILDING || !showBubble) return null;
    const coords = worldToScreen(
      NEWS_BUILDING.worldX,
      NEWS_BUILDING.worldY,
      camera,
      cX,
      cY,
    );
    const scaledWidth = NEWS_BUILDING.width * TILE_SIZE * camera.zoom;
    return { ...coords, scaledWidth };
  }, [camera, cX, cY, showBubble]);

  // ── Tọa độ popups: tính sẵn khi popups thay đổi, không tính trong render ──
  const screenPopups = useMemo(
    () =>
      popups.map((p) => ({
        id: p.id,
        ...worldToScreen(p.x, p.y, camera, cX, cY),
      })),
    [popups, camera, cX, cY],
  );

  // ── Xử lý click từ selectedBuilding ──────────────────────────────────────
  const removePopup = useCallback((id: number) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useEffect(() => {
    if (!selectedBuilding) {
      processedClickRef.current = null;
      return;
    }

    const actionKey = `${selectedBuilding.id}-${selectedBuilding.clickedAt}`;
    if (processedClickRef.current === actionKey) return;
    processedClickRef.current = actionKey;

    if (selectedBuilding.id === "news" && latestNews) {
      const idStr = String(latestNews.id);
      localStorage.setItem("last_read_news_id", idStr);
      lastReadIdRef.current = idStr;
      setShowBubble(false);
    }

    if (selectedBuilding.id === "avacado_tree") {
      const { worldX, worldY, id } = selectedBuilding;
      const newId = Date.now();
      addAvocados(100);
      harvest(id);
      setPopups((prev) => [...prev, { id: newId, x: worldX, y: worldY }]);
      const timer = window.setTimeout(() => removePopup(newId), 1000);
      return () => window.clearTimeout(timer);
    }

    if (selectedBuilding.type === "torch") {
      toggleTorch(selectedBuilding.id, true);
    }
  }, [selectedBuilding, addAvocados, harvest, latestNews, removePopup]);

  // Không render gì khi không có gì để hiển thị
  if (!showBubble && screenPopups.length === 0) return null;

  return (
    <>
      {/* Bong bóng tin tức */}
      {newsPos && (
        <div
          className="absolute z-[60] pointer-events-none select-none"
          style={{
            left: newsPos.x + newsPos.scaledWidth / 2,
            top: newsPos.y,
            transform: "translate(-50%, -160%)",
          }}
        >
          <div className="flex items-center gap-2 bg-[#1a1208]/95 border-2 border-red-600 px-3 py-2 rounded-sm shadow-[0_0_25px_rgba(220,38,38,0.8)] animate-bounce">
            <Megaphone className="w-5 h-5 text-red-500" />
            <div className="flex flex-col">
              <span className="text-[10px] text-red-500  uppercase leading-none italic">
                {latestNews?.tag}
              </span>
              <span className="text-[#e8c97a] text-[12px]  whitespace-nowrap mt-1 uppercase">
                {latestNews?.title}
              </span>
            </div>
          </div>
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-red-600 mx-auto" />
        </div>
      )}

      {/* Popup +100 🥑 */}
      {screenPopups.map((p) => (
        <div
          key={p.id}
          className="absolute z-[100] pointer-events-none"
          style={{
            left: p.x +140,
            top: p.y,
            animation: "floatUp 1s forwards",
          }}
        >
          <div className="text-green-400  text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
            +100 🥑
          </div>
        </div>
      ))}
    </>
  );
}
