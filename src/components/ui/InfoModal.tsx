"use client";

import { useMapStore } from "@/stores/mapStore";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Building } from "@/types";


// 2. Cấu hình Dynamic Imports cho từng Component
// loading: () => <p>...</p> là tùy chọn để hiển thị khi đang tải component đó
const CONTENT_MAP: Record<
  string,
  React.ComponentType<{ data: Building }>
> = {
  castle: dynamic(() =>
    import("../Content/CastleContent").then((mod) => mod.CastleContent),
  ),
  museum: dynamic(() =>
    import("../Content/MuseumContent").then((mod) => mod.MuseumContent),
  ),
  cinema: dynamic(() =>
    import("../Content/CinemaConent").then((mod) => mod.CinemaContent),
  ),
  bank: dynamic(() =>
    import("../Content/BankContent").then((mod) => mod.BankContent),
  ),
  library: dynamic(() =>
    import("../Content/LibraryContent").then((mod) => mod.LibraryContent),
  ),
  mailbox: dynamic(() =>
    import("../Content/MailBoxContent").then((mod) => mod.MailboxContent),
  ),
  news: dynamic(() => import("../Content/NewsContent")), // Nếu NewsContent export default
};

export default function InfoModal() {
  const { selectedBuilding, selectBuilding } = useMapStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") selectBuilding(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectBuilding]);

  // Kiểm tra điều kiện hiển thị
  if (!selectedBuilding || selectedBuilding.type !== "main") return null;

  // 3. Render Component dựa trên ID
  const renderContent = () => {
    const ContentComponent = CONTENT_MAP[selectedBuilding.id];

    if (!ContentComponent) {
      return (
        <div className="p-4 text-center">Dữ liệu công trình không tồn tại.</div>
      );
    }

    return <ContentComponent data={selectedBuilding as Building} />;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300 pointer-events-auto"
      style={{ background: "rgba(15, 8, 2, 0.55)" }}
      onClick={() => selectBuilding(null)}
    >
      <div
        className="relative w-full max-w-5xl h-full rounded-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{
          background:
            "linear-gradient(160deg, #2a1e0e 0%, #1c1408 50%, #221910 100%)",
          boxShadow:
            "0 0 0 1px #6b4c1e, 0 0 0 3px #2a1a08, 0 0 0 4px #8b6530, 0 0 60px rgba(180,120,40,0.35), inset 0 1px 0 rgba(200,160,80,0.15)",
          
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gold bar */}
        <div
          style={{
            height: 4,
            background:
              "linear-gradient(90deg, transparent, #5a3e14 10%, #c8a040 30%, #f0d882 50%, #c8a040 70%, #5a3e14 90%, transparent)",
          }}
        />

        {/* Header */}
        <div className="px-10 pt-5 pb-4 flex items-start justify-between gap-3 relative border-b border-[#6b4c1e] bg-gradient-to-b from-[rgba(100,70,20,0.25)] to-transparent">
          <h2 className="text-2xl mb-1  text-[#e8c97a] tracking-wider shadow-black drop-shadow-md">
            {selectedBuilding.name}
          </h2>
          <button
            onClick={() => selectBuilding(null)}
            className="close-btn flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-sm border border-[#7a3a20] text-[#c07050]"
            style={{
              background:
                "radial-gradient(circle at 40% 35%, rgba(140,60,30,0.35), rgba(60,20,10,0.5))",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body content */}
        <div className="fantasy-scroll h-full px-10 pt-5 pb-6 overflow-y-auto max-h-[82%] text-[#c8a870]">
          {renderContent()}
        </div>
      </div>

      <style jsx global>{`
        /* ── Exit button rune-ring effect ── */

        .close-btn {
          position: relative;

          overflow: visible !important;

          transition:
            color 0.25s,
            border-color 0.25s,
            box-shadow 0.25s;
        }

        .close-btn::before {
          content: "";

          position: absolute;

          inset: -5px;

          border-radius: 50%;

          border: 1.5px dashed #7a3a20;

          opacity: 0;

          transition: opacity 0.3s;

          animation: fantasy-spin 4s linear infinite;

          animation-play-state: paused;

          pointer-events: none;
        }

        .close-btn::after {
          content: "";

          position: absolute;

          inset: 0;

          border-radius: 50%;

          background: radial-gradient(
            circle,
            rgba(220, 80, 50, 0) 30%,

            transparent 70%
          );

          transition: background 0.3s;

          pointer-events: none;
        }

        .close-btn:hover {
          color: #ffd0b0 !important;

          border-color: #d06040 !important;

          box-shadow:
            0 0 18px rgba(200, 80, 50, 0.55),
            inset 0 0 10px rgba(200, 60, 30, 0.25);
        }

        .close-btn:hover::before {
          opacity: 1;

          animation-play-state: running;
        }

        .close-btn:hover::after {
          background: radial-gradient(
            circle,
            rgba(220, 80, 50, 0.18) 30%,

            transparent 70%
          );
        }

        .close-btn:active {
          transform: scale(0.92);

          box-shadow: 0 0 8px rgba(200, 80, 50, 0.3) !important;
        }

        @keyframes fantasy-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ── Custom fantasy scrollbar ── */

        .fantasy-scroll {
          scrollbar-width: thin;

          scrollbar-color: #7a5a28 #100c06;
        }

        .fantasy-scroll::-webkit-scrollbar {
          width: 10px;
        }

        .fantasy-scroll::-webkit-scrollbar-track {
          background: #100c06;

          border-left: 1px solid #2a1e0e;

          border-right: 1px solid #2a1e0e;
        }

        .fantasy-scroll::-webkit-scrollbar-track-piece {
          background: repeating-linear-gradient(
            180deg,
            #100c06 0px,

            #100c06 6px,

            #1a1208 6px,

            #1a1208 12px
          );
        }

        .fantasy-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #c8a040, #8b6530, #c8a040);

          border-radius: 2px;

          border: 1px solid #5a3e14;

          box-shadow:
            0 0 6px rgba(200, 160, 60, 0.4),
            inset 0 1px 0 rgba(255, 220, 100, 0.25);
        }

        .fantasy-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #f0d060, #a07830, #f0d060);

          box-shadow:
            0 0 12px rgba(240, 200, 80, 0.6),
            inset 0 1px 0 rgba(255, 230, 120, 0.4);
        }

        .fantasy-scroll::-webkit-scrollbar-button {
          height: 10px;

          background: #1a1208;

          border: 1px solid #3a2810;

          display: block;
        }
      `}</style>
    </div>
  );
}
