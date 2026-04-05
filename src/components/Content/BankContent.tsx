"use client";

import { useEffect, useState } from "react";
import { Building } from "@/types";
import {
  useMapStore,
  selectYtStats,
  selectTotalEnergy,
} from "@/stores/mapStore";
import {
  ReceiptText,
  HandHeart,
  QrCode,
  Zap,
  Users,
  Heart,
  ExternalLink,
  Play,
  Coffee,
  MousePointerClick,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export const BankContent = ({ data }: { data: Building }) => {
  // 1. LẤY DỮ LIỆU TỪ ZUSTAND STORE (CENTRALIZED STATE)
  const ytStats = useMapStore(selectYtStats);
  const totalEnergy = useMapStore(selectTotalEnergy);
  const fetchYtStats = useMapStore((s) => s.fetchYtStats);
  // State cục bộ chỉ dành cho UI (Hover)
  const [isHoveringEnergy, setIsHoveringEnergy] = useState(false);

  // 2. ĐỊNH NGHĨA HẰNG SỐ & ĐƯỜNG DẪN
  const youtubeChannelUrl = "https://youtube.com/@CuBoVTuber";
  const CONVERSION = { SUB: 100, VIEW: 1 };

  // 3. ĐỒNG BỘ DỮ LIỆU KHI MOUNT
  useEffect(() => {
    fetchYtStats(); // Gọi action từ Store để cập nhật số liệu mới nhất
  }, [fetchYtStats]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── SECTION 1: TREASURY OVERVIEW ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD NĂNG LƯỢNG (VỚI POPUP PHÍA DƯỚI) */}
        <div
          className="relative p-6 transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] cursor-help"
          style={{
            background: "linear-gradient(160deg, #0a1a2e, #16213e)",
            border: "1px solid #0f3460",
            borderRadius: "4px",
          }}
          onMouseEnter={() => setIsHoveringEnergy(true)}
          onMouseLeave={() => setIsHoveringEnergy(false)}
        >
          {/* POPUP CHI TIẾT NĂNG LƯỢNG */}
          {isHoveringEnergy && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 p-4 z-50 animate-in slide-in-from-top-2 zoom-in-95 duration-200"
              style={{
                background: "#0a1a2e",
                border: "2px solid #3b82f6",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
            >
              {/* Mũi tên hướng lên trên */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#3b82f6]"></div>

              <div className="text-[10px] text-blue-400 font-bold uppercase mb-3 tracking-widest border-b border-blue-900/50 pb-2">
                Nguồn lực linh hồn
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-100/60">Thần dân (Sub)</span>
                  <span className="text-blue-400 font-mono">
                    +{ytStats.subscribers.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-100/60">Lượt xem (View)</span>
                  <span className="text-blue-400 font-mono">
                    +{ytStats.views.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-900/30 flex justify-between items-center">
                  <span className="text-[10px] text-white/40 italic text-right">
                    Mỗi Sub nhận {CONVERSION.SUB} Sét
                  </span>
                </div>
              </div>
            </div>
          )}

          <Zap className="absolute -right-2 -top-2 w-20 h-20 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 text-blue-400" />
          <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-2 font-semibold">
            Năng lượng: {data.name}
          </div>
          <div className="text-4xl font-bold text-blue-100 flex items-baseline gap-2">
            {totalEnergy.toLocaleString()}{" "}
            <span className="text-xs font-normal opacity-60">SÉT</span>
          </div>
          <p className="text-[11px] text-blue-500/80 mt-2 italic flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Di chuột để xem chi tiết
          </p>
        </div>

        {/* CARD NGÂN KHỐ (DONATE) */}
        <div
          className="relative p-6 overflow-hidden group transition-all duration-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          style={{
            background: "linear-gradient(160deg, #251010, #1a0808)",
            border: "1px solid #7a2a20",
            borderRadius: "4px",
          }}
        >
          <Heart className="absolute -right-2 -top-2 w-20 h-20 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 text-red-500" />
          <div className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-semibold">
            Ngân khố hoàng gia
          </div>
          <div className="text-4xl font-bold text-red-100 flex items-baseline gap-2">
            1.25M{" "}
            <span className="text-xs font-normal text-red-500 opacity-60">
              VNĐ
            </span>
          </div>
          <p className="text-[11px] text-red-400/80 mt-2 italic">
            Dành riêng cho thiết bị stream.
          </p>
        </div>
      </div>

      {/* ── SECTION 2: QUICK ACTIONS ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NHÓM TĂNG NĂNG LƯỢNG */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-blue-400 uppercase text-[10px] tracking-[0.2em] font-bold">
            <Play className="w-4 h-4 fill-current" /> Truyền linh khí
          </div>
          <div className="grid grid-cols-1 gap-2">
            <a
              href={youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 transition-all duration-300 hover:translate-x-2 border border-blue-900/30 rounded bg-blue-950/20 hover:bg-blue-900/40 hover:border-blue-500/50"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded group-hover:scale-110 transition-transform">
                  <Users className="text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-blue-100 font-medium">
                    Đăng ký kênh
                  </div>
                  <div className="text-[10px] text-blue-600">
                    Góp sức xây dựng vương quốc
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-800 group-hover:text-blue-400 transition-colors" />
            </a>
            <a
              href={youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 transition-all duration-300 hover:translate-x-2 border border-red-900/30 rounded bg-red-950/20 hover:bg-red-900/40 hover:border-red-500/50"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-500/10 rounded group-hover:scale-110 transition-transform">
                  <Heart className="text-red-400" />
                </div>
                <div>
                  <div className="text-sm text-red-100 font-medium">
                    Tương tác video
                  </div>
                  <div className="text-[10px] text-red-600">
                    Mỗi Like là một nguồn động lực
                  </div>
                </div>
              </div>
              <MousePointerClick className="w-4 h-4 text-red-800 group-hover:text-red-400 transition-colors" />
            </a>
          </div>
        </div>

        {/* NHÓM CỐNG PHẨM */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-amber-500 uppercase text-[10px] tracking-[0.2em] font-bold">
            <Coffee className="w-4 h-4" /> Dâng hiến cống phẩm
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="group p-4 text-center cursor-pointer border border-amber-900/30 hover:border-amber-500/50 hover:-translate-y-1 transition-all rounded bg-[#1c1408] hover:shadow-[0_10px_20px_rgba(180,120,40,0.1)]">
              <QrCode className="w-8 h-8 mx-auto mb-2 text-amber-600 group-hover:text-amber-400 group-hover:rotate-6 transition-all" />
              <div className="text-[10px] text-amber-200">Quét mã QR</div>
              <div className="text-[8px] text-amber-700 uppercase mt-1 tracking-tighter">
                Momo / Ngân hàng
              </div>
            </div>
            <a
              href="https://playerduo.net/cu-bo"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 text-center border border-emerald-900/30 hover:border-emerald-500/50 hover:-translate-y-1 transition-all rounded bg-[#081c12] hover:shadow-[0_10px_20px_rgba(16,185,129,0.1)]"
            >
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-600 group-hover:text-emerald-400 group-hover:animate-pulse transition-all" />
              <div className="text-[10px] text-emerald-200">PlayerDuo</div>
              <div className="text-[8px] text-emerald-700 uppercase mt-1 tracking-tighter">
                Thông báo trên Live
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: TRANSACTION LOG ────────────────────────────────── */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-3 px-1">
          <ReceiptText className="w-4 h-4 text-[#6b4c1e]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#6b4c1e]">
            Sổ cái vương quốc
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-[#6b4c1e]/40 to-transparent" />
        </div>

        <div className="overflow-hidden border border-[#3a2810] rounded bg-black/40">
          {[
            {
              user: "Lữ khách ẩn danh",
              amount: "+50.000đ",
              msg: "Cụ Bơ làm video hay lắm!",
              time: "10 phút trước",
            },
            {
              user: "Hiệp sĩ Kael",
              amount: "+20.000đ",
              msg: "Ủng hộ dự án 8-bit.",
              time: "2 giờ trước",
            },
          ].map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border-b border-[#2a1a08] last:border-0 hover:bg-amber-900/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <div>
                  <div className="text-xs text-amber-200 font-medium">
                    {t.user}
                  </div>
                  <div className="text-[10px] italic text-amber-800 leading-relaxed">
                    &quot;{t.msg}&quot;
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-400 font-mono font-bold">
                  {t.amount}
                </div>
                <div className="text-[8px] text-[#3a2810] uppercase font-semibold">
                  {t.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: KINGDOM FOOTER ─────────────────────────────────── */}
      <div className="p-6 text-center border border-dashed border-[#4a3410] rounded relative overflow-hidden group bg-[#140e06]">
        <p className="text-sm italic text-[#8a6840] max-w-md mx-auto leading-relaxed relative z-10">
          &quot;Vương quốc không xây dựng từ gạch đá, mà từ lòng tin. Mỗi hành
          động của bạn giúp Cụ Bơ có thêm động lực.&quot;
        </p>
        <div className="mt-4 flex justify-center gap-6 text-[9px] uppercase tracking-widest text-[#4a3410] font-bold">
          <span className="flex items-center gap-1">
            <HandHeart className="w-3 h-3" /> Minh bạch hoàng gia
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Bảo mật tuyệt đối
          </span>
        </div>
      </div>
    </div>
  );
};
