"use client";

import { Building } from "@/types";
import Image from "next/image";
import { useState } from "react";
import {
  Play,
  Sparkles,
  ScrollText,
  FlaskConical,
  Flame,
  Eye,
  Clock,
  ChevronRight,
} from "lucide-react";

export const CinemaContent = ({ data }: { data: Building }) => {
  const [selectedCat, setSelectedCat] = useState("all");

  const categories = [
    { id: "all", label: "Tất cả", icon: Sparkles, color: "#c8a040" },
    { id: "vlog", label: "Viễn chinh", icon: ScrollText, color: "#7aaad4" },
    { id: "tutorial", label: "Bí kíp", icon: FlaskConical, color: "#60c090" },
    { id: "live", label: "Trực biến", icon: Flame, color: "#c06050" },
  ];

  const videos = [
    {
      id: 1,
      title: "Cuộc viễn chinh số #1: Vùng đất sương mù",
      views: "1.2k",
      time: "2 ngày",
      dur: "14:02",
    },
    {
      id: 2,
      title: "Cuộc viễn chinh số #2: Thung lũng bóng tối",
      views: "980",
      time: "4 ngày",
      dur: "18:37",
    },
    {
      id: 3,
      title: "Cuộc viễn chinh số #3: Ngọn tháp cô đơn",
      views: "2.1k",
      time: "6 ngày",
      dur: "22:11",
    },
    {
      id: 4,
      title: "Cuộc viễn chinh số #4: Biển lửa vĩnh cửu",
      views: "750",
      time: "1 tuần",
      dur: "11:55",
    },
  ];

  return (
    <div
      className="space-y-6 animate-in fade-in zoom-in-95 duration-500"
      
    >
      {/* ── 1. Main screen ────────────────────────────────────────────── */}
      <div
        className="relative aspect-video w-full overflow-hidden group"
        style={{
          background: "#0c0804",
          border: "1px solid #6b4c1e",
          borderRadius: "2px",
          boxShadow: "0 0 0 1px #2a1a08, 0 0 40px rgba(180,120,40,0.2)",
        }}
      >
        {/* Gold bar top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            zIndex: 10,
            background:
              "linear-gradient(90deg, transparent, #5a3e14 10%, #c8a040 30%, #f0d882 50%, #c8a040 70%, #5a3e14 90%, transparent)",
          }}
        />

        {/* Corner ornaments */}
        {[
          "top-2 left-2",
          "top-2 right-2",
          "bottom-8 left-2",
          "bottom-8 right-2",
        ].map((pos, i) => (
          <span
            key={i}
            className={`absolute ${pos} z-10 text-xs leading-none`}
            style={{ color: "#4a3410" }}
          >
            ✦
          </span>
        ))}

        <Image
          src={data.imageSrc || ""}
          alt="Magic Mirror"
          fill
          className="object-cover opacity-30 group-hover:scale-105 transition-transform duration-[3s] ease-out"
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(10,6,2,0.7) 100%)",
          }}
        />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative group/btn">
            {/* Glow ring */}
            <div
              className="absolute -inset-4 rounded-full opacity-0 group-hover/btn:opacity-100 transition-all duration-300"
              style={{
                background: "rgba(200,160,60,0.15)",
                filter: "blur(12px)",
              }}
            />
            <button
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{
                background: "rgba(20,12,4,0.85)",
                border: "1px solid #8b6530",
                boxShadow:
                  "0 0 0 4px rgba(100,70,20,0.2), inset 0 1px 0 rgba(200,160,80,0.15)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 0 4px rgba(100,70,20,0.3), 0 0 30px rgba(200,160,60,0.35), inset 0 1px 0 rgba(200,160,80,0.2)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#c8a040";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 0 4px rgba(100,70,20,0.2), inset 0 1px 0 rgba(200,160,80,0.15)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#8b6530";
              }}
            >
              <Play
                className="w-8 h-8 ml-1"
                style={{ color: "#c8a040", fill: "#c8a040" }}
              />
            </button>
          </div>
        </div>

        {/* Bottom info bar */}
        <div
          className="absolute bottom-0 w-full p-5"
          style={{
            background:
              "linear-gradient(to top, #0c0804 0%, rgba(12,8,4,0.8) 60%, transparent 100%)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-2 w-2 relative">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "#c06050" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "#a04030" }}
              />
            </div>
            <span
              className="text-[9px] uppercase tracking-[0.2em]"
              style={{color: "#c06050" }}
            >
              Hào quang hiện hữu
            </span>
          </div>
          <h3
            className="text-sm sm:text-xl truncate leading-tight"
            style={{
              
              color: "#e8c97a",
              textShadow: "0 0 20px rgba(232,200,120,0.3)",
            }}
          >
            Chương I: Sự trỗi dậy của Pixel Vương Quốc
          </h3>
        </div>
      </div>

      {/* ── 2. Category tabs ──────────────────────────────────────────── */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 transition-all duration-300"
              style={{
                
                fontSize: "10px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                borderRadius: "2px",
                border: active ? `1px solid ${cat.color}` : "1px solid #3a2810",
                background: active
                  ? `rgba(${cat.color === "#c8a040" ? "140,100,30" : cat.color === "#7aaad4" ? "80,140,200" : cat.color === "#60c090" ? "60,160,100" : "160,60,50"},0.15)`
                  : "rgba(0,0,0,0.25)",
                color: active ? cat.color : "#5a4020",
                boxShadow: active ? `0 0 14px ${cat.color}30` : "none",
                transform: active ? "translateY(-1px)" : "none",
              }}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: active ? cat.color : "#4a3410" }}
              />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── 3. Video grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((v) => (
          <div
            key={v.id}
            className="group transition-all duration-300 cursor-pointer"
            style={{
              background: "linear-gradient(160deg, #251a0a, #1a1005)",
              border: "1px solid #3a2810",
              borderRadius: "2px",
              padding: "12px",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "#6b4c1e";
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = "0 0 20px rgba(180,120,40,0.15)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "#3a2810";
              el.style.transform = "none";
              el.style.boxShadow = "none";
            }}
          >
            {/* Thumbnail placeholder */}
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "16/9",
                background: "linear-gradient(160deg, #1a1005, #0c0804)",
                border: "1px solid #2a1a08",
                borderRadius: "1px",
              }}
            >
              {/* Play icon watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] group-hover:opacity-[0.15] transition-opacity duration-500">
                <Play className="w-12 h-12" style={{ color: "#c8a040" }} />
              </div>

              {/* Candle glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 100%, rgba(200,160,60,0.07), transparent 70%)",
                }}
              />

              {/* Duration badge */}
              <div
                className="absolute top-2 right-2 px-2 py-0.5 text-[9px] tracking-widest uppercase"
                style={{
                  
                  background: "rgba(10,6,2,0.8)",
                  border: "1px solid #3a2810",
                  borderRadius: "1px",
                  color: "#8b6530",
                }}
              >
                {v.dur}
              </div>
            </div>

            {/* Info */}
            <div className="mt-3 space-y-2 px-1">
              <h4
                className="text-xs line-clamp-1 transition-colors duration-300"
                style={{
                  
                  color: "#c8a870",
                  letterSpacing: "0.03em",
                }}
              >
                {v.title}
              </h4>

              <div className="flex justify-between items-center">
                <div
                  className="flex items-center gap-3 text-[10px]"
                  style={{ color: "#4a3410" }}
                >
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" style={{ color: "#6b4c1e" }} />
                    {v.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" style={{ color: "#6b4c1e" }} />
                    {v.time}
                  </span>
                </div>

                {/* Arrow button */}
                <div
                  className="w-6 h-6 flex items-center justify-center transition-all duration-300"
                  style={{
                    border: "1px solid #3a2810",
                    borderRadius: "50%",
                  }}
                >
                  <ChevronRight
                    className="w-3 h-3"
                    style={{ color: "#4a3410" }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
