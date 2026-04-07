"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { selectSelectedBuilding, useMapStore } from "@/stores/mapStore";
import { worldToScreen } from "@/utils/coords";
import { BUILDINGS, TILE_SIZE } from "@/constants/map";
import { Camera } from "@/types";
import { toggleTorch } from "@/utils/torchManager";
import { Megaphone, MessageCircle, Utensils, Sparkles } from "lucide-react";
import { newsList } from "@/components/Content/NewsContent";

// ─── CSS inject ──────────────────────────────────────────────────────────────
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
      @keyframes tunaPopIn {
        0%   { transform: translate(-50%,-50%) scale(0.4); opacity:0; }
        65%  { transform: translate(-50%,-50%) scale(1.18); opacity:1; }
        100% { transform: translate(-50%,-50%) scale(1);   opacity:1; }
      }
      @keyframes tunaInfoIn {
        0%   { opacity:0; transform: translateX(-50%) translateY(10px) scale(0.95); }
        100% { opacity:1; transform: translateX(-50%) translateY(0)   scale(1); }
      }
      @keyframes bubbleBob {
        0%,100% { transform: translate(-50%,-50%) translateY(0); }
        50%     { transform: translate(-50%,-50%) translateY(-8px); }
      }
      @keyframes pulseBorder {
        0%, 100% { border-color: rgba(34, 211, 238, 0.5); }
        50% { border-color: rgba(34, 211, 238, 1); }
      }
    `;
    document.head.appendChild(s);
  }
}

// ─── Constants & Data ────────────────────────────────────────────────────────
const NEWS_BUILDING = BUILDINGS.find((b) => b.id === "news") ?? null;
const TUNA_BUILDING = BUILDINGS.find((b) => b.id === "tuna") ?? null;

const TUNA_QUOTES = [
  "Chào đằng ấy! Hôm nay nước biển có vẻ ấm nhỉ? 🌊",
  "Tuna đang đói... bạn có mang theo miếng bơ nào không? 🥑",
  "Lặn xuống đáy hồ ngắm san hô là tuyệt nhất luôn! ✨",
  "Cá ngừ cũng biết buồn đó, hãy chơi với Tuna nhé! 🐟",
  "Đừng nhìn Tuna như vậy, Tuna ngại lắm... 😳",
  "Bạn có thấy vương quốc này ngày càng đẹp không? 🏰",
];

interface Popup {
  id: number;
  x: number;
  y: number;
  label?: string;
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
  const processedClickRef = useRef<string | null>(null);
  const latestNews = newsList[0] ?? null;

  // 1. Khởi tạo State thông minh để tránh gọi setState ngay khi Mount
  const [showBubble, setShowBubble] = useState(() => {
    if (typeof window === "undefined" || !latestNews) return false;
    const savedId = localStorage.getItem("last_read_news_id");
    return String(savedId) !== String(latestNews.id);
  });

  const [popups, setPopups] = useState<Popup[]>([]);
  const [interactionMode, setInteractionMode] = useState<"menu" | "talking">("menu");
  const [currentDialogue, setCurrentDialogue] = useState("");

  const addAvocados = useMapStore((s) => s.addAvocados);
  const harvest = useMapStore((s) => s.harvest);
  const selectedBuilding = useMapStore(selectSelectedBuilding);
  const { 
    tunaVisible, tunaAnimOffsetY, tunaDiving, 
    tunaInfoOpen, tunaAnimating 
  } = useMapStore();

  const cX = width / 2;
  const cY = height / 2;

  // 2. Xử lý logic click bằng useEffect an toàn
  useEffect(() => {
    if (!selectedBuilding) {
      processedClickRef.current = null;
      return;
    }

    const actionKey = `${selectedBuilding.id}-${selectedBuilding.clickedAt}`;
    if (processedClickRef.current === actionKey) return;
    processedClickRef.current = actionKey;

    // Xử lý News: Dùng setTimeout để tránh lỗi Cascading Render
    if (selectedBuilding.id === "news" && latestNews) {
      localStorage.setItem("last_read_news_id", String(latestNews.id));
      const timer = setTimeout(() => setShowBubble(false), 0);
      return () => clearTimeout(timer);
    }

    // Xử lý Thu hoạch Avocado
    if (selectedBuilding.id === "avacado_tree") {
      const { worldX, worldY, id } = selectedBuilding;
      const newId = Date.now();
      addAvocados(100);
      harvest(id);
      
      const timer = setTimeout(() => {
        setPopups(prev => [...prev, { id: newId, x: worldX, y: worldY, label: "+100 🥑" }]);
      }, 0);

      const clearTimer = setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== newId));
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }

    if (selectedBuilding.type === "torch") {
      toggleTorch(selectedBuilding.id, true);
    }
  }, [selectedBuilding, addAvocados, harvest, latestNews]);

  // 3. Tương tác với Tuna
  const handleTunaInteract = useCallback((type: "talk" | "feed" | "play") => {
    if (!TUNA_BUILDING) return;
    const newId = Date.now();
    const { worldX, worldY } = TUNA_BUILDING;

    if (type === "talk") {
      const quote = TUNA_QUOTES[Math.floor(Math.random() * TUNA_QUOTES.length)];
      setCurrentDialogue(quote);
      setInteractionMode("talking");
      setTimeout(() => setInteractionMode("menu"), 3500);
    } else if (type === "feed") {
      addAvocados(20);
      setPopups(prev => [...prev, { id: newId, x: worldX, y: worldY, label: "+20 🥑" }]);
      setTimeout(() => setPopups(prev => prev.filter(p => p.id !== newId)), 1000);
    } else if (type === "play") {
      setPopups(prev => [...prev, { id: newId, x: worldX, y: worldY, label: "HAPPY! ✨" }]);
      setTimeout(() => setPopups(prev => prev.filter(p => p.id !== newId)), 1000);
    }
  }, [addAvocados]);

  // 4. Tính toán tọa độ
  const newsPos = useMemo(() => {
    if (!NEWS_BUILDING || !showBubble) return null;
    return {
      ...worldToScreen(NEWS_BUILDING.worldX, NEWS_BUILDING.worldY, camera, cX, cY),
      scaledWidth: NEWS_BUILDING.width * TILE_SIZE * camera.zoom,
    };
  }, [camera, cX, cY, showBubble]);

  const tunaScreenPos = useMemo(() => {
    if (!TUNA_BUILDING || !(tunaVisible || tunaAnimating || tunaDiving)) return null;
    return {
      ...worldToScreen(TUNA_BUILDING.worldX, TUNA_BUILDING.worldY + tunaAnimOffsetY, camera, cX, cY),
      scaledWidth: TUNA_BUILDING.width * TILE_SIZE * camera.zoom,
      scaledHeight: TUNA_BUILDING.height * TILE_SIZE * camera.zoom,
    };
  }, [camera, cX, cY, tunaVisible, tunaAnimating, tunaDiving, tunaAnimOffsetY]);

  const tunaOpacity = useMemo(() => {
    if (tunaVisible && !tunaDiving) return 1;
    return Math.max(0, 1 - tunaAnimOffsetY / 3);
  }, [tunaVisible, tunaDiving, tunaAnimOffsetY]);

  const tunaSteady = tunaVisible && !tunaDiving && tunaAnimOffsetY === 0;

  return (
    <>
      {/* News Layer */}
      {newsPos && (
        <div
          className="absolute z-[60] pointer-events-none"
          style={{
            left: newsPos.x + newsPos.scaledWidth / 2,
            top: newsPos.y,
            transform: "translate(-50%, -160%)",
          }}
        >
          <div className="flex items-center gap-2 bg-[#1a1208]/95 border-2 border-red-600 px-3 py-2 rounded-sm shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-bounce">
            <Megaphone className="w-4 h-4 text-red-500" />
            <div className="flex flex-col">
              <span className="text-[10px] text-red-500 uppercase font-bold leading-none italic">{latestNews?.tag}</span>
              <span className="text-[#e8c97a] text-[11px] whitespace-nowrap mt-1 uppercase">{latestNews?.title}</span>
            </div>
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-600 mx-auto" />
        </div>
      )}

      {/* Tuna Layer */}
      {tunaScreenPos && (tunaVisible || tunaAnimating || tunaDiving) && (() => {
        const cx = tunaScreenPos.x + tunaScreenPos.scaledWidth / 2;
        const cy = tunaScreenPos.y + tunaScreenPos.scaledHeight / 2;
        return (
          <>
            <div
              className="absolute z-[70] pointer-events-none"
              style={{
                left: cx,
                top: cy,
                opacity: tunaOpacity,
                animation: tunaSteady ? "tunaPopIn 0.4s ease-out forwards, bubbleBob 2.5s ease-in-out 0.4s infinite" : undefined,
                transform: tunaSteady ? undefined : "translate(-50%, -50%)",
              }}
            />
            {tunaInfoOpen && tunaSteady && (
              <div
                className="absolute z-[80] pointer-events-auto"
                style={{
                  left: cx,
                  top: cy - tunaScreenPos.scaledHeight / 2 - 20,
                  animation: "tunaInfoIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                }}
              >
                <div 
                  className="bg-[#0b1e2c]/98 border-2 border-cyan-400/50 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(34,211,238,0.2)] min-w-[240px] animate-[pulseBorder_3s_infinite]"
                  style={{ transform: "translateX(-50%)" }}
                >
                  <div className="flex justify-between items-center mb-3 border-b border-cyan-900/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🐟</span>
                      <span className="text-cyan-300 text-xs font-black uppercase tracking-widest">{TUNA_BUILDING?.name || "Tuna"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-800/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] text-green-400 font-bold">VUI VẺ</span>
                    </div>
                  </div>
                  <div className="min-h-[70px] flex flex-col justify-center bg-black/20 rounded-xl p-2 mb-3">
                    {interactionMode === "talking" ? (
                      <p className="text-[#b8dce8] text-[11px] leading-relaxed text-center italic animate-in fade-in zoom-in-95 duration-300">
                        {/* Giải pháp cho lỗi react/no-unescaped-entities */}
                        {`"${currentDialogue}"`}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => handleTunaInteract("talk")} className="group flex flex-col items-center gap-1.5 p-2 rounded-xl bg-cyan-900/20 hover:bg-cyan-500/20 border border-cyan-800/30 transition-all active:scale-90">
                          <MessageCircle className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] text-cyan-200 font-medium">Trò chuyện</span>
                        </button>
                        <button type="button" onClick={() => handleTunaInteract("feed")} className="group flex flex-col items-center gap-1.5 p-2 rounded-xl bg-cyan-900/20 hover:bg-orange-500/20 border border-cyan-800/30 transition-all active:scale-90">
                          <Utensils className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] text-cyan-200 font-medium">Cho ăn</span>
                        </button>
                        <button type="button" onClick={() => handleTunaInteract("play")} className="group flex flex-col items-center gap-1.5 p-2 rounded-xl bg-cyan-900/20 hover:bg-yellow-500/20 border border-cyan-800/30 transition-all active:scale-90">
                          <Sparkles className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] text-cyan-200 font-medium">Vui chơi</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-cyan-700/60 text-[9px] text-center uppercase tracking-[0.2em] font-bold">Nhấn vào hồ để lặn ↓</p>
                </div>
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-cyan-400/40 mx-auto" />
              </div>
            )}
          </>
        );
      })()}

      {/* Popups Layer */}
      {popups.map((p) => {
        const pos = worldToScreen(p.x, p.y, camera, cX, cY);
        return (
          <div key={p.id} className="absolute z-[100] pointer-events-none" style={{ left: pos.x + 100, top: pos.y, animation: "floatUp 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
            <div className="text-green-400 text-2xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] whitespace-nowrap italic">{p.label || "+100 🥑"}</div>
          </div>
        );
      })}
    </>
  );
}