"use client";

import { Building } from "@/stores/types";
import {
  Book,
  ChevronRight,
  ChevronLeft,
  X,
  Lock,
  Key,
  AlertCircle,
  LucideIcon,
  Fish,
  Trophy,
  Castle,
  Landmark,
  Clapperboard,
  Sprout,
  TreeDeciduous,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useMapStore } from "@/stores/useMapStore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookData {
  id: string;
  title: string;
  category: "FanBuilt" | "MainBuilding" | "Mystery";
  description: string;
  pages: string[];
  color: string;
  icon: LucideIcon;
  isLocked?: boolean;
  unlockCost?: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "FanBuilt", label: "Xây theo Fan" },
  { id: "MainBuilding", label: "Công trình chính" },
  { id: "Mystery", label: "Bí ẩn" },
] as const;

interface BookInput {
  id: string;
  title: string;
  category: "FanBuilt" | "MainBuilding" | "Mystery";
  description: string;
  pages: string[];
  color: string;
  icon: LucideIcon;
  unlockCost?: number;
}

const BOOKS_DATA: BookInput[] = [
  {
    id: "tuna-pond",
    title: "Ao cá Tuna huyền thoại",
    category: "FanBuilt",
    description:
      "Được xây dựng từ ý kiến của thần dân Genji - Nơi linh vật Tuna sinh sống và tiến hóa",
    icon: Fish,
    color: "blue",
    pages: [
      "📜 CHƯƠNG 1: KHỞI NGUỒN\n\nThuở xa xưa, khi vương quốc Bơ còn non trẻ, một thần dân tên Genji đã có linh cảm về một sinh vật thần bí dưới đáy đại dương. Ngài đã tâu lên nhà vua: 'Muôn tâu, thần thấy trong giấc mơ có một loài cá mang linh khí của trái bơ, nếu được nuôi dưỡng bằng hạt bơ và tình yêu thương, nó sẽ trở thành linh vật hộ quốc!'",
      "🐟 CHƯƠNG 2: SỰ RA ĐỜI\n\nSau nhiều ngày đêm miệt mài, Genji đã tìm ra bí quyết để triệu hồi loài cá thần thoại. Ao cá Tuna được xây dựng ngay cạnh hoàng cung, nơi dòng nước trong xanh hội tụ linh khí. Người dân khắp nơi đổ về chiêm ngưỡng, và Tuna nhanh chóng trở thành linh vật may mắn của vương quốc.",
    ],
  },
  {
    id: "t1-cup",
    title: "Cúp T1 - Đấu trường huyền thoại",
    category: "FanBuilt",
    description:
      "Món quà từ thần dân SleepyDragon - Cơ hội mời tuyển thủ chuyên nghiệp về vương quốc",
    icon: Trophy,
    color: "red",
    pages: [
      "📜 CHƯƠNG 1: LỜI THỈNH CẦU\n\nSleepyDragon - một chiến binh say mê thể thao điện tử - đã từng ước mơ được gặp thần tượng của mình. Ngài đã cống hiến cả gia tài để xây dựng chiếc Cúp T1 lần thứ 6, một bảo vật có khả năng kết nối với các tuyển thủ chuyên nghiệp trên khắp thế gian.",
      "🏆 CHƯƠNG 2: SỨC MẠNH CỦA CÚP\n\nChiếc cúp không chỉ là vật phẩm trang trí, mà còn là một pháp khí mạnh mẽ. Khi được kích hoạt bằng năng lượng hạt bơ, nó có thể triệu hồi các tuyển thủ huyền thoại đến giao lưu và huấn luyện cho chiến binh của vương quốc.",
    ],
  },
  {
    id: "avocado-castle",
    title: "Lâu đài Bơ",
    category: "MainBuilding",
    description:
      "Công trình vĩ đại nhất, nơi hội tụ linh khí của muôn loài trái cây",
    icon: Castle,
    color: "amber",
    pages: [
      "📜 CHƯƠNG 1: KIẾN TRÚC THẦN THOẠI\n\nLâu đài Bơ được xây dựng từ khối đá cẩm thạch màu xanh ngọc, hình dáng như một quả bơ khổng lồ vươn lên trời cao. 7 tòa tháp tượng trưng cho 7 vị thần trái cây cổ đại, đỉnh tháp là những viên ngọc bơ lấp lánh dưới ánh mặt trời.",
      "👑 CHƯƠNG 2: NƠI Ở CỦA QUỐC VƯƠNG\n\nBên trong lâu đài là đại sảnh hoàng gia với những bức tường khắc họa lịch sử vương quốc. Ngai vàng được chạm khắc từ một khối bơ khổng lồ, lấp lánh ánh vàng. Mỗi buổi sáng, quốc vương ngồi đây để nghe thần dân tâu trình và ban bố các sắc lệnh.",
    ],
  },
  {
    id: "you-bank",
    title: "Ngân hàng You Bank",
    category: "MainBuilding",
    description: "Nơi cất giữ và sinh lời từ những hạt bơ quý giá",
    icon: Landmark,
    color: "blue",
    pages: [
      "📜 CHƯƠNG 1: KHỞI NGUỒN CỦA SỰ THỊNH VƯỢNG\n\nYou Bank được thành lập bởi thương nhân giàu nhất vương quốc - ngài You. Với mong muốn giúp thần dân bảo toàn và gia tăng tài sản, ngài đã cho xây dựng một ngân hàng ngay cạnh chợ trung tâm.",
      "💰 CHƯƠNG 2: BÍ MẬT CỦA SỰ GIÀU CÓ\n\nNgân hàng không chỉ đơn thuần là nơi cất giữ. Ở tầng hầm sâu nhất, có một cỗ máy cổ đại có khả năng nhân đôi hạt bơ sau mỗi chu kỳ trăng tròn. Tuy nhiên, chỉ những ai có đức tin trong sáng mới được phép sử dụng nó.",
    ],
  },
  {
    id: "cinema",
    title: "Rạp phim Bơwood",
    category: "MainBuilding",
    description: "Nơi ước mơ được thêu dệt bằng ánh sáng và âm thanh",
    icon: Clapperboard,
    color: "purple",
    pages: [
      "📜 CHƯƠNG 1: KHÁT VỌNG ĐIỆN ẢNH\n\nNhận thấy tài năng kể chuyện của thần dân, Vua Bơ đã cho xây dựng một rạp chiếu phim hoành tráng. Bơwood nhanh chóng trở thành trung tâm văn hóa, nơi mỗi tuần đều có những bộ phim kể về hành trình của vương quốc được công chiếu.",
      "🎬 CHƯƠNG 2: PHÙ THỦY ÁNH SÁNG\n\nRạp phim có một bảo vật đặc biệt - Máy chiếu Huyền Thoại, có khả năng biến những câu chuyện trong sách thành hình ảnh sống động. Người xem có thể bước vào trong phim, tương tác với các nhân vật và trở thành một phần của câu chuyện. Cảm giác như đang sống trong một giấc mơ!",
    ],
  },
  {
    id: "planting-avocado",
    title: "🌱 Trồng Bơ thu hoạch",
    category: "Mystery",
    description: "Từ một hạt bơ nhỏ bé, cả một khu rừng có thể được sinh sôi",
    icon: Sprout,
    color: "green",
    unlockCost: 100,
    pages: [
      "🔮 KHÁM PHÁ BÍ MẬT\n\nBạn vừa mở khóa bí ẩn đầu tiên! Trong khu vườn cấm của vương quốc, có một mảnh đất màu mỡ đặc biệt. Nếu bạn gieo một hạt bơ xuống đó vào lúc bình minh, và tưới nước bằng năng lượng tinh thần của mình, chỉ sau 7 ngày, một cây bơ non sẽ mọc lên.",
      "🌿 CHƯƠNG 2: VỤ MÙA BỘI THU\n\nKhi cây bơ đã trưởng thành, nó sẽ cho ra những trái bơ vàng óng, mỗi trái chứa đựng một hạt bơ mới. Hãy chăm sóc thật tốt, bạn sẽ có cả một khu rừng bơ trĩu quả!",
    ],
  },
  {
    id: "ancient-tree",
    title: "🌳 Thu hoạch từ cây cổ thụ",
    category: "Mystery",
    description: "Cây bơ cổ thụ - chứng nhân ngàn năm của vương quốc",
    icon: TreeDeciduous,
    color: "green",
    unlockCost: 500,
    pages: [
      "🔮 CÂY CỔ THỤ THIÊNG LIÊNG\n\nSâu trong khu rừng cấm, có một cây bơ đã sống hơn 1000 năm. Thân cây to đến mức 10 người ôm không xuể. Rễ cây ăn sâu vào lòng đất, kết nối với mạch nguồn năng lượng của toàn vương quốc.",
      "✨ PHẨM VẬT CỔ ĐẠI\n\nMỗi năm một lần, vào đêm trăng tròn, cây cổ thụ sẽ rụng những chiếc lá vàng óng. Những chiếc lá này có thể dùng để chế tạo các vật phẩm huyền thoại, hoặc dùng trong các nghi lễ cổ xưa để cầu mưa, cầu mùa màng bội thu.",
    ],
  },
  {
    id: "seed-mystery",
    title: "🗝️ Hạt Bơ mở khóa bí mật",
    category: "Mystery",
    description: "Những cánh cổng bí ẩn chỉ mở ra khi có đủ hạt bơ",
    icon: Key,
    color: "red",
    unlockCost: 1000,
    pages: [
      "🔑 CÁNH CỔNG THỜI GIAN\n\nSâu dưới hầm Lâu đài Bơ, có một cánh cổng bằng đá bazan đen, trên đó chạm khắc hình một quả bơ khổng lồ. Xung quanh có 7 ổ khóa nhỏ. Truyền thuyết kể rằng nếu bạn bỏ đủ 1000 hạt bơ vào 7 ổ khóa đó, cánh cổng sẽ mở ra, đưa bạn đến một chiều không gian khác - nơi thời gian trôi chậm hơn gấp 10 lần.",
      "⏰ LỜI KHUYÊN TỪ NHÀ HIỀN TRIẾT\n\nĐừng tiêu xài hết tất cả hạt bơ bạn có. Hãy dành ra một phần để dự phòng cho những bí ẩn lớn hơn. Vương quốc Bơ vẫn còn hàng ngàn điều kỳ diệu chưa được khám phá, và hạt bơ chính là chìa khóa vạn năng mở ra mọi cánh cửa!",
      "🌟 CHƯƠNG 3: KHÁM PHÁ BẤT TẬN\n\nVượt qua cánh cổng, bạn sẽ bước vào một thế giới song song, nơi các bản sao của vương quốc tồn tại. Tại đây, bạn có thể tìm thấy những nguồn tài nguyên quý hiếm, và thậm chí là gặp gỡ phiên bản khác của chính mình!",
    ],
  },
];

