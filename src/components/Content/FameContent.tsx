import { Building } from "@/types";
import { 
  Medal, 
  Anvil, 
  Heart, 
  HandHelping, 
  Star, 
  Crown, 
  Coffee, 
  Wand2, 
  ShieldCheck,
  Sparkles,
  Quote
} from "lucide-react";

export const FameContent = ({ data }: { data: Building }) => {
  const kingdomId = data.id || "LEGACY";

  const contributors = [
    { name: "Người Bí Ẩn", role: "Đại Thần Quân", amount: "5.000.000đ", icon: Crown, color: "text-[#f0d882]", bg: "border-[#8b6530] bg-[#3a2810]/30" },
    { name: "Lữ Khách Hào Phóng", role: "Hộ Vệ Hoàng Gia", amount: "2.000.000đ", icon: ShieldCheck, color: "text-[#c8a040]", bg: "border-[#6b4c1e] bg-[#2a1e0e]/30" },
    { name: "Thợ Rèn Pixel", role: "Bậc Thầy Kiến Tạo", icon: Anvil, color: "text-[#a07830]", bg: "border-[#6b4c1e] bg-[#2a1e0e]/30" },
    { name: "Phù Thủy Nội Dung", role: "Cố Vấn Ma Thuật", icon: Wand2, color: "text-[#c8a870]", bg: "border-[#6b4c1e] bg-[#2a1e0e]/30" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-10">
      
      {/* 1. HERO BANNER - Kiểu Huy Chương Cổ Đại */}
      <div className="relative h-52 rounded-sm overflow-hidden border-2 border-[#6b4c1e] shadow-[0_0_25px_rgba(0,0,0,0.6)] group">
        <div className="absolute inset-0 bg-[#161009]">
          {/* Grain texture & Gradient */}
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/papyros.png')]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2a1e0e]/50 to-[#161009]" />
          
          {/* Các tia sáng quét qua (Magic Sweep) */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#f0d882,transparent)]" />
        </div>
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <div className="mb-3 relative">
            <div className="absolute -inset-4 bg-[#c8a040]/20 rounded-full blur-xl group-hover:bg-[#c8a040]/40 transition-all duration-700" />
            <div className="relative p-4 bg-[#1a1208] border-2 border-[#8b6530] rounded-full group-hover:scale-110 group-hover:border-[#f0d882] transition-all duration-500 shadow-[inset_0_0_15px_rgba(200,160,64,0.3)]">
              <Medal className="w-10 h-10 text-[#e8c97a]" />
            </div>
          </div>
          <h3 className="text-3xl text-[#e8c97a] uppercase tracking-[0.25em] " style={{textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            Sảnh Danh Vọng
          </h3>
          <div className="flex items-center gap-3 mt-2">
             <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#8b6530]" />
             <p className="text-[#8b6530] text-[11px]  uppercase tracking-[0.2em]">
               BẢN GHI: {kingdomId}
             </p>
             <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#8b6530]" />
          </div>
        </div>
      </div>

      {/* 2. LỜI TRI ÂN - Cuộn giấy da */}
      <div className="relative p-8 bg-[#1a1208]/40 border-y-2 border-[#3a2810] flex flex-col items-center text-center mx-4">
        <Quote className="w-10 h-10 text-[#3a2810] absolute -top-5 opacity-40 bg-[#1a1208] px-2" />
        <p className="text-[#c8a870] text-base italic leading-relaxed max-w-xl">
          &quot;Vương quốc không được xây dựng bởi một vị vua, mà bởi hàng ngàn bàn tay của những người cộng sự và những lữ khách có tâm hồn đồng điệu.&quot;
        </p>
      </div>

      {/* 3. NHÓM ĐÓNG GÓP CHÍNH - Khung chân dung cổ */}
      <div className="space-y-6">
        <h4 className="text-[#e8c97a] text-xs uppercase tracking-[0.4em]  flex items-center justify-center gap-4 px-2">
          <Star className="w-4 h-4 text-[#8b6530]" />
          Những Vị Thần Kiến Tạo
          <Star className="w-4 h-4 text-[#8b6530]" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {contributors.map((person, i) => (
            <div 
              key={i} 
              className={`group flex items-center gap-5 p-5 rounded-sm border-2 transition-all duration-500 hover:shadow-[0_0_20px_rgba(139,101,48,0.2)] ${person.bg}`}
            >
              <div className="p-3.5 rounded-sm bg-[#161009] border border-[#5a3e14] group-hover:border-[#c8a040] transition-colors shadow-inner">
                <person.icon className={`w-7 h-7 ${person.color}`} />
              </div>
              <div className="flex-1">
                <h5 className="text-[#e8c97a] text-base  tracking-tight">{person.name}</h5>
                <p className={`text-[10px] uppercase  tracking-widest mt-0.5 opacity-80 ${person.color}`}>
                  {person.role}
                </p>
              </div>
              {person.amount && (
                <div className="text-right border-l border-[#3a2810] pl-4">
                  <p className="text-[#f0d882] text-[12px]   tracking-tighter" style={{ textShadow: '0 0 8px rgba(240,216,130,0.3)' }}>{person.amount}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. DANH SÁCH ỦNG HỘ NHỎ - Bia đá ghi danh */}
      <div className="space-y-5 pt-4">
        <h4 className="text-[#6b4c1e] text-[11px] uppercase tracking-[0.3em]  flex items-center gap-3 px-2">
          <Heart className="w-4 h-4 text-[#d06040]" />
          Lòng Thành Từ Cộng Đồng
        </h4>
        <div className="bg-[#1a1208]/60 border border-[#3a2810] rounded-sm p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
          <div className="flex flex-wrap justify-center gap-3 relative z-10">
            {["Alex", "Bảo Bình", "Cloudy", "Dương Quá", "Elysia", "Flame", "Gia Cát", "Hồng Trần", "Iron", "Kael"].map((name, i) => (
              <div 
                key={i}
                className="px-4 py-2 bg-[#2a1e0e]/60 border border-[#5a3e14]/50 rounded-sm text-xs text-[#c8a870] hover:border-[#c8a040] hover:text-[#f0d882] hover:bg-[#3a2810] transition-all cursor-default  tracking-wide"
               
              >
                ✦ {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. NÚT ĐÓNG GÓP - RPG Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6">
        <button className="relative flex items-center justify-center gap-4 p-5 bg-gradient-to-br from-[#1e3a1e] to-[#0f1a0f] border-2 border-[#2d5a2d] rounded-sm transition-all hover:border-[#4ade80] hover:shadow-[0_0_25px_rgba(74,222,128,0.2)] group active:scale-95 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <Coffee className="w-6 h-6 text-[#4ade80] group-hover:animate-bounce z-10" />
          <div className="text-left z-10">
            <p className="text-[10px] text-[#4ade80]  uppercase tracking-widest leading-none">Mời cà phê</p>
            <p className="text-[#e8c97a] text-sm">Donate ủng hộ</p>
          </div>
        </button>

        <button className="relative flex items-center justify-center gap-4 p-5 bg-gradient-to-br from-[#1e2a3a] to-[#0f151a] border-2 border-[#2d435a] rounded-sm transition-all hover:border-[#60a5fa] hover:shadow-[0_0_25px_rgba(96,165,250,0.2)] group active:scale-95 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <HandHelping className="w-6 h-6 text-[#60a5fa] group-hover:scale-110 transition-transform z-10" />
          <div className="text-left z-10">
            <p className="text-[10px] text-[#60a5fa]  uppercase tracking-widest leading-none">Hợp tác</p>
            <p className="text-[#e8c97a] text-sm">Trở thành cộng sự</p>
          </div>
        </button>
      </div>

      {/* Footer Sparkles */}
      <div className="flex justify-center items-center gap-3 text-[#3a2810] pt-6 opacity-60">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="text-[10px] uppercase  tracking-[0.4em] italic text-center">
          Ghi danh vào sử thi
        </span>
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>  
    </div>
  );
};