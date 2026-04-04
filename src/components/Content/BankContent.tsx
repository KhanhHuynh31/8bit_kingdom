"use client";

import { Building } from "@/types";
import {
  Coins,
  ReceiptText,
  HandHeart,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CreditCard,
  QrCode,
  HeartHandshake,
} from "lucide-react";

// ─── Local icon ───────────────────────────────────────────────────────────────
const PlayCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
export const BankContent = ({ data }: { data: Building }) => {
  const kingdomName = data.name || "Pixel Kingdom";

  const transactions = [
    {
      id: 1,
      user: "Lữ khách ẩn danh",
      amount: "+50.000đ",
      date: "10 phút trước",
      msg: "Chúc vương quốc phát triển!",
    },
    {
      id: 2,
      user: "Hiệp sĩ Kael",
      amount: "+20.000đ",
      date: "2 giờ trước",
      msg: "Mời chủ thớt ly cafe sáng.",
    },
    {
      id: 3,
      user: "Thợ rèn Pixel",
      amount: "+100.000đ",
      date: "5 giờ trước",
      msg: "Ủng hộ dự án mới.",
    },
  ];

  return (
    <div
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
      
    >

      {/* ── 1. Treasury overview ──────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #2a1e0e 0%, #1c1408 60%, #221910 100%)",
          border: "1px solid #6b4c1e",
          borderRadius: "2px",
          padding: "24px",
          boxShadow: "0 0 40px rgba(180,120,40,0.15), inset 0 1px 0 rgba(200,160,80,0.1)",
        }}
      >
        {/* Top shimmer line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, #5a3e14 10%, #c8a040 30%, #f0d882 50%, #c8a040 70%, #5a3e14 90%, transparent)",
        }} />

        {/* Watermark coin */}
        <div className="absolute top-0 right-0 p-6 opacity-[0.04] rotate-12 pointer-events-none">
          <Coins className="w-36 h-36" style={{ color: "#c8a040" }} />
        </div>

        {/* Candle glow */}
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{
          background: "radial-gradient(circle at 100% 0%, rgba(200,160,60,0.08), transparent 65%)",
        }} />

        <div className="relative space-y-1">
          <div
            className="flex items-center gap-2 uppercase text-[9px] tracking-[0.25em] mb-3"
            
          >
            <ShieldCheck className="w-3 h-3" style={{ color: "#c8a040" }} />
            Ngân khố hoàng gia — {kingdomName}
          </div>

          <h3
            className="text-3xl tracking-tight flex items-baseline gap-3"
            style={{color: "#e8c97a", textShadow: "0 0 20px rgba(232,200,120,0.3)" }}
          >
            9.402
            <span
              className="text-sm uppercase"
              style={{color: "#a07840", letterSpacing: "0.15em" }}
            >
              Hạt Bơ
            </span>
          </h3>
          <p className="text-sm italic mt-1" style={{ color: "#5a4020" }}>
            Toàn bộ ngân khố được dùng để tái đầu tư vào nội dung.
          </p>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[
            { label: "Tổng nhận tháng này", value: "+1.200.000đ", icon: ArrowUpRight, color: "#60c090" },
            { label: "Số lượt ủng hộ",      value: "156 Lữ khách", icon: HeartHandshake, color: "#7aaad4" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid #3a2810",
                borderRadius: "2px",
                padding: "12px 14px",
              }}
            >
              <p
                className="text-[9px] uppercase tracking-widest mb-2"
                style={{color: "#4a3410" }}
              >
                {s.label}
              </p>
              <div className="flex items-center gap-2" style={{ color: s.color }}>
                <s.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Donation gateway ───────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Heading */}
        <div className="flex items-center gap-3 px-1">
          <div className="h-px w-6" style={{ background: "linear-gradient(90deg, transparent, #6b4c1e)" }} />
          <CreditCard className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#6b4c1e" }} />
          <span
            className="text-[9px] uppercase tracking-[0.35em]"
            style={{color: "#6b4c1e" }}
          >
            Cổng tiếp nhận cống phẩm
          </span>
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, #6b4c1e, transparent)" }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Momo / Bank QR */}
          <div
            className="group cursor-pointer transition-all duration-300"
            style={{
              background: "linear-gradient(160deg, #251a0a, #1a1005)",
              border: "1px solid #4a2a20",
              borderRadius: "2px",
              padding: "16px",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "#c06080";
              el.style.boxShadow = "0 0 20px rgba(180,60,80,0.25)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "#4a2a20";
              el.style.boxShadow = "none";
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="p-2"
                style={{
                  background: "rgba(180,60,80,0.12)",
                  border: "1px solid #7a2a40",
                  borderRadius: "2px",
                  color: "#c06080",
                }}
              >
                <QrCode className="w-5 h-5" />
              </div>
              <span
                className="text-[8px] uppercase tracking-widest px-2 py-1"
                style={{
                  
                  background: "rgba(180,60,80,0.12)",
                  border: "1px solid #7a2a40",
                  borderRadius: "2px",
                  color: "#c06080",
                }}
              >
                Quét mã nhanh
              </span>
            </div>
            <h5
              className="text-sm mb-1"
              style={{color: "#e8c97a", letterSpacing: "0.04em" }}
            >
              Ví Momo / Ngân hàng
            </h5>
            <p className="text-xs italic" style={{ color: "#5a4020" }}>
              Hỗ trợ QR Code mọi ngân hàng Việt Nam.
            </p>
          </div>

          {/* PlayerDuo / Wescan */}
          <div
            className="group cursor-pointer transition-all duration-300"
            style={{
              background: "linear-gradient(160deg, #251a0a, #1a1005)",
              border: "1px solid #1a4a2a",
              borderRadius: "2px",
              padding: "16px",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "#60c090";
              el.style.boxShadow = "0 0 20px rgba(60,160,100,0.25)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "#1a4a2a";
              el.style.boxShadow = "none";
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="p-2"
                style={{
                  background: "rgba(60,160,100,0.12)",
                  border: "1px solid #1a6a3a",
                  borderRadius: "2px",
                  color: "#60c090",
                }}
              >
                <PlayCircle className="w-5 h-5" />
              </div>
              <span
                className="text-[8px] uppercase tracking-widest px-2 py-1"
                style={{
                  
                  background: "rgba(60,160,100,0.12)",
                  border: "1px solid #1a6a3a",
                  borderRadius: "2px",
                  color: "#60c090",
                }}
              >
                Hiện thông báo
              </span>
            </div>
            <h5
              className="text-sm mb-1"
              style={{color: "#e8c97a", letterSpacing: "0.04em" }}
            >
              PlayerDuo / Wescan
            </h5>
            <p className="text-xs italic" style={{ color: "#5a4020" }}>
              Xuất hiện lời nhắn trên màn hình Live.
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Transaction log ────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Heading */}
        <div className="flex items-center gap-3 px-1">
          <div className="h-px w-6" style={{ background: "linear-gradient(90deg, transparent, #6b4c1e)" }} />
          <ReceiptText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#6b4c1e" }} />
          <span
            className="text-[9px] uppercase tracking-[0.35em]"
            style={{color: "#6b4c1e" }}
          >
            Sổ cái vương quốc
          </span>
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, #6b4c1e, transparent)" }} />
        </div>

        <div
          style={{
            background: "linear-gradient(160deg, #1c1208, #140e06)",
            border: "1px solid #3a2810",
            borderRadius: "2px",
            overflow: "hidden",
            boxShadow: "inset 0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          {transactions.map((t, i) => (
            <div
              key={t.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-200"
              style={{
                padding: "14px 18px",
                borderBottom: i < transactions.length - 1 ? "1px solid #2a1a08" : "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(200,160,60,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar circle */}
                <div
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(60,160,100,0.1)",
                    border: "1px solid #1a4a2a",
                    borderRadius: "50%",
                  }}
                >
                  <ArrowDownLeft className="w-4 h-4" style={{ color: "#60c090" }} />
                </div>
                <div>
                  <p
                    className="text-xs"
                    style={{color: "#c8a870", letterSpacing: "0.04em" }}
                  >
                    {t.user}
                  </p>
                  <p className="text-[11px] italic mt-0.5" style={{ color: "#5a4020" }}>
                    &quot;{t.msg}&quot;
                  </p>
                </div>
              </div>

              <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                <p
                  className="text-sm"
                  style={{color: "#60c090", letterSpacing: "0.04em" }}
                >
                  {t.amount}
                </p>
                <p className="text-[9px] uppercase tracking-widest" style={{ color: "#3a2810" }}>
                  {t.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Gratitude ──────────────────────────────────────────────── */}
      <div
        className="text-center space-y-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #251a08, #1a1205)",
          border: "1px solid #4a3410",
          borderRadius: "2px",
          padding: "24px",
          boxShadow: "inset 0 1px 0 rgba(200,160,80,0.06)",
        }}
      >
        {/* Corner ornaments */}
        {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos, i) => (
          <span key={i} className={`absolute ${pos} text-[#3a2810] text-xs leading-none`}>✦</span>
        ))}

        {/* Candle glow top */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(200,160,60,0.07), transparent 60%)",
        }} />

        <div
          className="relative inline-flex p-3 mx-auto mb-1"
          style={{
            background: "rgba(140,100,30,0.15)",
            border: "1px solid #4a3410",
            borderRadius: "50%",
            animation: "fantasy-flicker 3s infinite",
          }}
        >
          <HandHeart className="w-7 h-7" style={{ color: "#c8a040" }} />
        </div>

        <h4
          className="relative uppercase text-[9px] tracking-[0.35em]"
          
        >
          Lời tri ân từ chủ vương quốc
        </h4>

        {/* Divider */}
        <div className="relative flex items-center gap-3 mx-auto max-w-xs">
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,#4a3410)" }} />
          <span className="text-xs" style={{ color: "#4a3410" }}>⚜</span>
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,#4a3410,transparent)" }} />
        </div>

        <p className="relative text-sm leading-relaxed italic max-w-lg mx-auto" style={{ color: "#8a6840" }}>
          &quot;Mọi sự đóng góp, dù là một lượt đăng ký, một bình luận hay một
          khoản donate, đều là những viên gạch quý báu xây dựng nên Pixel
          Kingdom. Xin chân thành cảm ơn lòng hảo tâm của các lữ khách.&quot;
        </p>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

        @keyframes fantasy-flicker {
          0%, 85%, 100% { opacity: 1; box-shadow: 0 0 12px rgba(200,140,40,0.2); }
          90%            { opacity: 0.65; box-shadow: none; }
          95%            { opacity: 0.9; box-shadow: 0 0 18px rgba(200,140,40,0.35); }
        }
      `}</style>
    </div>
  );
};