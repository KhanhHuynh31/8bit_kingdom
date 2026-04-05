"use client";

import { useEffect, useState } from "react";
import { Building } from "@/types";
import { 
  useMapStore, 
  selectYtStats, 
  selectTotalEnergy 
} from "@/stores/mapStore";
import {
  ReceiptText,
  QrCode,
  Zap,
  Users,
  Heart,
  ExternalLink,
  Play,
  Coffee,
} from "lucide-react";

export const BankContent = ({ data }: { data: Building }) => {
  // 1. LẤY DỮ LIỆU TỪ ZUSTAND STORE
  const ytStats = useMapStore(selectYtStats);
  const totalEnergy = useMapStore(selectTotalEnergy);
  
  // FIX: Lấy trực tiếp hàm fetchStats để tránh lỗi "getSnapshot" (Infinite Loop)
  // Trong Zustand, các function là stable reference, lấy lẻ thế này sẽ không bị render lại vô ích
  const fetchYtStats = useMapStore((s) => s.fetchYtStats);

  const [isHoveringEnergy, setIsHoveringEnergy] = useState(false);

  const youtubeChannelUrl = "https://youtube.com/@CuBoVTuber";

  // 2. ĐỒNG BỘ DỮ LIỆU
  useEffect(() => {
    fetchYtStats();
  }, [fetchYtStats]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── SECTION 1: ENERGY & TREASURY ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div 
          className="relative p-6 transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] cursor-help" 
          style={{ background: "linear-gradient(160deg, #0a1a2e, #16213e)", border: "1px solid #0f3460", borderRadius: "4px" }}
          onMouseEnter={() => setIsHoveringEnergy(true)}
          onMouseLeave={() => setIsHoveringEnergy(false)}
        >
          {isHoveringEnergy && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 p-4 z-50 animate-in slide-in-from-top-2 zoom-in-95 duration-200"
                 style={{ background: "#0a1a2e", border: "2px solid #3b82f6", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#3b82f6]"></div>
              
              <div className="text-[10px] text-blue-400 font-bold uppercase mb-3 tracking-widest border-b border-blue-900/50 pb-2">
                Nguồn lực linh hồn
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-100/60">Thần dân (Sub)</span>
                  <span className="text-blue-400 font-mono">+{ytStats.subscribers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-100/60">Lượt xem (View)</span>
                  <span className="text-blue-400 font-mono">+{ytStats.views.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <Zap className="absolute -right-2 -top-2 w-20 h-20 opacity-10 text-blue-400" />
          <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-2 font-semibold">
            Năng lượng: {data.name}
          </div>
          <div className="text-4xl font-bold text-blue-100 flex items-baseline gap-2">
            {totalEnergy.toLocaleString()} <span className="text-xs font-normal opacity-60">SÉT</span>
          </div>
        </div>

        <div className="relative p-6 group transition-all duration-500" 
             style={{ background: "linear-gradient(160deg, #251010, #1a0808)", border: "1px solid #7a2a20", borderRadius: "4px" }}>
          <Heart className="absolute -right-2 -top-2 w-20 h-20 opacity-10 text-red-500" />
          <div className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-semibold">Ngân khố hoàng gia</div>
          <div className="text-4xl font-bold text-red-100 flex items-baseline gap-2">
            1.25M <span className="text-xs font-normal text-red-500 opacity-60">VNĐ</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: ACTIONS ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-blue-400 uppercase text-[10px] tracking-[0.2em] font-bold">
            <Play className="w-4 h-4 fill-current" /> Truyền linh khí
          </div>
          <div className="grid grid-cols-1 gap-2">
            <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer"
               className="group flex items-center justify-between p-4 transition-all duration-300 border border-blue-900/30 rounded bg-blue-950/20 hover:bg-blue-900/40">
              <div className="flex items-center gap-4">
                <Users className="text-blue-400" />
                <div className="text-sm text-blue-100">Đăng ký kênh</div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-800" />
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-amber-500 uppercase text-[10px] tracking-[0.2em] font-bold">
            <Coffee className="w-4 h-4" /> Dâng hiến cống phẩm
          </div>
          <div className="grid grid-cols-2 gap-2">
             <div className="group p-4 text-center border border-amber-900/30 rounded bg-[#1c1408]">
                <QrCode className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                <div className="text-[10px] text-amber-200">Quét mã QR</div>
             </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: LOG ────────────────────────────────── */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-3 px-1">
          <ReceiptText className="w-4 h-4 text-[#6b4c1e]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b4c1e]">Sổ cái vương quốc</span>
        </div>
        
        <div className="overflow-hidden border border-[#3a2810] rounded bg-black/40">
          <div className="p-4 border-b border-[#2a1a08] hover:bg-amber-900/10 transition-colors">
            <div className="flex justify-between items-center">
              <span className="text-xs text-amber-200 font-medium">Lữ khách ẩn danh</span>
              <span className="text-xs text-emerald-400 font-mono">+50.000đ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};