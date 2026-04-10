import React from "react";
import {
  Megaphone,
  Scroll,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Building } from "@/stores/types";
export const newsList = [

  {
    id: 1,
    type: "news",
    tag: "TIN TỨC",
    title: "Video Xây Dựng Mới Được Phát Hành",
    desc: "Ao Cá của Genja đã được xây xong, mời mọi người tham quan và xem video ở rạp phim",
    date: "Ngày 7, Tháng 4",
    icon: Megaphone,
    color: "text-[#60a5fa]",
    border: "border-[#2d435a]",
    bg: "bg-[#1e2a3a]/30",
  },

];

export const NewsContent = ({ data }: { data: Building }) => {
  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-10">
      {/* 1. HERO BANNER - Kiểu Bảng Cáo Thị */}
      <div className="relative h-48 rounded-sm overflow-hidden border-2 border-[#6b4c1e] shadow-[0_0_25px_rgba(0,0,0,0.6)] group">
        <div className="absolute inset-0 bg-[#161009]">
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/papyros.png')]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2a1e0e]/50 to-[#161009]" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#f0d882,transparent)]" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <div className="mb-3 relative">
            <div className="absolute -inset-4 bg-[#c8a040]/10 rounded-full blur-xl group-hover:bg-[#c8a040]/30 transition-all duration-700" />
            <div className="relative p-3 bg-[#1a1208] border-2 border-[#8b6530] rounded-full group-hover:scale-110 group-hover:border-[#f0d882] transition-all duration-500 shadow-[inset_0_0_15px_rgba(200,160,64,0.3)]">
              <Scroll className="w-8 h-8 text-[#e8c97a]" />
            </div>
          </div>
          <h3
            className="text-2xl text-[#e8c97a] uppercase tracking-[0.25em]"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}
          >
            {data.name}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#8b6530]" />
            <p className="text-[#8b6530] text-[11px] uppercase tracking-[0.2em]">
              Thông tin & Nhiệm vụ
            </p>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#8b6530]" />
          </div>
        </div>
      </div>

      {/* 2. DANH SÁCH BẢN TIN */}
      <div className="space-y-4 mx-2">
        {newsList.map((news) => (
          <div
            key={news.id}
            className={`group relative flex flex-col sm:flex-row items-start gap-5 p-5 rounded-sm border-2 border-[#3a2810] transition-all duration-500 hover:border-[#8b6530] hover:shadow-[0_0_20px_rgba(139,101,48,0.15)] bg-[#1a1208]/60 overflow-hidden`}
          >
            {/* Tag Phân Loại ở góc */}
            <div
              className={`absolute top-0 right-0 px-3 py-1 text-[9px]  tracking-widest uppercase border-l border-b border-[#3a2810] ${news.color} bg-[#161009]/80`}
            >
              {news.tag}
            </div>

            {/* Icon đại diện */}
            <div className="p-3.5 rounded-sm bg-[#161009] border border-[#5a3e14] group-hover:border-[#c8a040] transition-colors shadow-inner flex-shrink-0">
              <news.icon className={`w-7 h-7 ${news.color}`} />
            </div>

            {/* Nội dung chính */}
            <div className="flex-1 pr-10 sm:pr-0">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3 h-3 text-[#6b4c1e]" />
                <span className="text-[10px] text-[#6b4c1e] uppercase tracking-wider">
                  {news.date}
                </span>
              </div>

              <h5 className="text-[#e8c97a] text-lg tracking-wide group-hover:text-[#f0d882] transition-colors">
                {news.title}
              </h5>

              <p className="text-[#c8a870] text-sm mt-1 opacity-80 leading-relaxed italic">
                &quot;{news.desc}&quot;
              </p>
            </div>

            {/* Nút thao tác giả lập RPG */}
            <div className="w-full sm:w-auto flex items-center justify-end sm:border-l border-[#3a2810] sm:pl-4">
              <button className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-tighter text-[#8b6530] hover:text-[#e8c97a] transition-all">
                Xem bản ghi <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. FOOTER - GHI CHÚ CUỐI BẢNG */}
      <div className="relative p-6 bg-[#1a1208]/40 border-y border-[#3a2810]/50 flex flex-col items-center text-center mx-4">
        <div className="flex justify-center items-center gap-3 text-[#3a2810] opacity-60">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.4em] italic text-center">
            Mọi tin tức đều được niêm phong bởi hội học giả
          </span>
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default NewsContent;
