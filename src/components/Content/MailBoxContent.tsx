import { Building } from "@/types";
import { 
  Mail, 
  Send, 
  Trash2, 
  User, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  X,
  PenTool,
  Scroll as ScrollIcon
} from "lucide-react";
import { useState, useMemo } from "react";

interface Message {
  id: string;
  title: string;
  sender: string;
  content: string;
  timestamp: string;
  reply?: string;
  status: "pending" | "replied";
}

export const MailboxContent = ({ data }: { data: Building }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      title: "Lời khen ngợi",
      sender: "Lữ khách ẩn danh",
      content: "Thư viện tuyệt vời quá! Bạn có định thêm sách về React Native không?",
      timestamp: "02/04/2026",
      reply: "Chào bạn, mình đang soạn thảo giáo trình React Native, sẽ sớm ra mắt nhé!",
      status: "replied"
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: "",
    sender: "",
    content: ""
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim() || !newMessage.title.trim()) return;

    const msg: Message = {
      id: Date.now().toString(),
      title: newMessage.title,
      sender: newMessage.sender.trim() || "Lữ khách phương xa",
      content: newMessage.content,
      timestamp: new Date().toLocaleDateString("vi-VN"),
      status: "pending"
    };

    setMessages([msg, ...messages]);
    setNewMessage({ title: "", sender: "", content: "" });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const pendingCount = useMemo(() => messages.filter(m => m.status === "pending").length, [messages]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-8 max-h-[80vh]">
      
      {/* --- FANTASY HEADER SECTION --- */}
      <div className=" z-20 pt-1 pb-6 bg-[#0b0d13]/95 rounded-t-3xl backdrop-blur-md border-b-2 border-amber-900/40">
        <div className="relative p-6 bg-gradient-to-b from-amber-950/20 to-transparent rounded-t-3xl border-x border-t border-amber-900/20">
          
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-600/50" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-600/50" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 blur-md opacity-20 animate-pulse" />
                <div className="relative p-4 bg-[#1a1410] border-2 border-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                  <Mail className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h2 className=" text-2xl  text-amber-100 tracking-tight drop-shadow-sm uppercase">
                  {data.name || "Hòm Thư Viễn Chinh"}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="h-[1px] w-4 bg-amber-800" />
                  <p className="text-amber-600  text-[10px] uppercase tracking-[0.3em]">
                    ID: {data.id}
                  </p>
                  <span className="h-[1px] w-4 bg-amber-800" />
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative flex items-center gap-3 px-8 py-3 bg-[#4a3728] border-2 border-amber-700/50 rounded-sm overflow-hidden transition-all hover:bg-[#2d2118] hover:border-amber-500 shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <PenTool className="w-4 h-4 text-amber-500" />
              <span className="  text-amber-100 text-xs tracking-widest uppercase">
                Viết Sứ Điệp
              </span>
            </button>
          </div>

          {/* RPG Stats Badges */}
          <div className="flex justify-center sm:justify-start gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-amber-900/30 rounded-md">
              <Clock className="w-3 h-3 text-amber-600" />
              <span className="text-[10px] text-slate-400 ">Đang chờ: <b className="text-amber-500">{pendingCount}</b></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-amber-900/30 rounded-md">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] text-slate-400 ">Đã hồi đáp: <b className="text-emerald-500">{messages.length - pendingCount}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* --- POPUP VIẾT THƯ (CUỘN GIẤY DA) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] mb-0 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-[#e6d5b8] text-[#4a3728] rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.7)] overflow-hidden animate-in zoom-in-95 duration-300 border-x-[12px] border-[#c4a484]">
            <div className="h-4 bg-[#b39671] w-full shadow-inner" />
            
            <div className="p-8 space-y-6 relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-black/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1">
                <ScrollIcon className="w-8 h-8 mx-auto mb-2 opacity-60 text-[#4a3728]" />
                <h3 className=" text-2xl  uppercase tracking-tighter decoration-double underline decoration-amber-900/20">Khởi tạo sứ điệp</h3>
                <p className="text-[10px] italic opacity-70">&#8220;Lời nói gió bay, nét chữ còn mãi...&#8221;</p>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4 ">
                <div className="space-y-1">
                  <label className="text-[10px]  uppercase opacity-60 ml-1">Tiêu đề sứ điệp</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Góp ý về vương quốc..."
                    value={newMessage.title}
                    onChange={(e) => setNewMessage({...newMessage, title: e.target.value})}
                    className="w-full bg-transparent border-b-2 border-amber-900/20 py-2 px-1 focus:border-amber-900 outline-none text-sm placeholder:italic placeholder:opacity-40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px]  uppercase opacity-60 ml-1">Danh tính lữ khách</label>
                  <input 
                    type="text" 
                    placeholder="Ẩn danh phương xa..."
                    value={newMessage.sender}
                    onChange={(e) => setNewMessage({...newMessage, sender: e.target.value})}
                    className="w-full bg-transparent border-b-2 border-amber-900/20 py-2 px-1 focus:border-amber-900 outline-none text-sm placeholder:italic placeholder:opacity-40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px]  uppercase opacity-60 ml-1">Nội dung tâm thư</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="Viết lời nhắn của bạn tại đây..."
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                    className="w-full bg-amber-900/5 border-2 border-amber-900/10 rounded-lg py-3 px-4 text-sm focus:border-amber-900/30 outline-none resize-none leading-relaxed shadow-inner"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#4a3728] hover:bg-[#2d2118] text-[#e6d5b8]  py-4 rounded-sm text-xs transition-all flex items-center justify-center gap-3 shadow-lg group uppercase tracking-widest"
                >
                  Phong Ấn & Gửi Đi <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </div>
            
            <div className="h-4 bg-[#b39671] w-full shadow-inner" />
          </div>
        </div>
      )}

      {/* --- MESSAGE LIST STYLE "PARCHMENT PIECES" --- */}
      <div className="grid grid-cols-1 gap-8 px-2">
        {messages.map((msg) => (
          <div key={msg.id} className="relative group">
            <div className="bg-[#f2e8cf] text-[#4a3728] p-6 rounded-sm border-l-[6px] border-amber-800 shadow-xl transition-all group-hover:translate-x-1 group-hover:-rotate-1">
              
              {/* Header của tin nhắn */}
              <div className="flex justify-between items-start mb-4 border-b border-amber-900/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-900/5 rounded-full">
                    <User className="w-4 h-4 opacity-50" />
                  </div>
                  <div>
                    <h4 className="  text-[15px] leading-tight uppercase tracking-tight text-amber-900">{msg.title}</h4>
                    <p className="text-[10px] opacity-60  italic mt-0.5">Sứ giả: {msg.sender} • {msg.timestamp}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(msg.id)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-900/20 hover:text-red-700 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Nội dung chính */}
              <div className="mb-6 px-1">
                <p className=" text-[13px] leading-loose italic text-amber-950 opacity-90">
                  &#8220;{msg.content}&#8221;
                </p>
              </div>

              {/* Hồi đáp */}
              {msg.reply ? (
                <div className="mt-4 pt-4 border-t-2 border-dashed border-emerald-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 bg-emerald-900/10 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                    </div>
                    <span className="text-[10px]   uppercase tracking-[0.15em] text-emerald-800">Sắc chỉ hồi đáp</span>
                  </div>
                  <div className="bg-emerald-900/5 p-4 rounded-lg border border-emerald-900/10">
                    <p className=" text-[12px] leading-relaxed text-emerald-950 italic">
                      &#8220;{msg.reply}&#8221;
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2 border-t border-amber-900/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-pulse" />
                  <span className="text-[9px]  italic opacity-50 uppercase tracking-widest ">Chờ sứ giả hồi tin...</span>
                </div>
              )}
            </div>
            
            {/* Wax Seal / Pin Ornament */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-800 shadow-md border border-amber-400 animate-bounce-slow" />
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="py-12 flex flex-col items-center gap-4">
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
        <p className="text-[9px] text-amber-900/40 uppercase tracking-[0.6em]  ">--- Hết cuộn sứ điệp ---</p>
      </div>
    </div>
  );
};