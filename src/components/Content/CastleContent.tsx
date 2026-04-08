"use client";

import { Building } from "@/types";
import Image from "next/image";
import {
  Play,
  Send,
  MessageSquare,
  Mail,
  Users,
  Video,
  Flame,
  Gem,
  MapPin,
  Scroll,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { selectTotalEnergy, useMapStore } from "@/stores/mapStore";

export const CastleContent = ({ data }: { data: Building }) => {
  const subscribers = useMapStore((state) => state.ytStats.subscribers);
  const videoCount = useMapStore((state) => state.ytStats.videoCount);
  const avocados = useMapStore((state) => state.avocados);
  const totalEnergy = useMapStore(selectTotalEnergy);
  const socialLinks = [
    {
      label: "YouTube",
      icon: Play,
      url: "https://www.youtube.com/@pu8bit",
      borderColor: "#7a2a1a",
      iconColor: "#c07060",
      glow: "rgba(180,60,40,0.3)",
    },
    {
      label: "TikTok",
      icon: Send,
      url: "#",
      borderColor: "#3a3a4a",
      iconColor: "#a0a0c0",
      glow: "rgba(160,160,200,0.2)",
    },
    {
      label: "Discord",
      icon: MessageSquare,
      url: "https://discord.gg/eyY9PYBA38",
      borderColor: "#3a3a7a",
      iconColor: "#8080d0",
      glow: "rgba(100,100,220,0.25)",
    },
    {
      label: "quockhank318@gmail.com",
      icon: Mail,
      url: "mailto:quockhank318@gmail.com",
      borderColor: "#1a5a3a",
      iconColor: "#60c090",
      glow: "rgba(60,160,100,0.25)",
    },
  ];

  const stats = [
    {
      label: "Cư dân",
      val: subscribers,
      icon: Users,
      color: "#c8a040",
    },
    {
      label: "Văn thư",
      val: videoCount,
      icon: Video,
      color: "#60c090",
    },
    { label: "Nhiệt lượng", val: totalEnergy, icon: Flame, color: "#c06050" },
    { label: "Hạt bơ", val: avocados, icon: Gem, color: "#7aaad4" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── 1. Profile header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
        {/* Avatar */}
        <div className="relative group mx-auto md:mx-0 flex-shrink-0">
          <div
            className="w-36 h-36 md:w-44 md:h-44 p-2 rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #2a1e0e, #1a1005)",
              border: "2px solid #6b4c1e",
              borderRadius: "1.5rem",
              boxShadow:
                "0 0 40px rgba(180,120,40,0.2), inset 0 1px 0 rgba(200,160,80,0.1)",
            }}
          >
            <div
              className="relative w-full h-full overflow-hidden"
              style={{ borderRadius: "1.2rem" }}
            >
              <Image
                src={data.imageSrc || ""}
                alt="Lord Avatar"
                fill
                priority
                sizes="176px"
                className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
              />
            </div>
          </div>
          {/* Shield badge */}
          <div
            className="absolute -bottom-2 right-2 p-1.5"
            style={{
              background: "#c8a040",
              border: "2px solid #1c1408",
              borderRadius: "8px",
              boxShadow: "0 0 12px rgba(200,160,60,0.5)",
            }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: "#1c1408" }} />
          </div>
        </div>

        {/* Name & bio */}
        <div className="flex-1 space-y-4">
          <div>
            <h2
              className="text-4xl uppercase leading-none mb-3"
              style={{
                fontWeight: 700,
                color: "#e8c97a",
                letterSpacing: "0.04em",
                textShadow:
                  "0 0 30px rgba(232,200,120,0.35), 0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              {data.name || "Pixel Kingdom"}
            </h2>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              {/* Rank badge */}
              <span
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-3 py-1"
                style={{
                  color: "#c8a040",
                  background: "rgba(140,100,30,0.2)",
                  border: "1px solid #6b4c1e",
                  borderRadius: "2px",
                }}
              >
                ⚜ High King
              </span>
              {/* Location badge */}
              <span
                className="flex items-center gap-1.5 text-[10px] px-3 py-1"
                style={{
                  color: "#7a5a28",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid #3a2810",
                  borderRadius: "2px",
                }}
              >
                <MapPin className="w-3 h-3" style={{ color: "#c06050" }} /> Việt
                Nam
              </span>
            </div>
          </div>

          {/* Quote */}
          <p
            className="text-sm leading-relaxed italic max-w-xl"
            style={{
              color: "#a08050",
              borderLeft: "2px solid #4a3410",
              paddingLeft: "16px",
            }}
          >
            &#8220;
            {data.description ||
              "Nơi khởi nguồn của những giấc mơ pixel và những cuộc hành trình bất tận qua các vùng đất số..."}
            &#8221;
          </p>
        </div>
      </div>

      {/* ── 2. Kingdom metrics ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div
            key={i}
            className="relative group overflow-hidden transition-all duration-300"
            style={{
              background: "linear-gradient(160deg, #251a0a, #1a1005)",
              border: "1px solid #3a2810",
              borderRadius: "2px",
              padding: "18px",
              boxShadow: "inset 0 1px 0 rgba(200,160,80,0.05)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#6b4c1e";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                `0 0 20px rgba(180,120,40,0.15), inset 0 1px 0 rgba(200,160,80,0.08)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#3a2810";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "inset 0 1px 0 rgba(200,160,80,0.05)";
            }}
          >
            {/* Watermark icon */}
            <div className="absolute -right-2 -bottom-2 opacity-[0.04] group-hover:opacity-[0.09] transition-opacity">
              <s.icon className="w-16 h-16" />
            </div>
            <s.icon className="w-4 h-4 mb-3" style={{ color: s.color }} />
            <p
              className="text-2xl tracking-tight"
              style={{
                color: "#e8c97a",
                textShadow: "0 0 12px rgba(232,200,120,0.25)",
              }}
            >
              {s.val}
            </p>
            <p
              className="text-[9px] uppercase tracking-widest mt-1"
              style={{ color: "#5a4020" }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── 3. Story & Diplomacy ──────────────────────────────────────── */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        {/* Biography */}
        <div className="md:col-span-7 space-y-4">
          {/* Section heading */}
          <div className="flex items-center gap-3 px-1">
            <div
              className="h-px w-8"
              style={{
                background: "linear-gradient(90deg, transparent, #6b4c1e)",
              }}
            />
            <span
              className="text-[9px] uppercase tracking-[0.4em]"
              style={{ color: "#6b4c1e" }}
            >
              Sử thi vương quốc
            </span>
            <div
              className="h-px flex-1"
              style={{
                background: "linear-gradient(90deg, #6b4c1e, transparent)",
              }}
            />
          </div>

          <div
            style={{
              background: "linear-gradient(160deg, #1c1208, #140e06)",
              border: "1px solid #3a2810",
              borderRadius: "2px",
              padding: "20px 24px",
              boxShadow: "inset 0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            {/* Candle glow */}
            <div
              className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 100% 0%, rgba(200,160,60,0.06), transparent 70%)",
              }}
            />
            <div className="flex items-start gap-4">
              <div
                className="p-3 flex-shrink-0"
                style={{
                  background: "rgba(140,100,30,0.15)",
                  border: "1px solid #4a3410",
                  borderRadius: "2px",
                }}
              >
                <Scroll className="w-5 h-5" style={{ color: "#c8a040" }} />
              </div>
              <div
                className="space-y-3 text-sm leading-relaxed italic"
                style={{ color: "#a08050" }}
              >
                <p>
                  Khởi nguồn từ một ý tưởng nhỏ trong thế giới Pixel Vương Quốc,
                  vương quốc này đã vươn mình trở thành một thánh địa sáng tạo.
                </p>
                <p>
                  Mỗi tác phẩm là một mảnh ghép của lịch sử, được tôi luyện qua
                  những giờ làm việc miệt mài và sự ủng hộ nhiệt thành từ cộng
                  đồng.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social links */}
        <div className="md:col-span-5 space-y-4">
          {/* Section heading */}
          <div className="flex items-center gap-3 px-1">
            <div
              className="h-px w-8"
              style={{
                background: "linear-gradient(90deg, transparent, #6b4c1e)",
              }}
            />
            <span
              className="text-[9px] uppercase tracking-[0.4em]"
              style={{ color: "#6b4c1e" }}
            >
              Cổng liên kết
            </span>
            <div
              className="h-px flex-1"
              style={{
                background: "linear-gradient(90deg, #6b4c1e, transparent)",
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {socialLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  className="group flex items-center justify-between transition-all duration-300"
                  style={{
                    background: "linear-gradient(160deg, #251a0a, #1a1005)",
                    border: `1px solid ${link.borderColor}`,
                    borderRadius: "2px",
                    padding: "10px 14px",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.boxShadow = `0 0 20px ${link.glow}, inset 0 1px 0 rgba(200,160,80,0.06)`;
                    el.style.borderColor = link.iconColor;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.boxShadow = "none";
                    el.style.borderColor = link.borderColor;
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon container */}
                    <div
                      className="p-2 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        background: "rgba(0,0,0,0.35)",
                        border: `1px solid ${link.borderColor}`,
                        borderRadius: "2px",
                        color: link.iconColor,
                      }}
                    >
                      <Icon className="w-5 h-5" fill="currentColor" />
                    </div>
                    {/* Label */}
                    <span
                      className="text-xs tracking-[0.2em]"
                      style={{
                        color: "#c8a870",
                      }}
                    >
                      {link.label}
                    </span>
                  </div>

                  {/* Chevron */}
                  <ChevronRight
                    className="w-4 h-4 opacity-20 group-hover:opacity-80 group-hover:translate-x-1 transition-all duration-300"
                    style={{ color: link.iconColor }}
                  />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap");
      `}</style>
    </div>
  );
};
