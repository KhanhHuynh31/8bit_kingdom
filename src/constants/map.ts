import { Building } from "@/stores/types";
import {
  DEFENSE_BUILDINGS,
  SECONDARY_BUILDINGS,
  TORCH_BUILDINGS,
} from "./other";

export const TILE_SIZE = 48;
export const CHUNK_SIZE = 16;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.0;
export const ZOOM_STEP = 0.1;

// --- 1. NHÓM CÔNG TRÌNH CHÍNH (MAIN) ---
const MAIN_BUILDINGS: Building[] = [
  {
    id: "castle",
    name: "Lâu Đài Bơ",
    description:
      "Công trình tối quan trọng của vương quốc, lâu đài được xây dựng từ năng lượng của thần dân, tỏa sáng rực rỡ dưới ánh mặt trời.",
    worldX: -2,
    worldY: -2,
    width: 4,
    height: 4,
    type: "main",
    animationType: "float",
    imageSrc: "/assets/buildings/castle.png",
    interactive: true,
  },
  {
    id: "museum",
    name: "Bảo tàng",
    description:
      "Nơi trưng bày những mảnh vỡ ký ức và cổ vật từ thời sơ khai của vương quốc. Mỗi hiện vật đều mang một sức mạnh tiềm ẩn.",
    worldX: -5,
    worldY: 3,
    width: 3,
    height: 3,
    type: "main",
    imageSrc: "/assets/buildings/museum.png",
    interactive: true,
  },
  {
    id: "cinema",
    name: "Rạp phim",
    description:
      "Nơi trình chiếu những thước phim sử thi về các cuộc hành trình vĩ đại. Âm thanh và hình ảnh tại đây có thể làm lay động lòng người.",
    worldX: 6,
    worldY: 3,
    width: 3,
    height: 3,
    type: "main",
    imageSrc: "/assets/buildings/cinema.png",
    interactive: true,
  },
  {
    id: "bank",
    name: "Ngân hàng",
    description:
      "Trung tâm tài chính sầm uất, nơi quản lý kho báu và giao dịch các đồng tiền vàng quý hiếm của toàn bộ thần dân.",
    worldX: 1,
    worldY: 3,
    width: 4,
    height: 3,
    type: "main",
    imageSrc: "/assets/buildings/bank.png",
    interactive: true,
  },

  {
    id: "library",
    name: "Thư viện",
    description:
      "Kho tàng tri thức khổng lồ với những cuốn sách phép thuật và bản đồ cổ dẫn lối đến các vùng đất chưa từng được biết tới.",
    worldX: -10,
    worldY: 3,
    width: 4,
    height: 3,
    type: "main",
    imageSrc: "/assets/buildings/library.png",
    interactive: true,
  },

  {
    id: "news",
    name: "Bảng tin",
    description:
      "Cầu nối liên lạc giữa các vùng đất xa xôi. Những lá thư tay mang theo tâm tình và cả những mật báo quan trọng.",
    worldX: -7,
    worldY: -1,
    width: 3,
    height: 3,
    type: "main",
    imageSrc: "/assets/buildings/news.png",
    interactive: true,
  },
  {
    id: "farm",
    name: "Trang trại",
    description:
      "Nơi trồng trọt và chăn nuôi, cung cấp nguồn thực phẩm cho thần dân vương quốc.",
    worldX: 2,
    worldY: -17,
    width: 8,
    height: 6,
    type: "secondary",
    imageSrc: "/assets/farm/farm.png",
    interactive: true,
  },
  {
    id: "summoning_gate",
    name: "Cổng Triệu Hồi",
    description: "Cổng kết nối với thế giới khác, nơi triệu hồi các anh hùng.",
    worldX: 5, // ← điều chỉnh vị trí cho phù hợp với map của bạn
    worldY: -6,
    width: 3,
    height: 3,
    type: "decoration",
    imageSrc: "/assets/decorate/gate.png",
    interactive: true,
    zIndex: 6,
  },
];

// --- TỔNG HỢP TẤT CẢ ---
export const BUILDINGS: Building[] = [
  ...MAIN_BUILDINGS,
  ...SECONDARY_BUILDINGS,
  ...TORCH_BUILDINGS,
  ...DEFENSE_BUILDINGS,
];
