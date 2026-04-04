"use client";

import { Building } from "@/types";
import {
  Book,
  Scroll,
  Lightbulb,
  Code2,
  Gamepad2,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  X,
  Filter,
  Lock,
  Key,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookData {
  id: string;
  title: string;
  category: "Code" | "VTuber" | "Life";
  description: string;
  pages: string[];
  color: string;
  icon: LucideIcon;
  isLocked?: boolean;
  unlockCode?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",    label: "Tất cả",   icon: Filter   },
  { id: "Code",   label: "Lập trình", icon: Code2    },
  { id: "VTuber", label: "VTuber",   icon: Gamepad2 },
  { id: "Life",   label: "Mẹo vặt",  icon: Lightbulb },
] as const;

const BOOKS: BookData[] = [
  {
    id: "prog-01",
    title: "Cẩm Nang Ma Pháp Next.js",
    category: "Code",
    description: "Khám phá sức mạnh của App Router và Server Components.",
    icon: Code2,
    color: "blue",
    pages: [
      "Chương 1: Khởi đầu với App Router. Cấu trúc thư mục là xương sống của mọi ứng dụng hiện đại.",
      "Chương 2: Server Components. Tối ưu hóa hiệu năng bằng cách giảm tải Client-side JS.",
      "Chương 3: Deployment. Đưa sản phẩm của bạn ra ánh sáng với Vercel.",
    ],
  },
  {
    id: "secret-01",
    title: "Bí Truyền Cấm Thuật",
    category: "Code",
    description: "Cuốn sách bị phong ấn bởi cổ thuật. Chỉ dành cho người xứng đáng.",
    icon: Lock,
    isLocked: true,
    unlockCode: "GEMINI2026",
    color: "red",
    pages: [
      "Chúc mừng lữ khách! Bạn đã giải mã thành công phong ấn.",
      "Bí mật tối thượng: 'Sáng tạo không nằm ở công cụ, mà nằm ở cách bạn giải quyết vấn đề'.",
      "Hãy tiếp tục hành trình xây dựng vương quốc 8-bit của riêng mình!",
    ],
  },
  {
    id: "vt-01",
    title: "Bí Truyền Trở Thành VTuber",
    category: "VTuber",
    description: "Từ một tấm ảnh tĩnh đến linh hồn sống động trên màn hình.",
    icon: Gamepad2,
    color: "purple",
    pages: [
      "Bước 1: Thiết kế Model. Hãy chọn phong cách đại diện cho tâm hồn của bạn.",
      "Bước 2: Rigging với Live2D. Thổi hồn vào từng chuyển động mắt và miệng.",
    ],
  },
  {
    id: "life-01",
    title: "Mẹo Vặt Sinh Tồn Thành Thị",
    category: "Life",
    description: "Làm sao để sống sót qua deadline và những ngày cuối tháng.",
    icon: Lightbulb,
    color: "amber",
    pages: [
      "Mẹo 1: Quản lý thời gian Pomodoro. 25 phút tập trung, 5 phút nghỉ ngơi.",
      "Mẹo 2: Nấu ăn nhanh gọn cho Dev.",
    ],
  },
];

// ─── Color maps ───────────────────────────────────────────────────────────────
const BOOK_COLORS: Record<string, { border: string; icon: string; glow: string }> = {
  blue:   { border: "#3a5a8a", icon: "#7aaad4", glow: "rgba(80,140,220,0.25)" },
  red:    { border: "#7a2a1a", icon: "#c07060", glow: "rgba(180,60,40,0.25)"  },
  purple: { border: "#5a3a7a", icon: "#a07ac0", glow: "rgba(120,60,180,0.25)" },
  amber:  { border: "#7a5a1a", icon: "#c8a040", glow: "rgba(200,160,60,0.25)" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const bookColor = (color: string) => BOOK_COLORS[color] ?? BOOK_COLORS.amber;

// ─── Component ────────────────────────────────────────────────────────────────
export const LibraryContent = ({ data }: { data: Building }) => {
  const [activeTab, setActiveTab]       = useState<string>("all");
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [inputCode, setInputCode]       = useState("");
  const [isUnlocked, setIsUnlocked]     = useState(false);
  const [error, setError]               = useState(false);
  const [currentPage, setCurrentPage]   = useState(0);

  const filteredBooks = useMemo(() => {
    if (activeTab === "all") return BOOKS;
    return BOOKS.filter((b) => b.category === activeTab);
  }, [activeTab]);

  const handleOpenBook = (book: BookData) => {
    setSelectedBook(book);
    setCurrentPage(0);
    setInputCode("");
    setError(false);
    setIsUnlocked(!book.isLocked);
  };

  const handleUnlock = () => {
    if (selectedBook?.unlockCode === inputCode.toUpperCase()) {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="space-y-5 " >

      {/* ── Header & Filter ─────────────────────────────────────────── */}
      <div
        className="rounded-sm p-4 space-y-4"
        style={{
          background: "linear-gradient(180deg, rgba(40,28,10,0.9), rgba(25,16,5,0.9))",
          border: "1px solid #4a3410",
          boxShadow: "inset 0 1px 0 rgba(200,160,80,0.08)",
        }}
      >
        <div className="flex items-center justify-between px-1">
          <h2
            className="flex items-center gap-2 text-sm uppercase tracking-widest"
            style={{color: "#c8a040" }}
          >
            <Book className="w-4 h-4" />
            {data.name || "Thư Viện Tri Thức"}
          </h2>
          <span className="text-[10px] italic" style={{ color: "#5a4020" }}>
            Kho lưu trữ: {data.id}
          </span>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all"
                style={{
                  
                  borderRadius: "2px",
                  border: active ? "1px solid #c8a040" : "1px solid #3a2810",
                  background: active
                    ? "linear-gradient(180deg,rgba(140,100,30,0.5),rgba(80,55,15,0.5))"
                    : "rgba(0,0,0,0.25)",
                  color: active ? "#f0d080" : "#7a5a28",
                  boxShadow: active ? "0 0 12px rgba(180,130,40,0.3)" : "none",
                }}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Book shelf ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredBooks.map((book) => {
          const c = bookColor(book.color);
          return (
            <div
              key={book.id}
              onClick={() => handleOpenBook(book)}
              className="group relative cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              style={{
                background: "linear-gradient(160deg, #251a0a, #1a1005)",
                border: `1px solid ${book.isLocked ? "#2a1e0e" : c.border}`,
                borderRadius: "2px",
                padding: "14px 16px",
                opacity: book.isLocked ? 0.75 : 1,
                boxShadow: book.isLocked
                  ? "none"
                  : `0 0 20px ${c.glow}, inset 0 1px 0 rgba(200,160,80,0.06)`,
              }}
            >
              {/* Shimmer line on hover */}
              <div
                className="absolute inset-x-0 top-0 h-px transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent, ${c.icon}, transparent)`,
                }}
              />

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className="p-2.5 flex-shrink-0 transition-transform duration-300 group-hover:rotate-6"
                  style={{
                    borderRadius: "2px",
                    border: `1px solid ${book.isLocked ? "#2a1e0e" : c.border}`,
                    background: book.isLocked ? "rgba(0,0,0,0.3)" : `${c.glow}`,
                    color: book.isLocked ? "#4a3820" : c.icon,
                  }}
                >
                  {book.isLocked
                    ? <Lock className="w-5 h-5" />
                    : <book.icon className="w-5 h-5" />
                  }
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm truncate mb-1"
                    style={{
                      
                      color: book.isLocked ? "#4a3820" : "#e0c880",
                      fontSize: "12px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {book.title}
                  </h4>
                  <p
                    className="text-[11px] leading-relaxed line-clamp-2 italic"
                    style={{ color: book.isLocked ? "#3a2810" : "#a08050" }}
                  >
                    {book.isLocked ? "Yêu cầu giải mã để xem nội dung..." : book.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Book modal ──────────────────────────────────────────────── */}
      {selectedBook && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(8,4,1,0.75)" }}
            onClick={() => setSelectedBook(null)}
          />

          <div
            className="relative w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-300"
            style={{
              background: "linear-gradient(160deg, #2a1e0e 0%, #1c1408 60%, #221910 100%)",
              borderRadius: "3px",
              boxShadow:
                "0 0 0 1px #6b4c1e, 0 0 0 3px #2a1a08, 0 0 0 4px #8b6530, 0 0 60px rgba(180,120,40,0.4)",
            }}
          >
            {/* Top gold bar */}
            <div style={{
              height: 3,
              background: "linear-gradient(90deg, transparent, #5a3e14 10%, #c8a040 30%, #f0d882 50%, #c8a040 70%, #5a3e14 90%, transparent)",
            }} />

            {/* Corner ornaments */}
            {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos, i) => (
              <span key={i} className={`absolute ${pos} text-[#6b4c1e] text-sm z-10 leading-none`}>✦</span>
            ))}

            {!isUnlocked ? (
              /* ── Unlock screen ── */
              <div className="p-8 text-center space-y-6">
                <div
                  className="inline-flex p-4 rounded-full"
                  style={{
                    background: "rgba(120,60,20,0.2)",
                    border: "1px solid #7a3a20",
                    animation: "fantasy-flicker 2.5s infinite",
                  }}
                >
                  <Key className="w-10 h-10" style={{ color: "#c8a040" }} />
                </div>

                <div>
                  <h3
                    className="text-lg mb-1"
                    style={{color: "#e8c97a", letterSpacing: "0.08em" }}
                  >
                    Phong Ấn Cổ Thuật
                  </h3>
                  <p className="text-sm italic" style={{ color: "#7a5a28" }}>
                    Nhập mật mã để phá giải phong ấn
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3" style={{ color: "#4a3410" }}>
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,#4a3410)" }} />
                  <span className="text-xs">⚜</span>
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,#4a3410,transparent)" }} />
                </div>

                <div className="space-y-3 px-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => { setInputCode(e.target.value); setError(false); }}
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                    placeholder="Mã giải ấn..."
                    className="w-full py-3 px-4 text-center  text-sm focus:outline-none transition-all"
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: `1px solid ${error ? "#8a3020" : "#4a3410"}`,
                      borderRadius: "2px",
                      color: "#e8c97a",
                      letterSpacing: "0.2em",
                      boxShadow: error ? "0 0 12px rgba(180,60,40,0.3)" : "none",
                    }}
                  />
                  {error && (
                    <p className="flex items-center justify-center gap-1 text-[11px]" style={{ color: "#c06050" }}>
                      <AlertCircle className="w-3 h-3" /> Mật mã không chính xác!
                    </p>
                  )}
                  <button
                    onClick={handleUnlock}
                    className="w-full py-2.5 text-sm uppercase tracking-widest transition-all"
                    style={{
                      
                      background: "linear-gradient(180deg, rgba(140,100,30,0.5), rgba(80,55,15,0.5))",
                      border: "1px solid #8b6530",
                      borderRadius: "2px",
                      color: "#e8c97a",
                      boxShadow: "0 0 16px rgba(180,130,40,0.2), inset 0 1px 0 rgba(255,220,100,0.1)",
                    }}
                  >
                    ⚜ Giải Ấn
                  </button>
                </div>

                <button
                  onClick={() => setSelectedBook(null)}
                  className="text-[10px] uppercase tracking-widest transition-colors"
                  style={{color: "#3a2810" }}
                >
                  Hủy bỏ
                </button>
              </div>
            ) : (
              /* ── Reading screen ── */
              <>
                {/* Book header */}
                <div
                  className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: "1px solid #3a2810" }}
                >
                  <div className="flex items-center gap-2" style={{ color: "#c8a040" }}>
                    <Scroll className="w-4 h-4 flex-shrink-0" />
                    <span
                      className="text-xs uppercase tracking-widest truncate"
                      style={{color: "#e8c97a" }}
                    >
                      {selectedBook.title}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="close-btn w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all"
                    style={{
                      background: "rgba(100,40,20,0.3)",
                      border: "1px solid #7a3a20",
                      color: "#c07050",
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Page content */}
                <div className="px-8 py-7 min-h-[220px] relative overflow-hidden">
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <Scroll className="w-56 h-56 text-amber-500 rotate-12" />
                  </div>
                  {/* Candle glow top-right */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 100% 0%, rgba(200,160,60,0.07), transparent 70%)" }}
                  />

                  <p
                    className="relative z-10 text-base leading-loose italic"
                    style={{ color: "#c8a870" }}
                  >
                    <span
                      className="float-left mr-2 leading-none"
                      style={{
                        
                        fontSize: "3rem",
                        color: "#c8a040",
                        lineHeight: 0.85,
                        textShadow: "0 0 16px rgba(200,160,60,0.4)",
                      }}
                    >
                      {selectedBook.pages[currentPage][0]}
                    </span>
                    {selectedBook.pages[currentPage].slice(1)}
                  </p>
                </div>

                {/* Navigation */}
                <div
                  className="px-6 py-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid #2a1a08", background: "rgba(0,0,0,0.25)" }}
                >
                  {/* Page dots */}
                  <div className="flex items-center gap-1.5">
                    {selectedBook.pages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className="transition-all duration-300"
                        style={{
                          height: "4px",
                          width: i === currentPage ? "20px" : "12px",
                          borderRadius: "2px",
                          background: i === currentPage ? "#c8a040" : "#3a2810",
                          boxShadow: i === currentPage ? "0 0 8px rgba(200,160,60,0.5)" : "none",
                        }}
                      />
                    ))}
                  </div>

                  {/* Prev / page count / Next */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="p-1.5 transition-all disabled:opacity-20"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid #3a2810",
                        borderRadius: "2px",
                        color: "#c8a040",
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] " style={{ color: "#5a4020" }}>
                      {currentPage + 1}/{selectedBook.pages.length}
                    </span>
                    <button
                      disabled={currentPage === selectedBook.pages.length - 1}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="p-1.5 transition-all disabled:opacity-20"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid #3a2810",
                        borderRadius: "2px",
                        color: "#c8a040",
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Bottom bar */}
            <div style={{
              height: 2,
              background: "linear-gradient(90deg, transparent, #3a2810 15%, #7a5a28 50%, #3a2810 85%, transparent)",
            }} />
          </div>
        </div>
      )}

      {/* ── Footer divider ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4 py-2 opacity-30">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #6b4c1e, transparent)" }} />
        <Bookmark className="w-4 h-4" style={{ color: "#6b4c1e" }} />
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #6b4c1e, transparent)" }} />
      </div>

      <style jsx global>{`
        @keyframes fantasy-flicker {
          0%, 85%, 100% { opacity: 1; box-shadow: 0 0 12px rgba(200,140,40,0.3); }
          90%            { opacity: 0.7; box-shadow: 0 0 4px rgba(200,140,40,0.1); }
          95%            { opacity: 0.9; box-shadow: 0 0 18px rgba(200,140,40,0.4); }
        }

        /* Reuse close-btn rune ring from InfoModal */
        .close-btn { position: relative; overflow: visible !important; transition: color .25s, border-color .25s, box-shadow .25s; }
        .close-btn::before {
          content: '';
          position: absolute; inset: -5px; border-radius: 50%;
          border: 1.5px dashed #7a3a20;
          opacity: 0; transition: opacity .3s;
          animation: fantasy-spin 4s linear infinite;
          animation-play-state: paused;
          pointer-events: none;
        }
        .close-btn:hover { color: #ffd0b0 !important; border-color: #d06040 !important; box-shadow: 0 0 18px rgba(200,80,50,.55); }
        .close-btn:hover::before { opacity: 1; animation-play-state: running; }
        .close-btn:active { transform: scale(0.92); }
        @keyframes fantasy-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};