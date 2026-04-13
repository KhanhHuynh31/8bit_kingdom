"use client";

import { Building } from "@/stores/types";
import {
  Book,
  Scroll,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  X,
  Filter,
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
  Sparkles,
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
  { id: "all", label: "Tất cả", icon: Filter },
  { id: "FanBuilt", label: "Xây theo Fan", icon: Sparkles },
  { id: "MainBuilding", label: "Công trình chính", icon: Castle },
  { id: "Mystery", label: "Bí ẩn vương quốc", icon: Lock },
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
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. XÂY NHÀ THEO FAN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "tuna-pond",
    title: "Ao cá Tuna huyền thoại",
    category: "FanBuilt",
    description: "Được xây dựng từ ý kiến của thần dân Genji - Nơi linh vật Tuna sinh sống và tiến hóa",
    icon: Fish,
    color: "blue",
    pages: [
      "📜 CHƯƠNG 1: KHỞI NGUỒN\n\nThuở xa xưa, khi vương quốc Bơ còn non trẻ, một thần dân tên Genji đã có linh cảm về một sinh vật thần bí dưới đáy đại dương. Ngài đã tâu lên nhà vua: 'Muôn tâu, thần thấy trong giấc mơ có một loài cá mang linh khí của trái bơ, nếu được nuôi dưỡng bằng hạt bơ và tình yêu thương, nó sẽ trở thành linh vật hộ quốc!'",
      "📜 CHƯƠNG 2: XÂY DỰNG AO THIÊNG\n\nVua Bơ đã lắng nghe và cho xây dựng Ao Cá Tuna ngay tại trung tâm vương quốc. Ao được lát bằng đá quý từ núi Bơ Cổ Thụ và nước từ suối nguồn sự sống. Người dân có thể đến cho Tuna ăn mỗi ngày, trò chuyện và chăm sóc nó. Mỗi hạt bơ cho ăn đều được ghi nhận như một hành động nuôi dưỡng linh hồn vương quốc.",
      "📜 CHƯƠNG 3: TIẾN HÓA THẦN KỲ\n\nTruyền thuyết kể rằng khi Tuna ăn đủ 1000 hạt bơ, nó sẽ bước vào giai đoạn tiến hóa. Ánh hào quang bảy màu bao phủ khắp ao, và Tuna biến hình thành Long Ngư - sinh vật nửa cá nửa rồng, mang theo sức mạnh bảo hộ cho toàn vương quốc. Những ai chứng kiến khoảnh khắc đó sẽ được ban phước lành về may mắn và thịnh vượng.",
      "📜 CHƯƠNG 4: LINH VẬT HỘ QUỐC\n\nNgày nay, Tuna - Long Ngư vẫn đang chờ đợi ngày được tiến hóa. Mỗi thần dân đều có thể ghé thăm ao, cho Tuna ăn và trò chuyện. Hãy cùng nhau góp nhặt hạt bơ để chứng kiến phép màu!",
    ],
  },
  {
    id: "t1-cup",
    title: "Cúp T1 - Đấu trường huyền thoại",
    category: "FanBuilt",
    description: "Món quà từ thần dân SleepyDragon - Cơ hội mời tuyển thủ chuyên nghiệp về vương quốc",
    icon: Trophy,
    color: "red",
    pages: [
      "📜 CHƯƠNG 1: LỜI THỈNH CẦU\n\nSleepyDragon - một chiến binh say mê thể thao điện tử - đã từng ước mơ được gặp thần tượng của mình. Ngài đã cống hiến cả gia tài để xây dựng chiếc Cúp T1 lần thứ 6, một bảo vật có khả năng kết nối với các tuyển thủ chuyên nghiệp trên khắp thế gian.",
      "📜 CHƯƠNG 2: SỨC MẠNH CỦA CÚP\n\nChiếc cúp không chỉ là vật trang trí. Khi một thần dân tương tác với nó bằng cả trái tim, cúp sẽ phát ra ánh sáng xanh và mở ra cánh cổng kết nối. Vị tuyển thủ chuyên nghiệp được triệu hồi sẽ đến vương quốc, tham gia giao lưu và thi đấu với mọi người.",
      "📜 CHƯƠNG 3: THÁCH THỨC VÀ VINH QUANG\n\nĐiều kỳ diệu nhất: Khi tuyển thủ xuất hiện, bất kỳ ai đối đầu với ngài trong các trận đấu hữu nghị đều có cơ hội chiến thắng một cách dễ dàng, như thể được chính cúp tiếp thêm sức mạnh. Đây là món quà mà SleepyDragon muốn dành tặng cho toàn thể vương quốc - niềm vui chiến thắng và sự kết nối với những huyền thoại.",
      "📜 CHƯƠNG 4: NGHI THỨC TRIỆU HỒI\n\nHãy chạm vào cúp vào những đêm trăng tròn, thì cánh cổng sẽ mở rộng nhất. Tuyển thủ sẽ lưu lại vương quốc trong 7 ngày, sẵn sàng giao lưu, hướng dẫn và thi đấu cùng bất kỳ ai có lòng nhiệt thành!",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CÔNG TRÌNH CHÍNH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "avocado-castle",
    title: "Lâu đài Bơ - Trái tim vương quốc",
    category: "MainBuilding",
    description: "Công trình vĩ đại nhất, nơi hội tụ linh khí của muôn loài trái cây",
    icon: Castle,
    color: "amber",
    pages: [
      "📜 CHƯƠNG 1: KIẾN TRÚC THẦN THOẠI\n\nLâu đài Bơ được xây dựng từ khối đá cẩm thạch màu xanh ngọc, hình dáng như một quả bơ khổng lồ vươn lên trời cao. 7 tòa tháp tượng trưng cho 7 vị thần trái cây cổ đại, đỉnh tháp là những viên ngọc bơ lấp lánh dưới ánh mặt trời.",
      "📜 CHƯƠNG 2: ĐẠI SẢNH HOÀNG GIA\n\nBên trong lâu đài là Đại sảnh Bơ - nơi diễn ra các buổi lễ trọng đại. Trần sảnh được trang trí bằng tranh khắc họa lịch sử vương quốc, từ thuở hồng hoang đến kỷ nguyên vàng son. Chiếc ngai vàng được chạm khắc hình những quả bơ vàng óng, nơi nhà vua ngự trị và ban phát lời chúc phúc.",
      "📜 CHƯƠNG 3: THƯ VIỆN BÍ MẬT\n\nSâu dưới hầm lâu đài là thư viện cổ chứa hàng ngàn cuộn giấy ghi chép bí thuật. Chỉ những người có đủ 500 hạt bơ mới được bước vào, và ở đó họ có thể học được cách triệu hồi năng lượng từ các vì sao để gia tăng sức mạnh cho vương quốc.",
      "📜 CHƯƠNG 4: LINH HỒN VƯƠNG QUỐC\n\nLâu đài Bơ không chỉ là nơi ở của hoàng gia, mà còn là trái tim điều khiển toàn bộ năng lượng của vương quốc. Khi năng lượng dồi dào, lâu đài sẽ phát sáng rực rỡ, báo hiệu một thời kỳ thịnh vượng sắp đến. Hãy chăm sóc lâu đài, và lâu đài sẽ chăm sóc bạn!",
    ],
  },
  {
    id: "you-bank",
    title: "Ngân hàng You Bank - Kho bạc quốc gia",
    category: "MainBuilding",
    description: "Nơi cất giữ và sinh lời từ những hạt bơ quý giá",
    icon: Landmark,
    color: "blue",
    pages: [
      "📜 CHƯƠNG 1: KHỞI NGUỒN CỦA SỰ THỊNH VƯỢNG\n\nYou Bank được thành lập bởi thương nhân giàu nhất vương quốc - ngài You. Với mong muốn giúp thần dân bảo toàn và gia tăng tài sản, ngài đã cho xây dựng một ngân hàng ngay cạnh chợ trung tâm.",
      "📜 CHƯƠNG 2: CƠ CHẾ KỲ DIỆU\n\nGửi hạt bơ vào You Bank, sau mỗi chu kỳ mặt trăng, số bơ của bạn sẽ tự động sinh lời thêm 5%. Nhiều thần dân đã trở nên giàu có chỉ sau một năm nhờ vào sức mạnh của lãi kép. Ngân hàng còn có tủ két sắt bằng vàng ròng, bảo vệ tài sản khỏi mọi thế lực hắc ám.",
      "📜 CHƯƠNG 3: DỊCH VỤ ĐẶC BIỆT\n\nVới 1000 hạt bơ, bạn có thể mở tài khoản V.I.P, được hưởng lãi suất lên đến 10% và có cơ hội vay vốn để xây dựng công trình riêng. Ngân hàng còn tổ chức các buổi đấu giá bơ quý hiếm, nơi những hạt bơ ngàn năm được trao tay.",
      "📜 CHƯƠNG 4: BẢO VỆ BỞI HỘ PHÁP\n\nYou Bank được bảo vệ bởi 3 con sư tử đá có phép thuật. Bất kỳ ai có ý định trộm cắp sẽ bị biến thành cây bơ trong 100 năm. Hãy yên tâm gửi gắm tài sản của bạn, vì You Bank là nơi an toàn nhất vương quốc!",
    ],
  },
  {
    id: "cinema",
    title: "Rạp phim Bơwood - Nghệ thuật thứ bảy",
    category: "MainBuilding",
    description: "Nơi ước mơ được thêu dệt bằng ánh sáng và âm thanh",
    icon: Clapperboard,
    color: "purple",
    pages: [
      "📜 CHƯƠNG 1: KHÁT VỌNG ĐIỆN ẢNH\n\nNhận thấy tài năng kể chuyện của thần dân, Vua Bơ đã cho xây dựng một rạp chiếu phim hoành tráng. Bơwood nhanh chóng trở thành trung tâm văn hóa, nơi mỗi tuần đều có những bộ phim kể về hành trình của vương quốc được công chiếu.",
      "📜 CHƯƠNG 2: PHÙ THỦY ÁNH SÁNG\n\nRạp phim có một bảo vật đặc biệt - Máy chiếu Huyền Thoại, có khả năng biến những câu chuyện trong sách thành hình ảnh sống động. Người xem có thể bước vào trong phim, tương tác với các nhân vật và trở thành một phần của câu chuyện. Cảm giác như đang sống trong một giấc mơ!",
      "📜 CHƯƠNG 3: LIÊN HOAN PHIM HÀNG NĂM\n\nMỗi năm, Bơwood tổ chức liên hoan phim lớn nhất vương quốc. Giải thưởng 'Quả Bơ Vàng' được trao cho bộ phim xuất sắc nhất. Người chiến thắng không chỉ nhận 500 hạt bơ mà còn được khắc tượng tại Quảng trường Danh vọng, bất tử cùng lịch sử.",
      "📜 CHƯƠNG 4: RẠP CHIẾU DƯỚI ÁNH TRĂNG\n\nVào đêm rằm, rạp mở cửa miễn phí cho tất cả thần dân. Ghế ngồi được làm từ mây, phim chiếu trên bầu trời đầy sao. Đây là khoảnh khắc thiêng liêng nhất, nơi mọi người quên đi muộn phiền và cùng nhau mơ về một tương lai tươi sáng hơn.",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BÍ ẨN VƯƠNG QUỐC (Locked by Avocados)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "planting-avocado",
    title: "🌱 Bí ẩn 1: Trồng Bơ thu hoạch",
    category: "Mystery",
    description: "Từ một hạt bơ nhỏ bé, cả một khu rừng có thể được sinh sôi",
    icon: Sprout,
    color: "green",
    unlockCost: 100,
    pages: [
      "🔮 KHÁM PHÁ BÍ MẬT\n\nBạn vừa mở khóa bí ẩn đầu tiên! Trong khu vườn cấm của vương quốc, có một mảnh đất màu mỡ đặc biệt. Nếu bạn gieo một hạt bơ xuống đó vào lúc bình minh, và tưới nước bằng năng lượng tinh thần của mình, chỉ sau 7 ngày, một cây bơ non sẽ mọc lên.",
      "🔮 CHU KỲ THU HOẠCH\n\nCây bơ sẽ cho trái sau 30 ngày. Mỗi cây có thể cho từ 10 đến 50 hạt bơ tùy vào cách bạn chăm sóc. Hãy nói chuyện với cây mỗi ngày, hát cho cây nghe, và bạn sẽ được đền đáp xứng đáng. Nhiều thần dân đã trở thành triệu phú nhờ vào việc trồng bơ!",
      "🔮 BÍ QUYẾT GIA TĂNG SẢN LƯỢNG\n\nSử dụng phân bón từ vỏ chuối và bã cà phê sẽ giúp cây ra trái sai hơn. Ngoài ra, nếu có từ 3 thần dân cùng chăm sóc một cây, sản lượng có thể tăng gấp đôi. Hãy rủ bạn bè đến cùng trồng bơ nhé!",
    ],
  },
  {
    id: "ancient-tree",
    title: "🌳 Bí ẩn 2: Thu hoạch từ cây cổ thụ",
    category: "Mystery",
    description: "Cây bơ cổ thụ - chứng nhân ngàn năm của vương quốc",
    icon: TreeDeciduous,
    color: "green",
    unlockCost: 500,
    pages: [
      "🔮 CÂY CỔ THỤ THIÊNG LIÊNG\n\nSâu trong khu rừng cấm, có một cây bơ đã sống hơn 1000 năm. Thân cây to đến mức 10 người ôm không xuể. Rễ cây ăn sâu vào lòng đất, kết nối với mạch nguồn năng lượng của toàn vương quốc.",
      "🔮 NGHI THỨC THU HOẠCH\n\nCây cổ thụ chỉ ra trái vào đêm trăng tròn mỗi tháng một lần. Để thu hoạch, bạn cần mang theo 50 hạt bơ làm lễ vật và đọc thần chú: 'Bơ ơi, bơ hỡi, xin rơi xuống đây, để xây vương quốc, đời đời ấm no.' Ngay sau đó, những quả bơ vàng óng sẽ lần lượt rụng xuống.",
      "🔮 PHẦN THƯỞNG TỪ CỔ THỤ\n\nMỗi lần thu hoạch, bạn có thể nhận từ 200 đến 1000 hạt bơ. Đặc biệt, có 1% cơ hội nhận được 'Bơ Vàng Huyền Thoại' - loại bơ có thể đổi lấy bất kỳ vật phẩm nào trong vương quốc, kể cả việc mở khóa ngay lập tức một công trình mà không cần chờ đợi.",
      "🔮 TRUYỀN THUYẾT VỀ NGƯỜI BẢO VỆ\n\nCây cổ thụ có một người bảo vệ vô hình - linh hồn của vị vua đầu tiên. Nếu bạn thu hoạch với lòng tham, bạn sẽ nhận lại quả bơ thối và bị cấm túc trong 30 ngày. Hãy luôn thành kính và biết ơn!",
    ],
  },
  {
    id: "seed-mystery",
    title: "🗝️ Bí ẩn 3: Hạt Bơ mở khóa bí mật",
    category: "Mystery",
    description: "Những cánh cổng bí ẩn chỉ mở ra khi có đủ hạt bơ",
    icon: Key,
    color: "red",
    unlockCost: 1000,
    pages: [
      "🔑 CÁNH CỔNG THỜI GIAN\n\nSâu dưới hầm Lâu đài Bơ, có một cánh cổng bằng đá bazan đen, trên đó chạm khắc hình một quả bơ khổng lồ. Xung quanh có 7 ổ khóa nhỏ. Truyền thuyết kể rằng nếu bạn bỏ đủ 1000 hạt bơ vào 7 ổ khóa đó, cánh cổng sẽ mở ra, đưa bạn đến một chiều không gian khác - nơi thời gian trôi chậm hơn gấp 10 lần.",
      "🔑 VÙNG ĐẤT THỜI GIAN\n\nBên trong cánh cổng là một thung lũng bí mật. Ở đó, 1 ngày trôi qua tương đương với 10 ngày bên ngoài. Bạn có thể học tập, rèn luyện và xây dựng với tốc độ nhanh gấp bội. Nhiều pháp sư vĩ đại đã trở nên bất tử nhờ phát hiện ra nơi này. Nhưng hãy cẩn thận: ra vào quá nhiều có thể khiến bạn bị lạc trong dòng chảy thời gian!",
      "🔑 NHỮNG BÍ MẬT KHÁC\n\nNgoài cánh cổng thời gian, hạt bơ còn có thể mở khóa: Rương kho báu dưới đáy Ao Tuna (200 bơ), Cánh cổng vào thư viện cấm (500 bơ), và Bí mật về công thức nấu ăn của các vị thần (1500 bơ). Mỗi bí mật đều mở ra một thế giới mới đầy bất ngờ!",
      "🔑 LỜI KHUYÊN TỪ NHÀ HIỀN TRIẾT\n\nĐừng tiêu xài hết tất cả hạt bơ bạn có. Hãy dành ra một phần để dự phòng cho những bí ẩn lớn hơn. Vương quốc Bơ vẫn còn hàng ngàn điều kỳ diệu chưa được khám phá, và hạt bơ chính là chìa khóa vạn năng mở ra mọi cánh cửa!",
    ],
  },
];

// ─── Helper để kiểm tra unlock dựa trên số bơ ─────────────────────────────────
const isBookUnlocked = (book: BookInput, avocados: number): boolean => {
  if (book.category !== "Mystery") return true;
  return avocados >= (book.unlockCost ?? 0);
};

// ─── Component ────────────────────────────────────────────────────────────────
export const LibraryContent = ({ data }: { data: Building }) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Lấy số bơ từ store
  const avocados = useMapStore((state) => state.avocados);

  // Xây dựng danh sách sách với trạng thái khóa dựa trên số bơ
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
    if (activeTab === "all") return BOOKS;
    return BOOKS.filter((b) => b.category === activeTab);
  }, [activeTab, BOOKS]);

  const handleOpenBook = (book: BookData) => {
    setSelectedBook(book);
    setCurrentPage(0);
    setError(false);
  };

  // Với Mystery books cần unlock bằng bơ, ta sẽ dùng nút "Dùng bơ để mở"
  const handleUnlockWithAvocados = () => {
    if (selectedBook && selectedBook.unlockCost && avocados >= selectedBook.unlockCost) {
      // Trong thực tế, sẽ gọi action để trừ bơ
      // Ở đây ta chỉ set state để demo
      setError(false);
      // TODO: Gọi store action để trừ bơ
      // useMapStore.getState().spendAvocados(selectedBook.unlockCost);
      
      // Cập nhật trạng thái mở khóa
      setSelectedBook({
        ...selectedBook,
        isLocked: false,
      });
    } else {
      setError(true);
    }
  };

  const colorMap: Record<string, { border: string; icon: string; glow: string }> = {
    blue: { border: "#3a5a8a", icon: "#7aaad4", glow: "rgba(80,140,220,0.25)" },
    red: { border: "#7a2a1a", icon: "#c07060", glow: "rgba(180,60,40,0.25)" },
    purple: { border: "#5a3a7a", icon: "#a07ac0", glow: "rgba(120,60,180,0.25)" },
    amber: { border: "#7a5a1a", icon: "#c8a040", glow: "rgba(200,160,60,0.25)" },
    green: { border: "#2a6a3a", icon: "#60c090", glow: "rgba(60,160,80,0.25)" },
  };

  return (
    <div className="space-y-5">

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
            style={{ color: "#c8a040" }}
          >
            <Book className="w-4 h-4" />
            {data.name || "Thư Viện Vương Quốc Bơ"}
          </h2>
          <span className="text-[10px] italic" style={{ color: "#5a4020" }}>
            📖 Kho báu tri thức • 🥑 {avocados.toLocaleString()} hạt bơ
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
          const c = colorMap[book.color] ?? colorMap.amber;
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
              <div
                className="absolute inset-x-0 top-0 h-px transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent, ${c.icon}, transparent)`,
                }}
              />

              <div className="flex items-start gap-3">
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
                    {book.isLocked
                      ? `🔒 Cần ${book.unlockCost?.toLocaleString()} hạt bơ để mở khóa bí ẩn này...`
                      : book.description}
                  </p>
                  {book.category === "Mystery" && !book.isLocked && (
                    <span className="inline-block text-[9px] mt-1" style={{ color: "#60c090" }}>
                      ✅ Đã mở khóa
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Book modal ──────────────────────────────────────────────── */}
      {selectedBook && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
            <div style={{
              height: 3,
              background: "linear-gradient(90deg, transparent, #5a3e14 10%, #c8a040 30%, #f0d882 50%, #c8a040 70%, #5a3e14 90%, transparent)",
            }} />

            {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos, i) => (
              <span key={i} className={`absolute ${pos} text-[#6b4c1e] text-sm z-10 leading-none`}>✦</span>
            ))}

            {selectedBook.isLocked && selectedBook.category === "Mystery" ? (
              /* ── Unlock with Avocados ── */
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
                  <h3 className="text-lg mb-1" style={{ color: "#e8c97a", letterSpacing: "0.08em" }}>
                    📜 Bí Ẩn Cổ Đại
                  </h3>
                  <p className="text-sm italic" style={{ color: "#7a5a28" }}>
                    {selectedBook.title}
                  </p>
                </div>

                <div className="flex items-center gap-3" style={{ color: "#4a3410" }}>
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,#4a3410)" }} />
                  <span className="text-xs">🥑</span>
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,#4a3410,transparent)" }} />
                </div>

                <div className="space-y-3 px-2">
                  <p className="text-sm" style={{ color: "#a08050" }}>
                    Sử thi kể rằng, để mở khóa bí ẩn này, người hành hương cần cống hiến{' '}
                    <strong style={{ color: "#c8a040" }}>{selectedBook.unlockCost?.toLocaleString()} hạt bơ</strong>{' '}
                    cho kho báu vương quốc.
                  </p>
                  <p className="text-xs" style={{ color: "#5a4020" }}>
                    🥑 Bạn hiện có: {avocados.toLocaleString()} hạt bơ
                  </p>

                  {error && (
                    <p className="flex items-center justify-center gap-1 text-[11px]" style={{ color: "#c06050" }}>
                      <AlertCircle className="w-3 h-3" /> Không đủ hạt bơ để mở khóa bí ẩn này!
                    </p>
                  )}

                  <button
                    onClick={handleUnlockWithAvocados}
                    disabled={avocados < (selectedBook.unlockCost ?? 0)}
                    className="w-full py-2.5 text-sm uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(180deg, rgba(140,100,30,0.5), rgba(80,55,15,0.5))",
                      border: "1px solid #8b6530",
                      borderRadius: "2px",
                      color: "#e8c97a",
                      boxShadow: "0 0 16px rgba(180,130,40,0.2), inset 0 1px 0 rgba(255,220,100,0.1)",
                    }}
                  >
                    🥑 Dùng {selectedBook.unlockCost?.toLocaleString()} hạt bơ để giải ấn
                  </button>
                </div>

                <button
                  onClick={() => setSelectedBook(null)}
                  className="text-[10px] uppercase tracking-widest transition-colors"
                  style={{ color: "#3a2810" }}
                >
                  Hủy bỏ
                </button>
              </div>
            ) : (
              /* ── Reading screen ── */
              <>
                <div
                  className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: "1px solid #3a2810" }}
                >
                  <div className="flex items-center gap-2" style={{ color: "#c8a040" }}>
                    <Scroll className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs uppercase tracking-widest truncate" style={{ color: "#e8c97a" }}>
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

                <div className="px-8 py-7 min-h-[220px] relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <Scroll className="w-56 h-56 text-amber-500 rotate-12" />
                  </div>
                  <div
                    className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 100% 0%, rgba(200,160,60,0.07), transparent 70%)" }}
                  />

                  <p
                    className="relative z-10 text-base leading-loose italic whitespace-pre-line"
                    style={{ color: "#c8a870" }}
                  >
                    {selectedBook.pages[currentPage]}
                  </p>
                </div>

                <div
                  className="px-6 py-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid #2a1a08", background: "rgba(0,0,0,0.25)" }}
                >
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
                    <span className="text-[10px]" style={{ color: "#5a4020" }}>
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

        .close-btn {
          position: relative;
          overflow: visible !important;
          transition: color .25s, border-color .25s, box-shadow .25s;
        }
        .close-btn::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 1.5px dashed #7a3a20;
          opacity: 0;
          transition: opacity .3s;
          animation: fantasy-spin 4s linear infinite;
          animation-play-state: paused;
          pointer-events: none;
        }
        .close-btn:hover {
          color: #ffd0b0 !important;
          border-color: #d06040 !important;
          box-shadow: 0 0 18px rgba(200,80,50,.55);
        }
        .close-btn:hover::before {
          opacity: 1;
          animation-play-state: running;
        }
        .close-btn:active {
          transform: scale(0.92);
        }
        @keyframes fantasy-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};