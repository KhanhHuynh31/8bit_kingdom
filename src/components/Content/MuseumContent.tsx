"use client";

import { useState } from "react";
import Image from "next/image";
import { useMapStore } from "@/stores/mapStore";
import {
  Trophy,
  History,
  Library,
  Milestone,
  Sparkles,
  Sword,
  ShieldCheck,
  Crown,
  Map,
  Fingerprint,
  Lock,
  Unlock,
} from "lucide-react";
import { Building } from "@/types";

// ── CONFIGURATION ──────────────────────────────────────────────────────────

const BADGES_DATA = [
  {
    label: "100 Subs",
    icon: Crown,
    color: "text-[#f0d882]",
    borderColor: "border-[#8b6530]",
  },
  {
    label: "First Video",
    icon: Sword,
    color: "text-[#c8a040]",
    borderColor: "border-[#6b4c1e]",
  },
  {
    label: "Top View",
    icon: Sparkles,
    color: "text-[#e8c97a]",
    borderColor: "border-[#8b6530]",
  },
  {
    label: "Partner",
    icon: ShieldCheck,
    color: "text-[#a07830]",
    borderColor: "border-[#6b4c1e]",
  },
];

const CHRONICLE_EVENTS = [
  {
    date: "01/04/2026",
    title: "Khai mở kỷ nguyên",
    desc: "Kênh chính thức ra đời - Những pixel đầu tiên được đặt nền móng.",
    status: "completed",
  },
  {
    date: "--/--/----",
    title: "Chương tiếp theo",
    desc: "Chờ đợi những sử thi mới được ghi chép vào niên giám...",
    status: "waiting",
  },
];

const MEMORY_SLOTS = [
  { id: 1, price: 100 },
  { id: 2, price: 500 },
  { id: 3, price: 1000 },
  { id: 4, price: 2500 },
  { id: 5, price: 5000 },
  { id: 6, price: 10000 },
];

// ─────────────────────────────────────────────────────────────────────────────