// ─── Helper ────────────────────────────────────────────────────────────────────
const isBookUnlocked = (book: BookInput, avocados: number): boolean => {
  if (book.category !== "Mystery") return true;
  return avocados >= (book.unlockCost ?? 0);
};

// ─── Component ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const LibraryContent = ({ data }: { data: Building }) => {
  const [category, setCategory] = useState<string>("all");
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const avocados = useMapStore((state) => state.avocados);

  const BOOKS: BookData[] = BOOKS_DATA.map((book) => ({
    id: book.id,
    title: book.title,
    category: book.category,
    description: book.description,
    pages: book.pages,
    color: book.color,
    icon: book.icon,
    unlockCost: book.unlockCost,
    isLocked: book.category === "Mystery" && !isBookUnlocked(book, avocados),
  }));

  const filteredBooks = useMemo(() => {
    if (category === "all") return BOOKS;
    return BOOKS.filter((b) => b.category === category);
  }, [category, BOOKS]);

  const handleOpenBook = (book: BookData) => {
    if (book.isLocked) {
      setSelectedBook(book);
      setCurrentPage(0);
      setError(false);
    } else {
      setSelectedBook(book);
      setCurrentPage(0);
      setError(false);
    }
  };

  const handleUnlockWithAvocados = () => {
    if (
      selectedBook &&
      selectedBook.unlockCost &&
      avocados >= selectedBook.unlockCost
    ) {
      setError(false);
      setSelectedBook({
        ...selectedBook,
        isLocked: false,
      });
    } else {
      setError(true);
    }
  };

  const colorMap: Record<
    string,
    { border: string; icon: string; glow: string }
  > = {
    blue: { border: "#3a5a8a", icon: "#7aaad4", glow: "rgba(80,140,220,0.15)" },
    red: { border: "#7a2a1a", icon: "#c07060", glow: "rgba(180,60,40,0.15)" },
    purple: {
      border: "#5a3a7a",
      icon: "#a07ac0",
      glow: "rgba(120,60,180,0.15)",
    },
    amber: {
      border: "#7a5a1a",
      icon: "#c8a040",
      glow: "rgba(200,160,60,0.15)",
    },
    green: { border: "#2a6a3a", icon: "#60c090", glow: "rgba(60,160,80,0.15)" },
  };

  return (
    <div className="w-full">
      {/* Header */}

      {/* Category Select */}
      <div className="mb-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded outline-none cursor-pointer transition-colors"
          style={{
            background: "#1a1208",
            border: "1px solid #4a3410",
            color: "#e8c97a",
          }}
        >
          {CATEGORIES.map((cat) => (
            <option
              key={cat.id}
              value={cat.id}
              style={{ background: "#1a1208" }}
            >
              📚 {cat.label} ({filteredBooks.length})
            </option>
          ))}
        </select>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4 min-h-[500px]">
        {/* Left panel - Book list */}
        <div
          className="w-64 flex-shrink-0 space-y-1 overflow-y-auto"
          style={{ maxHeight: "500px" }}
        >
          {filteredBooks.map((book) => {
            const isActive = selectedBook?.id === book.id;
            const c = colorMap[book.color] ?? colorMap.amber;

            return (
              <button
                key={book.id}
                onClick={() => handleOpenBook(book)}
                className="w-full text-left transition-all duration-200 group"
              >
                <div
                  className="p-2 rounded"
                  style={{
                    background: isActive
                      ? "rgba(200,160,64,0.1)"
                      : "transparent",
                    borderLeft: isActive
                      ? `2px solid ${c.icon}`
                      : "2px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {book.isLocked ? (
                        <Lock
                          className="w-4 h-4"
                          style={{ color: "#6b4c1e" }}
                        />
                      ) : (
                        <book.icon
                          className="w-4 h-4"
                          style={{ color: c.icon }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm truncate"
                        style={{ color: isActive ? "#f0d080" : "#a08050" }}
                      >
                        {book.title}
                      </p>
                    </div>
                    {book.isLocked && (
                      <Lock className="w-3 h-3" style={{ color: "#5a4020" }} />
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredBooks.length === 0 && (
            <div className="text-center py-8">
              <Book
                className="w-8 h-8 mx-auto opacity-30"
                style={{ color: "#6b4c1e" }}
              />
              <p className="text-xs mt-2" style={{ color: "#5a4020" }}>
                Không có sách
              </p>
            </div>
          )}
        </div>

        {/* Right panel - Book details */}
        <div className="flex-1 min-w-0">
          {!selectedBook ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <Book
                className="w-16 h-16 mb-4 opacity-20"
                style={{ color: "#6b4c1e" }}
              />
              <p className="text-sm" style={{ color: "#7a5a28" }}>
                Chọn một cuốn sách để đọc
              </p>
              <p className="text-xs mt-1" style={{ color: "#5a4020" }}>
                Những tri thức cổ xưa đang chờ bạn
              </p>
            </div>
          ) : selectedBook.isLocked && selectedBook.category === "Mystery" ? (
            /* Unlock panel */
            <div className="text-center py-12 space-y-4">
              <div
                className="inline-flex p-3 rounded-full"
                style={{
                  background: "rgba(120,60,20,0.15)",
                  border: "1px solid #7a3a20",
                }}
              >
                <Key className="w-8 h-8" style={{ color: "#c8a040" }} />
              </div>

              <div>
                <h3 className="text-lg mb-1" style={{ color: "#e8c97a" }}>
                  🔒 {selectedBook.title}
                </h3>
                <p className="text-sm" style={{ color: "#a08050" }}>
                  Bí ẩn chưa được khám phá
                </p>
              </div>

              <div
                className="max-w-sm mx-auto p-4 rounded"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid #3a2810",
                }}
              >
                <p className="text-sm mb-3" style={{ color: "#c8a870" }}>
                  Cần{" "}
                  <strong style={{ color: "#f0d080" }}>
                    {selectedBook.unlockCost?.toLocaleString()} hạt bơ
                  </strong>{" "}
                  để mở khóa
                </p>
                <p className="text-xs mb-3" style={{ color: "#7a5a28" }}>
                  🥑 Bạn có: {avocados.toLocaleString()} hạt bơ
                </p>

                {error && (
                  <p
                    className="text-xs mb-3 flex items-center justify-center gap-1"
                    style={{ color: "#c06050" }}
                  >
                    <AlertCircle className="w-3 h-3" /> Không đủ hạt bơ!
                  </p>
                )}

                <button
                  onClick={handleUnlockWithAvocados}
                  disabled={avocados < (selectedBook.unlockCost ?? 0)}
                  className="w-full py-2 text-sm uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(200,160,64,0.15), rgba(100,80,30,0.3))",
                    border: "1px solid #c8a040",
                    borderRadius: "4px",
                    color: "#f0d080",
                  }}
                >
                  🥑 Mở khóa
                </button>
              </div>
            </div>
          ) : (
            /* Reading panel */
            <div className="space-y-4">
              {/* Book header */}
              <div
                className="pb-3 border-b"
                style={{ borderBottom: "1px solid #2a1a08" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#e8c97a" }}
                    >
                      {selectedBook.title}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: "#7a5a28" }}>
                      {selectedBook.pages.length} chương
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="p-1 rounded transition-colors hover:bg-black/20"
                  >
                    <X className="w-4 h-4" style={{ color: "#7a5a28" }} />
                  </button>
                </div>
              </div>

              {/* Book content */}
              <div
                className="min-h-[300px] p-4 rounded"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: "#c8a870" }}
                >
                  {selectedBook.pages[currentPage]}
                </p>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-1">
                  {selectedBook.pages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className="transition-all"
                      style={{
                        width: i === currentPage ? "20px" : "8px",
                        height: "4px",
                        background: i === currentPage ? "#c8a040" : "#3a2810",
                        borderRadius: "2px",
                      }}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-1 rounded transition-all disabled:opacity-30 hover:bg-black/20"
                  >
                    <ChevronLeft
                      className="w-4 h-4"
                      style={{ color: "#c8a040" }}
                    />
                  </button>
                  <span className="text-xs" style={{ color: "#7a5a28" }}>
                    {currentPage + 1}/{selectedBook.pages.length}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(selectedBook.pages.length - 1, p + 1),
                      )
                    }
                    disabled={currentPage === selectedBook.pages.length - 1}
                    className="p-1 rounded transition-all disabled:opacity-30 hover:bg-black/20"
                  >
                    <ChevronRight
                      className="w-4 h-4"
                      style={{ color: "#c8a040" }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
