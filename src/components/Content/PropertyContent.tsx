import React from 'react';
import { 
  Gavel, 
  User, 
  MapPin, 
  Coins, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Home,
  Clock
} from 'lucide-react';
import { Building } from '@/types';

// Giả lập dữ liệu giao dịch bất động sản
export const propertyTransactions = [
  {
    id: 1,
    buyer: "Bá tước Ravenloft",
    project: "Lâu đài Hắc Ám",
    location: "Đỉnh núi Sương Mù",
    status: "Đã niêm phong", // Tương ứng với trạng thái pháp lý
    value: "25,000 Vàng",
    area: "1,200 m²",
    date: "Ngày 18, Tháng Gió",
    icon: ShieldCheck,
    color: 'text-amber-500',
    tag: 'SỞ HỮU VĨNH VIỄN'
  },
  {
    id: 2,
    buyer: "Hội Pháp Sư Veridia",
    project: "Tháp Canh Viễn Cổ",
    location: "Rừng Nguyệt Quang",
    status: "Đang xét duyệt",
    value: "12,500 Vàng",
    area: "450 m²",
    date: "Ngày 14, Tháng Gió",
    icon: Home,
    color: 'text-blue-400',
    tag: 'CHO THUÊ 99 NĂM'
  },
  {
    id: 3,
    buyer: "Thợ rèn Kaelen",
    project: "Xưởng Rèn Lửa Thiêng",
    location: "Khu công nghiệp Ironforge",
    status: "Chờ thanh toán",
    value: "5,200 Vàng",
    area: "120 m²",
    date: "Ngày 09, Tháng Gió",
    icon: Gavel,
    color: 'text-emerald-400',
    tag: 'CHUYỂN NHƯỢNG'
  }
];

export const PropertyContent = ({ data }: { data: Building }) => {
  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-10">
      
      {/* 1. HERO BANNER - Sảnh Giao Dịch */}
      <div className="relative h-48 rounded-sm overflow-hidden border-2 border-[#6b4c1e] shadow-[0_0_25px_rgba(0,0,0,0.6)] group">
        <div className="absolute inset-0 bg-[#161009]">
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/papyros.png')]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2a1e0e]/50 to-[#161009]" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#8b6530,transparent)]" />
        </div>
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <div className="mb-3 relative">
            <div className="absolute -inset-4 bg-[#8b6530]/20 rounded-full blur-xl group-hover:bg-[#8b6530]/40 transition-all duration-700" />
            <div className="relative p-3 bg-[#1a1208] border-2 border-[#8b6530] rounded-full group-hover:scale-110 group-hover:border-[#e8c97a] transition-all duration-500">
              <Gavel className="w-8 h-8 text-[#e8c97a]" />
            </div>
          </div>
          <h3 className="text-2xl text-[#e8c97a] uppercase tracking-[0.25em]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            {data.name || "SÀN GIAO DỊCH ĐỊA ỐC"}
          </h3>
          <p className="text-[#8b6530] text-[11px] uppercase tracking-[0.2em] mt-2">
            Khế ước - Chuyển nhượng - Sở hữu
          </p>
        </div>
      </div>

      {/* 2. DANH SÁCH GIAO DỊCH */}
      <div className="space-y-4 mx-2">
        {propertyTransactions.map((item) => (
          <div 
            key={item.id} 
            className="group relative flex flex-col items-start p-5 rounded-sm border-2 border-[#3a2810] transition-all duration-500 hover:border-[#8b6530] bg-[#1a1208]/60 overflow-hidden"
          >
            {/* Tag Loại Hình Sở Hữu */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-[9px]  tracking-widest uppercase border-l border-b border-[#3a2810] ${item.color} bg-[#161009]/80`}>
              {item.tag}
            </div>

            <div className="flex flex-col md:flex-row w-full gap-5">
              {/* Icon & Trạng thái */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-4 rounded-sm bg-[#161009] border border-[#5a3e14] group-hover:border-[#c8a040] transition-colors shadow-inner">
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#6b4c1e]" />
                    <span className="text-[10px] text-[#6b4c1e]">{item.date}</span>
                </div>
              </div>

              {/* Thông tin chính */}
              <div className="flex-1 space-y-3">
                <div>
                  <h5 className="text-[#e8c97a] text-xl  tracking-wide">
                    {item.project}
                  </h5>
                  <div className="flex items-center gap-2 text-[#8b6530] text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="italic">{item.location}</span>
                  </div>
                </div>

                {/* Grid Chi Tiết */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-[#3a2810] pt-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase text-[#6b4c1e] tracking-tighter">Chủ sở hữu</p>
                    <div className="flex items-center gap-2 text-[#c8a870]">
                      <User className="w-3.5 h-3.5" />
                      <span className="text-sm">{item.buyer}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase text-[#6b4c1e] tracking-tighter">Giá trị niêm yết</p>
                    <div className="flex items-center gap-2 text-[#e8c97a]">
                      <Coins className="w-3.5 h-3.5" />
                      <span className="text-sm ">{item.value}</span>
                    </div>
                  </div>

                  <div className="space-y-1 hidden md:block">
                    <p className="text-[10px] uppercase text-[#6b4c1e] tracking-tighter">Diện tích</p>
                    <div className="flex items-center gap-2 text-[#c8a870]">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-sm">{item.area}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hành động (Cấp dấu) */}
              <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-center border-t md:border-t-0 md:border-l border-[#3a2810] pt-4 md:pt-0 md:pl-6 gap-3">
                <div className={`text-[10px] px-3 py-1 border ${item.color.replace('text', 'border')} ${item.color} opacity-70`}>
                    {item.status}
                </div>
                <button className="px-4 py-2 bg-[#8b6530]/10 hover:bg-[#8b6530]/20 border border-[#8b6530]/50 text-[#e8c97a] text-[11px] uppercase tracking-widest transition-all">
                  Chi tiết khế ước
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. FOOTER */}
      <div className="relative p-6 bg-[#1a1208]/40 border-y border-[#3a2810]/50 flex flex-col items-center text-center mx-4">
        <div className="flex justify-center items-center gap-3 text-[#3a2810] opacity-60">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.4em] italic">
            Chứng thực bởi Hội Đồng Hoàng Gia Veridia
          </span>
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default PropertyContent;