export const MuseumContent = ({ data }: { data: Building }) => {
  const { avocados, unlockedMemories, unlockMemory } = useMapStore();
  const [animatingSlot, setAnimatingSlot] = useState<number | null>(null);

  const handleUnlock = (slotId: number, price: number) => {
    // Nếu đã mở khóa rồi thì không làm gì cả
    if (unlockedMemories.includes(slotId)) return;

    // Kiểm tra và thực hiện trừ điểm trong Store
    const success = unlockMemory(slotId, price);

    if (success) {
      setAnimatingSlot(slotId);
      // Hiệu ứng rung và sáng trong 1 giây
      setTimeout(() => setAnimatingSlot(null), 1000);
    } else {
      // Thông báo nhỏ nếu không đủ điểm (có thể thay bằng Toast)
      alert(`Cần thêm ${price - avocados} 🥑 để mở khóa ký ức này!`);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-12 custom-scrollbar max-h-[75vh]">
      {/* 1. KHUNG ẢNH CỔ VẬT (FEATURED EXHIBIT) */}
      <div className="relative h-60 bg-[#1a1208] border-2 border-[#6b4c1e] rounded-sm overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <Image
          src={data.imageSrc || ""}
          alt="Main Exhibit"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-[8s] ease-out filter sepia-[0.2]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161009] via-transparent to-transparent" />

        <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#1a1208]/80 backdrop-blur-sm px-3 py-1.5 border border-[#8b6530]/40 rounded-sm shadow-lg">
          <Fingerprint className="w-3.5 h-3.5 text-[#8b6530]" />
          <span className="text-[#8b6530] text-[10px]  tracking-widest ">
            ENTRY_{data.id}
          </span>
        </div>

        <div className="absolute bottom-5 left-6">
          <div className="flex items-center gap-2 mb-1">
            <Library className="w-4 h-4 text-[#c8a040]" />
            <p
              className="text-[#c8a040] text-[10px]  uppercase tracking-[0.3em]"
              
            >
              Báu vật hoàng gia
            </p>
          </div>
          <h3
            className="text-[#e8c97a] text-2xl  italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            
          >
            &quot;Khởi Nguyên Vương Quốc&quot;
          </h3>
        </div>
      </div>

      {/* 2. SỬ THƯ GHI CHÉP (DESCRIPTION) */}
      <div className="relative bg-[#1a1208]/40 p-6 border-l-2 border-[#8b6530] shadow-inner overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-5 rotate-12">
          <History className="w-32 h-32 text-[#f0d882]" />
        </div>
        <h3
          className="text-[#e8c97a] mb-3 uppercase text-xs tracking-[0.3em]  flex items-center gap-2"
          
        >
          <History className="w-4 h-4 text-[#8b6530]" />
          Sử thi truyền kỳ
        </h3>
        <p
          className="text-[#c8a870] text-base leading-relaxed italic"
          
        >
          &quot;
          {data.description ||
            "Tương truyền từ những ngày đầu xây dựng vương quốc, nơi mọi pixel bắt đầu kết nối thành một huyền thoại bất tử..."}
          &quot;
        </p>
      </div>

      {/* 3. KHO TÀNG HUY HIỆU (BADGES) */}
      <div className="space-y-5">
        <h4
          className="text-[#6b4c1e] text-[11px] uppercase tracking-[0.4em]  flex items-center gap-3 px-1"
          
        >
          <Trophy className="w-4 h-4" />
          Huy hiệu vinh quang
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BADGES_DATA.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className={`group relative p-5 bg-[#1a1208]/60 border ${item.borderColor} rounded-sm flex flex-col items-center justify-center gap-3 hover:bg-[#2a1e0e] transition-all duration-300 cursor-help shadow-lg overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <Icon
                    className={`w-8 h-8 ${item.color} group-hover:scale-110 transition-transform duration-500`}
                  />
                  <div
                    className={`absolute inset-0 blur-xl bg-current opacity-0 group-hover:opacity-30 transition-opacity ${item.color}`}
                  />
                </div>
                <span
                  className="text-[10px] text-[#8b6530]  uppercase text-center tracking-widest group-hover:text-[#f0d882] transition-colors"
                  
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BIÊN NIÊN SỬ (CHRONICLE) */}
      <div className="space-y-5">
        <h4
          className="text-[#6b4c1e] text-[11px] uppercase tracking-[0.4em]  flex items-center gap-3 px-1"
          
        >
          <Milestone className="w-4 h-4" />
          Biên niên sử
        </h4>
        <div className="bg-[#161009] border border-[#3a2810] rounded-sm p-7 space-y-8 relative shadow-inner">
          <div className="absolute left-[34px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-[#8b6530] via-[#3a2810] to-transparent opacity-40" />
          {CHRONICLE_EVENTS.map((event, idx) => (
            <div
              key={idx}
              className={`flex gap-6 items-start relative z-10 transition-opacity duration-500 ${event.status === "waiting" ? "opacity-30 grayscale hover:opacity-100 hover:grayscale-0" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full bg-[#1a1208] border-2 flex items-center justify-center shadow-lg transition-colors ${event.status === "completed" ? "border-[#c8a040]" : "border-[#3a2810]"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${event.status === "completed" ? "bg-[#f0d882] animate-pulse" : "bg-[#3a2810]"}`}
                />
              </div>
              <div className="pt-1">
                <span className="text-[#8b6530]  text-[11px] block mb-1  tracking-tighter">
                  [{event.date}]
                </span>
                <h5
                  className="text-[#e8c97a] text-sm  uppercase mb-1 tracking-wide"
                  
                >
                  {event.title}
                </h5>
                <p
                  className="text-[#c8a870] text-xs leading-relaxed italic"
                  
                >
                  {event.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. MẢNH VỠ KÝ ỨC (MỞ KHÓA BẰNG BƠ) */}
      <div className="space-y-5 pb-6">
        <div className="flex justify-between items-center px-1">
          <h4
            className="text-[#6b4c1e] text-[11px] uppercase tracking-[0.4em]  flex items-center gap-3"
            
          >
            <Map className="w-4 h-4" />
            Mảnh vỡ ký ức
          </h4>
          <div className="flex items-center gap-2 bg-[#1a1208] px-3 py-1 border border-[#8b6530]/30 rounded-full shadow-inner">
            <span className="text-[#f0d882] text-xs  ">
              {avocados.toLocaleString()}
            </span>
            <span className="text-[10px]">🥑</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {MEMORY_SLOTS.map((slot) => {
            const isUnlocked = unlockedMemories.includes(slot.id);
            const isAnimating = animatingSlot === slot.id;

            return (
              <div
                key={slot.id}
                onClick={() => handleUnlock(slot.id, slot.price)}
                className={`
                  aspect-square relative overflow-hidden group border rounded-sm flex items-center justify-center transition-all duration-500 cursor-pointer shadow-md
                  ${
                    isUnlocked
                      ? "bg-[#2a1e0e] border-[#8b6530] hover:shadow-[0_0_15px_rgba(200,160,64,0.4)]"
                      : "bg-[#1a1208] border-[#3a2810] hover:border-[#6b4c1e]"
                  }
                  ${isAnimating ? "animate-unlock-success ring-2 ring-yellow-400" : ""}
                `}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

                {/* Nội dung hiển thị */}
                <div
                  className={`flex flex-col items-center gap-1.5 z-10 transition-all duration-700 
                  ${isUnlocked ? "opacity-100 scale-110" : "opacity-30 group-hover:opacity-60"}`}
                >
                  {isUnlocked ? (
                    <>
                      <Sparkles className="w-6 h-6 text-[#f0d882]" />
                      <span className="text-[9px] text-[#f0d882]   tracking-widest">
                        ARCHIVE_{slot.id}
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-[#6b4c1e]" />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#8b6530]  ">
                          {slot.price}
                        </span>
                        <span className="text-[8px]">🥑</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Overlay khi chưa mở khóa */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                    <Unlock className="w-5 h-5 text-[#f0d882] animate-bounce" />
                  </div>
                )}

                {/* Góc trang trí */}
                <div
                  className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${isUnlocked ? "border-[#f0d882]" : "border-[#3a2810]"}`}
                />
                <div
                  className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${isUnlocked ? "border-[#f0d882]" : "border-[#3a2810]"}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes unlock-success {
          0% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.1);
            filter: brightness(2);
          }
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
        }

        .animate-unlock-success {
          animation: unlock-success 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
