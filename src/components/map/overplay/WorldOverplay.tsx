"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useMapStore, selectSelectedBuilding } from "@/stores/mapStore";
import { worldToScreen } from "@/utils/coords";
import { BUILDINGS, TILE_SIZE } from "@/constants/map";
import { Camera, Building } from "@/types"; // Đảm bảo Building đã được export từ types
import { toggleTorch } from "@/utils/torchManager";
import { Megaphone, MessageCircle, Utensils } from "lucide-react";
import { newsList } from "@/components/Content/NewsContent";

// ─── CSS Animations ────────────────────────────────────────────────────────
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

const NEWS_BUILDING = BUILDINGS.find((b) => b.id === "news") ?? null;
const TUNA_BUILDING = BUILDINGS.find((b) => b.id === "tuna") ?? null;

const TUNA_QUOTES_NORMAL = ["Chào đằng ấy! 🌊", "Tuna đang đói... 🥑", "Cá ngừ cũng biết buồn đó! 🐟"];
const TUNA_QUOTES_EVOLVED = ["Sức mạnh thật dồi dào! 💪", "Vương quốc này thật tuyệt vời. ✨", "Tuna đã trưởng thành! 😎"];

interface Popup {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
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
  const latestNews = newsList[0] ?? null;

  const [lastReadId, setLastReadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("last_read_news_id");
  });

  const showBubble = latestNews ? String(lastReadId) !== String(latestNews.id) : false;

  const [popups, setPopups] = useState<Popup[]>([]);
  const [interactionMode, setInteractionMode] = useState<"menu" | "talking">("menu");
  const [currentDialogue, setCurrentDialogue] = useState("");
  
  const processedClickRef = useRef<string | null>(null);

  const { 
    avocados, addAvocados, harvest, tunaProgress, setTunaProgress,
    tunaVisible, tunaAnimOffsetY, tunaDiving, tunaInfoOpen, tunaAnimating 
  } = useMapStore();
  
  const selectedBuilding = useMapStore(selectSelectedBuilding);

  const cX = width / 2;
  const cY = height / 2;
  const isEvolved = tunaProgress >= 1000;

  // ── XỬ LÝ CLICK (Fix no-explicit-any) ───────────────────────────────────
  const handleBuildingAction = useCallback((building: Building) => {
    const actionKey = `${building.id}-${building.clickedAt}`;
    if (processedClickRef.current === actionKey) return;
    processedClickRef.current = actionKey;

    // 1. Xử lý News
    if (building.id === "news" && latestNews) {
      const idStr = String(latestNews.id);
      localStorage.setItem("last_read_news_id", idStr);
      
      // FIX: Dùng setTimeout để tách biệt việc update state khỏi effect loop
      setTimeout(() => {
        setLastReadId(idStr);
      }, 0);
    }

    // 2. Avocado Tree
    if (building.id === "avacado_tree") {
      const { worldX, worldY, id } = building;
      const newId = Date.now();
      
      // Đẩy các action vào hàng chờ tiếp theo để tránh Cascading Renders
      setTimeout(() => {
        addAvocados(100);
        harvest(id);
        setPopups((prev) => [...prev, { 
          id: newId, x: worldX, y: worldY, 
          label: "+100 🥑", color: "text-green-400" 
        }]);
      }, 0);

      setTimeout(() => {
        setPopups(p => p.filter(x => x.id !== newId));
      }, 1000);
    }

    // 3. Đuốc
    if (building.type === "torch") {
      toggleTorch(building.id, true);
    }
  }, [latestNews, addAvocados, harvest]);

  // Effect Bridge
  useEffect(() => {
    if (selectedBuilding) {
      handleBuildingAction(selectedBuilding);
    } else {
      processedClickRef.current = null;
    }
  }, [selectedBuilding, handleBuildingAction]);

  // ── Tương tác Tuna ──────────────────────────────────────────────────────
  const handleTunaInteract = useCallback((type: "talk" | "feed") => {
    if (!TUNA_BUILDING) return;
    if (type === "talk") {
      const quotes = isEvolved ? TUNA_QUOTES_EVOLVED : TUNA_QUOTES_NORMAL;
      setCurrentDialogue(quotes[Math.floor(Math.random() * quotes.length)]);
      setInteractionMode("talking");
      setTimeout(() => setInteractionMode("menu"), 3000);
    } else {
      if (avocados < 100) return;
      addAvocados(-100);
      setTunaProgress(tunaProgress + 100);
      const newId = Date.now();
      setPopups(prev => [...prev, { 
        id: newId, x: TUNA_BUILDING.worldX, y: TUNA_BUILDING.worldY, 
        label: "-100 🥑", color: "text-red-500" 
      }]);
      setTimeout(() => setPopups(p => p.filter(x => x.id !== newId)), 1000);
    }
  }, [avocados, tunaProgress, isEvolved, addAvocados, setTunaProgress]);

  // ── Coords ──────────────────────────────────────────────────────────────
  const newsPos = useMemo(() => {
    if (!NEWS_BUILDING || !showBubble) return null;
    const coords = worldToScreen(NEWS_BUILDING.worldX, NEWS_BUILDING.worldY, camera, cX, cY);
    const scaledWidth = NEWS_BUILDING.width * TILE_SIZE * camera.zoom;
    return { ...coords, scaledWidth };
  }, [camera, cX, cY, showBubble]);

  const tunaPos = useMemo(() => {
    if (!TUNA_BUILDING || !(tunaVisible || tunaAnimating || tunaDiving)) return null;
    const coords = worldToScreen(TUNA_BUILDING.worldX, TUNA_BUILDING.worldY + tunaAnimOffsetY, camera, cX, cY);
    return {
      ...coords,
      sH: TUNA_BUILDING.height * TILE_SIZE * camera.zoom,
      sW: TUNA_BUILDING.width * TILE_SIZE * camera.zoom,
    };
  }, [camera, cX, cY, tunaVisible, tunaAnimating, tunaDiving, tunaAnimOffsetY]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {newsPos && (
        <div
          className="absolute z-[60]"
          style={{
            left: newsPos.x + newsPos.scaledWidth / 2,
            top: newsPos.y,
            transform: "translate(-50%, -160%)",
          }}
        >
          <div className="flex items-center gap-2 bg-[#1a1208]/95 border-2 border-red-600 px-3 py-2 rounded-sm shadow-[0_0_25px_rgba(220,38,38,0.8)] animate-bounce pointer-events-auto">
            <Megaphone className="w-5 h-5 text-red-500" />
            <div className="flex flex-col">
              <span className="text-[10px] text-red-500 uppercase leading-none italic">{latestNews?.tag}</span>
              <span className="text-[#e8c97a] text-[12px] whitespace-nowrap mt-1 uppercase">{latestNews?.title}</span>
            </div>
          </div>
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-red-600 mx-auto" />
        </div>
      )}

      {tunaPos && tunaInfoOpen && !tunaDiving && (
        <div 
          className="absolute z-[80] pointer-events-auto" 
          style={{ 
            left: tunaPos.x + tunaPos.sW / 2, 
            top: tunaPos.y - 10, 
            transform: "translateX(-50%) translateY(-100%)" 
          }}
        >
          <div className={`bg-[#0b1e2c]/95 backdrop-blur-md border-2 ${isEvolved ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'border-cyan-400/50'} rounded-2xl p-4 min-w-[200px]`}>
             <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                <span className="text-cyan-300 text-[10px] font-bold uppercase">{isEvolved ? "🐉 Tuna Đại Đế" : "🐟 Tuna Nhỏ"}</span>
                <span className="text-[10px] text-white/50">{isEvolved ? "MAX LEVEL" : `${tunaProgress}/1000`}</span>
             </div>
             
             <div className="min-h-[50px] flex items-center justify-center">
               {interactionMode === "talking" ? (
                 <p className="text-white text-[12px] text-center italic animate-in fade-in duration-300">
                    {"\""}{currentDialogue}{"\""}
                 </p>
               ) : (
                 <div className="flex gap-2 w-full">
                   <button onClick={() => handleTunaInteract("talk")} className="flex-1 flex flex-col items-center p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                     <MessageCircle size={18} className="text-cyan-400"/><span className="text-[10px] mt-1 text-white">Chat</span>
                   </button>
                   {!isEvolved && (
                     <button 
                       onClick={() => handleTunaInteract("feed")} 
                       disabled={avocados < 100}
                       className="flex-1 flex flex-col items-center p-2 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl transition-all disabled:opacity-30"
                     >
                       <Utensils size={18} className="text-orange-400"/><span className="text-[10px] mt-1 text-white">Cho ăn</span>
                     </button>
                   )}
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {popups.map((p) => {
        const screen = worldToScreen(p.x, p.y, camera, cX, cY);
        return (
          <div
            key={p.id}
            className={`absolute z-[100] ${p.color} text-3xl font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,1)]`}
            style={{
              left: screen.x + 80,
              top: screen.y - 20,
              animation: "floatUp 1s forwards",
            }}
          >
            {p.label}
          </div>
        );
      })}
    </div>
  );
}