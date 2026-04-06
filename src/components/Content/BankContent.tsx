"use client";

import { useEffect, useState } from "react";
import { Building } from "@/types";
import {
  useMapStore,
  selectYtStats,
  selectTotalEnergy,
  selectIsLoading,
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
  MousePointerClick,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  X,
  Coffee,
} from "lucide-react";
import Image from "next/image";

// ── DATA TYPES & INTERFACE ──────────────────────────────────────
interface Transaction {
  user: string;
  amount: string;
  msg: string;
  time: string;
}

export const BankContent = ({ data }: { data: Building }) => {
  // 1. LẤY DỮ LIỆU TỪ ZUSTAND STORE
  const ytStats = useMapStore(selectYtStats);
  const totalEnergy = useMapStore(selectTotalEnergy);
  const fetchYtStats = useMapStore((s) => s.fetchYtStats);
  const isLoading = useMapStore(selectIsLoading);

  // 2. STATE CỤC BỘ (UI)
  const [isHoveringEnergy, setIsHoveringEnergy] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // 3. HẰNG SỐ
  const youtubeChannelUrl = "https://youtube.com/@CuBoVTuber";
  const CONVERSION = {
    SUB: 100,
    VIEW: 1,
    LIKE: 50,
    COMMENT: 10,
  };

  // 4. DỮ LIỆU GIAO DỊCH (Tách biệt để dễ quản lý)
  // Để mảng rỗng [] để hiện thông báo "Người đầu tiên"
  const transactions: Transaction[] = [];

  // 5. ĐỒNG BỘ DỮ LIỆU
  useEffect(() => {
    fetchYtStats();
  }, [fetchYtStats]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── SECTION 1: TREASURY OVERVIEW ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD NĂNG LƯỢNG */}
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
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#3b82f6]"></div>
              <div className="text-[10px] text-blue-400 font-bold uppercase mb-3 tracking-widest border-b border-blue-900/50 pb-2">
                Nguồn lực linh hồn
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-100/60">Thần dân (Sub)</span>
                  <span className="text-blue-400 font-mono">
                    ×{CONVERSION.SUB} ={" "}
                    {(ytStats.subscribers * CONVERSION.SUB).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-100/60">Lượt xem (View)</span>
                  <span className="text-blue-400 font-mono">
                    ×{CONVERSION.VIEW} ={" "}
                    {(ytStats.views * CONVERSION.VIEW).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-100/60">Lượt thích (Like)</span>
                  <span className="text-yellow-400 font-mono">
                    ×{CONVERSION.LIKE} ={" "}
                    {(ytStats.totalLikes * CONVERSION.LIKE).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-100/60">Bình luận</span>
                  <span className="text-purple-400 font-mono">
                    ×{CONVERSION.COMMENT} ={" "}
                    {(
                      ytStats.totalComments * CONVERSION.COMMENT
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-900/30 flex justify-between items-center">
                  <span className="text-[10px] text-white/40 italic">
                    Tổng cộng
                  </span>
                  <span className="text-white font-mono font-bold text-xs">
                    {totalEnergy.toLocaleString()} Sét
                  </span>
                </div>
              </div>
            </div>
          )}

          <Zap className="absolute -right-2 -top-2 w-20 h-20 opacity-10 text-blue-400" />
          <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-2 font-semibold">
            Năng lượng: {data.name}
          </div>
          <div className="text-4xl font-bold text-blue-100 flex items-baseline gap-2">
            {totalEnergy.toLocaleString()}{" "}
            <span className="text-xs font-normal opacity-60">SÉT</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-blue-500/80 italic flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {ytStats.lastUpdated > 0
                ? `Cập nhật: ${new Date(ytStats.lastUpdated).toLocaleTimeString("vi-VN")}`
                : "Di chuột để xem chi tiết"}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchYtStats(true);
              }}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-800/60 rounded hover:bg-blue-900/40 hover:border-blue-500 disabled:opacity-40 transition-all"
            >
              <RefreshCw
                className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>

        {/* CARD NGÂN KHỐ */}
        <div
          className="relative p-6 overflow-hidden group transition-all duration-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          style={{
            background: "linear-gradient(160deg, #251010, #1a0808)",
            border: "1px solid #7a2a20",
            borderRadius: "4px",
          }}
        >
          <Heart className="absolute -right-2 -top-2 w-20 h-20 opacity-10 text-red-500" />
          <div className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-semibold">
            Ngân khố hoàng gia
          </div>
          <div className="text-4xl font-bold text-red-100 flex items-baseline gap-2">
            0{" "}
            <span className="text-xs font-normal text-red-500 opacity-60">
              VNĐ
            </span>
          </div>
          <p className="text-[11px] text-red-400/80 mt-2 italic">
            Tiếp thêm động lực cho Vương quốc phát triển!
          </p>
        </div>
      </div>

      {/* ── SECTION 2: QUICK ACTIONS ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <ExternalLink className="w-4 h-4 text-blue-800 group-hover:text-blue-400" />
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
              <MousePointerClick className="w-4 h-4 text-red-800 group-hover:text-red-400" />
            </a>
          </div>
        </div>

        {/* NHÓM CỐNG PHẨM (QR ONLY) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-amber-500 uppercase text-[10px] tracking-[0.2em] font-bold">
            <Coffee className="w-4 h-4" /> Dâng hiến cống phẩm
          </div>
          <button
            onClick={() => setShowQrModal(true)}
            className="w-full group p-6 text-center border border-amber-900/30 hover:border-amber-500/50 hover:-translate-y-1 transition-all rounded bg-[#1c1408] hover:shadow-[0_10px_30px_rgba(180,120,40,0.15)]"
          >
            <QrCode className="w-12 h-12 mx-auto mb-3 text-amber-600 group-hover:text-amber-400 group-hover:rotate-6 transition-all" />
            <div className="text-xs text-amber-200 font-bold uppercase tracking-widest">
              Mở mã QR Quyên Góp
            </div>
            <div className="text-[10px] text-amber-700 uppercase mt-2 tracking-tighter">
              Hỗ trợ Momo / Ngân hàng Việt Nam
            </div>
          </button>
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

        <div className="overflow-hidden border border-[#3a2810] rounded bg-black/40 min-h-[100px] flex flex-col justify-center">
          {transactions.length > 0 ? (
            transactions.map((t, i) => (
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
            ))
          ) : (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-dashed border-[#6b4c1e] flex items-center justify-center opacity-50">
                <ReceiptText className="w-4 h-4 text-[#6b4c1e]" />
              </div>
              <p className="text-xs text-amber-900/60 font-medium">
                Sổ cái còn trống...
              </p>
              <p className="text-[10px] text-amber-700/40 uppercase tracking-wider">
                Hãy trở thành người đầu tiên donate cho vương quốc Bơ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 4: KINGDOM FOOTER ─────────────────────────────────── */}
      <div className="p-6 text-center border border-dashed border-[#4a3410] rounded relative bg-[#140e06]">
        <p className="text-sm italic text-[#8a6840] max-w-md mx-auto leading-relaxed">
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

      {/* ── SECTION 5: QR MODAL ─────────────────────────────────────── */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative max-w-sm w-full bg-[#1a1208] border-2 border-amber-600/50 p-8 rounded-lg shadow-[0_0_50px_rgba(180,120,40,0.3)] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-amber-600 text-black rounded-full flex items-center justify-center hover:bg-amber-400 transition-colors shadow-lg border-2 border-[#1a1208]"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-6">
              <div className="space-y-1">
                <div className="text-amber-500 uppercase text-[10px] tracking-[0.3em] font-black">
                  Cống phẩm hoàng gia
                </div>
                <div className="h-px w-12 bg-amber-600/50 mx-auto" />
              </div>

              <div className="aspect-square w-full bg-white rounded-xl p-3 shadow-inner flex items-center justify-center group overflow-hidden">
                <Image
                  src="/assets/donate_qr.png"
                  alt="Lord Avatar"
                  width={350}
                  height={350}
                  priority
                  sizes="176px"
                />{" "}
              </div>

              <div className="space-y-2">
                <p className="text-amber-200 text-sm font-bold tracking-widest">
                  NGÂN HÀNG BIDV
                </p>
                <p className="text-amber-600 font-mono text-xl font-black">
                  6522457145
                </p>
                <div className="pt-4 text-[10px] text-amber-900/60 leading-relaxed border-t border-amber-900/20 italic">
                  * Sau khi quyên góp, tên của bạn sẽ được <br /> khắc ghi vĩnh
                  viễn trên sổ cái này.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
