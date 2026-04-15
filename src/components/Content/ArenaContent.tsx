"use client";

import { useState } from "react";
import Image from "next/image";
import { useMapStore } from "@/stores/useMapStore";
import { Gamepad2, Dices} from "lucide-react";
import { Building } from "@/stores/types";
import { BlackjackPopup } from "../arena/BlackjackGame";
const GAMES_DATA = [
  {
    id: "blackjack",
    title: "Vũ trụ 21",
    desc: "Thử vận may với thẻ bài để đạt 21 điểm, chiến thắng để nhận phần thưởng hấp dẫn!",
    icon: Dices,
    imageSrc: "/assets/games/21.png",
    hot: true,
  },
];

export const ArenaContent = ({ data }: { data: Building }) => {
  const { avocados } = useMapStore();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-10 animate-in fade-in duration-700 pb-12 custom-scrollbar max-h-[75vh]">
        {/* Banner Section - Giữ nguyên logic UI cũ của bạn */}
        <div className="relative h-60 bg-[#161009] border-2 border-[#8b6530] rounded-sm overflow-hidden group">
          <Image src={data.imageSrc || ""} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt="Arena" fill className="object-cover opacity-60" />
          <div className="absolute bottom-6 left-6">
            <h3 className="text-white text-3xl font-black italic">ĐẤU TRƯỜNG SINH TỬ</h3>
          </div>
        </div>

        {/* Game Grid */}
        <div className="space-y-6">
          <div className="flex justify-between px-1">
            <h4 className="text-[#8b6530] text-[14px] uppercase flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> Giải trí 8-bit
            </h4>
            <div className="text-[#f0d882] text-xs font-mono">WALLET: {avocados.toLocaleString()} 🥑</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {GAMES_DATA.map((game) => (
              <div key={game.id} className="group relative bg-[#1a1208] border border-[#3a2810] hover:border-[#f0d882] transition-all p-4 rounded-sm">
                 <div className="relative h-32 mb-4 overflow-hidden">
                    <Image src={game.imageSrc} alt={game.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover opacity-70 group-hover:scale-110 transition-transform duration-500" />
                    {game.hot && <div className="absolute top-2 left-2 bg-red-600 text-[8px] px-2 py-0.5 animate-pulse">HOT</div>}
                 </div>
                 <h5 className="text-[#e8c97a] text-sm font-bold uppercase mb-1">{game.title}</h5>
                 <p className="text-[#8b6530] text-[10px] italic mb-4 line-clamp-2">{game.desc}</p>
                 <button 
                  onClick={() => setActiveGame(game.id)}
                  className="w-full bg-[#1a1208] border border-[#8b6530] text-[#f0d882] py-2 text-[10px] font-black uppercase hover:bg-[#f0d882] hover:text-black transition-colors"
                 >
                   Chơi ngay
                 </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popups Manager */}
      <BlackjackPopup 
        isOpen={activeGame === "blackjack"} 
        onClose={() => setActiveGame(null)} 
      />
      
      {/* Trong tương lai bạn chỉ cần thêm:
      <BauCuaPopup isOpen={activeGame === 'baucua'} ... /> 
      */}
    </>
  );
};