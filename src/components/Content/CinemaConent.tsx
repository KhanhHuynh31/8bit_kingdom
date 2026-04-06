"use client";

import { Building } from "@/types";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
  Play, Sparkles, ScrollText, FlaskConical,
  Flame, Eye, Clock, ChevronRight, Loader2, X,
} from "lucide-react";
import type { YtVideo } from "@/app/api/youtube/videos/route";

// ─── Relative time helper ────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)   return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} giờ`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} tuần`;
  return `${Math.floor(diff / 2592000)} tháng`;
}

export const CinemaContent = ({ data }: { data: Building }) => {
  const [selectedCat, setSelectedCat] = useState<"all" | "video" | "short">("all");
  const [videos, setVideos]           = useState<YtVideo[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeId, setActiveId]       = useState<string | null>(null);   // video đang phát trong modal
  const [featuredId, setFeaturedId]   = useState<string | null>(null);   // video nổi bật trên main screen

  // ── Fetch danh sách video ───────────────────────────────────────────
  useEffect(() => {
    fetch('/api/youtube/videos')
      .then(r => r.json())
      .then(json => {
        if (json.videos) {
          setVideos(json.videos);
          setFeaturedId(json.videos[0]?.id ?? null); // mới nhất làm featured
        } else {
          setError('Không tải được danh sách video.');
        }
      })
      .catch(() => setError('Lỗi kết nối.'))
      .finally(() => setLoading(false));
  }, []);

  const closeModal = useCallback(() => setActiveId(null), []);

  // Đóng modal bằng Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeModal]);

  const categories = [
    { id: "all",   label: "Tất cả",   icon: Sparkles,     color: "#c8a040" },
    { id: "video", label: "Viễn chinh", icon: ScrollText,  color: "#7aaad4" },
    { id: "short", label: "Bí kíp",   icon: FlaskConical, color: "#60c090" },
  ] as const;

  const featured = videos.find(v => v.id === featuredId) ?? videos[0];

  const filtered = videos.filter(v => {
    if (selectedCat === "all")   return true;
    if (selectedCat === "short") return v.isShort;
    if (selectedCat === "video") return !v.isShort;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">

      {/* ── 1. Main screen ──────────────────────────────────────────── */}
      <div
        className="relative aspect-video w-full overflow-hidden group cursor-pointer"
        style={{
          background: "#0c0804",
          border: "1px solid #6b4c1e",
          borderRadius: "2px",
          boxShadow: "0 0 0 1px #2a1a08, 0 0 40px rgba(180,120,40,0.2)",
        }}
        onClick={() => featured && setActiveId(featured.id)}
      >
        {/* Gold bar top */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2, zIndex: 10,
          background: "linear-gradient(90deg, transparent, #5a3e14 10%, #c8a040 30%, #f0d882 50%, #c8a040 70%, #5a3e14 90%, transparent)",
        }} />

        {/* Corner ornaments */}
        {["top-2 left-2","top-2 right-2","bottom-8 left-2","bottom-8 right-2"].map((pos, i) => (
          <span key={i} className={`absolute ${pos} z-10 text-xs leading-none`} style={{ color: "#4a3410" }}>✦</span>
        ))}

        {/* Thumbnail của featured video */}
        {featured?.thumbnail ? (
          <Image
            src={featured.thumbnail}
            alt={featured.title}
            fill
            className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-[3s] ease-out"
          />
        ) : (
          <Image
            src={data.imageSrc || ""}
            alt="Magic Mirror"
            fill
            className="object-cover opacity-30 group-hover:scale-105 transition-transform duration-[3s] ease-out"
          />
        )}

        {/* Vignette */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(10,6,2,0.7) 100%)",
        }} />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative group/btn">
            <div className="absolute -inset-4 rounded-full opacity-0 group-hover/btn:opacity-100 transition-all duration-300"
              style={{ background: "rgba(200,160,60,0.15)", filter: "blur(12px)" }} />
            <button
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{
                background: "rgba(20,12,4,0.85)",
                border: "1px solid #8b6530",
                boxShadow: "0 0 0 4px rgba(100,70,20,0.2), inset 0 1px 0 rgba(200,160,80,0.15)",
              }}
            >
              {loading
                ? <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#c8a040" }} />
                : <Play className="w-8 h-8 ml-1" style={{ color: "#c8a040", fill: "#c8a040" }} />
              }
            </button>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 w-full p-5" style={{
          background: "linear-gradient(to top, #0c0804 0%, rgba(12,8,4,0.8) 60%, transparent 100%)",
        }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#c06050" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#a04030" }} />
            </div>
            <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "#c06050" }}>
              Hào quang hiện hữu
            </span>
          </div>
          <h3 className="text-sm sm:text-xl truncate leading-tight" style={{
            color: "#e8c97a",
            textShadow: "0 0 20px rgba(232,200,120,0.3)",
          }}>
            {loading ? "Đang triệu hồi hồi ký..." : (featured?.title ?? "Chưa có video")}
          </h3>
        </div>
      </div>

      {/* ── 2. Category tabs ──────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 transition-all duration-300"
              style={{
                fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
                borderRadius: "2px",
                border: active ? `1px solid ${cat.color}` : "1px solid #3a2810",
                background: active ? `${cat.color}22` : "rgba(0,0,0,0.25)",
                color: active ? cat.color : "#5a4020",
                boxShadow: active ? `0 0 14px ${cat.color}30` : "none",
                transform: active ? "translateY(-1px)" : "none",
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: active ? cat.color : "#4a3410" }} />
              {cat.label}
              {cat.id !== "all" && !loading && (
                <span className="opacity-50 text-[8px]">
                  ({cat.id === "short" ? videos.filter(v => v.isShort).length : videos.filter(v => !v.isShort).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 3. Video grid ─────────────────────────────────────────────── */}
      {error ? (
        <div className="text-center py-8 text-[#6b4c1e] text-xs italic">{error}</div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{
              background: "linear-gradient(160deg, #251a0a, #1a1005)",
              border: "1px solid #3a2810", borderRadius: "2px", padding: "12px",
            }}>
              <div style={{ aspectRatio: "16/9", background: "#2a1a08", borderRadius: "1px" }} />
              <div className="mt-3 space-y-2 px-1">
                <div style={{ height: 12, background: "#2a1a08", borderRadius: 2, width: "80%" }} />
                <div style={{ height: 10, background: "#2a1a08", borderRadius: 2, width: "50%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-[#6b4c1e] text-xs italic flex flex-col items-center gap-2">
          <Flame className="w-6 h-6 opacity-30" />
          Chưa có hồi ký nào trong mục này.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="group transition-all duration-300 cursor-pointer"
              style={{
                background: "linear-gradient(160deg, #251a0a, #1a1005)",
                border: featuredId === v.id ? "1px solid #6b4c1e" : "1px solid #3a2810",
                borderRadius: "2px", padding: "12px",
              }}
              onClick={() => {
                setFeaturedId(v.id);
                setActiveId(v.id);
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "#6b4c1e";
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = "0 0 20px rgba(180,120,40,0.15)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = featuredId === v.id ? "#6b4c1e" : "#3a2810";
                el.style.transform = "none";
                el.style.boxShadow = "none";
              }}
            >
              {/* Thumbnail thật */}
              <div className="relative w-full overflow-hidden" style={{
                aspectRatio: "16/9",
                background: "linear-gradient(160deg, #1a1005, #0c0804)",
                border: "1px solid #2a1a08", borderRadius: "1px",
              }}>
                {v.thumbnail && (
                  <Image
                    src={v.thumbnail}
                    alt={v.title}
                    fill
                    className="object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
                  />
                )}

                {/* Shorts badge */}
                {v.isShort && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                    style={{ background: "#c06050", color: "#fff", borderRadius: "2px" }}>
                    #Shorts
                  </div>
                )}

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 text-[9px] tracking-widest uppercase"
                  style={{
                    background: "rgba(10,6,2,0.85)", border: "1px solid #3a2810",
                    borderRadius: "1px", color: "#8b6530",
                  }}>
                  {v.duration}
                </div>

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "rgba(0,0,0,0.3)" }}>
                  <Play className="w-10 h-10" style={{ color: "#c8a040", fill: "#c8a040", filter: "drop-shadow(0 0 8px rgba(200,160,60,0.6))" }} />
                </div>
              </div>

              {/* Info */}
              <div className="mt-3 space-y-2 px-1">
                <h4 className="text-xs line-clamp-2 transition-colors duration-300"
                  style={{ color: "#c8a870", letterSpacing: "0.03em", lineHeight: "1.5" }}>
                  {v.title}
                </h4>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: "#4a3410" }}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" style={{ color: "#6b4c1e" }} />{v.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" style={{ color: "#6b4c1e" }} />{relativeTime(v.publishedAt)}
                    </span>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center transition-all duration-300 group-hover:border-amber-700"
                    style={{ border: "1px solid #3a2810", borderRadius: "50%" }}>
                    <ChevronRight className="w-3 h-3" style={{ color: "#4a3410" }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 4. Video modal (embed) ─────────────────────────────────────── */}
      {activeId && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-3xl animate-in zoom-in-95 duration-300"
            style={{
              background: "#0c0804",
              border: "1px solid #6b4c1e",
              boxShadow: "0 0 60px rgba(180,120,40,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold top bar */}
            <div style={{
              height: 2,
              background: "linear-gradient(90deg, transparent, #5a3e14 10%, #c8a040 30%, #f0d882 50%, #c8a040 70%, #5a3e14 90%, transparent)",
            }} />

            {/* Close button */}
            <button
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center transition-all duration-200 hover:bg-amber-900/30"
              style={{ border: "1px solid #3a2810", borderRadius: "2px", color: "#6b4c1e" }}
              onClick={closeModal}
            >
              <X className="w-4 h-4" />
            </button>

            {/* iframe embed */}
            <div style={{ aspectRatio: "16/9" }}>
              <iframe
                key={activeId}
                src={`https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0&modestbranding=1`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                style={{ display: "block" }}
              />
            </div>

            {/* Title */}
            <div className="p-4">
              <p className="text-xs truncate" style={{ color: "#8b6530" }}>
                {videos.find(v => v.id === activeId)?.title}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};