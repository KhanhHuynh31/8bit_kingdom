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
      "Thánh địa tối cao của vương quốc, nơi lưu giữ công thức chế biến bơ thần thánh và là nơi ngự trị của các vị vua Pixel.",
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
      "Trung tâm tài chính sầm uất, nơi quản lý kho báu và giao dịch các đồng tiền vàng quý hiếm của toàn bộ cư dân.",
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
  // {
  //   id: "mailbox",
  //   name: "Hòm thư",
  //   description:
  //     "Cầu nối liên lạc giữa các vùng đất xa xôi. Những lá thư tay mang theo tâm tình và cả những mật báo quan trọng.",
  //   worldX: -12,
  //   worldY: -1,
  //   width: 3,
  //   height: 3,
  //   type: "main",
  //   imageSrc: "/assets/buildings/mailbox.png",
  //   interactive: true,
  // },

  // {
  //   id: "property",
  //   name: "Sàn giao dịch",
  //   description:
  //     "Cầu nối liên lạc giữa các vùng đất xa xôi. Những lá thư tay mang theo tâm tình và cả những mật báo quan trọng.",
  //   worldX: 10,
  //   worldY: 3,
  //   width: 3,
  //   height: 3,
  //   type: "main",
  //   imageSrc: "/assets/buildings/property.png",
  //   interactive: true,
  // },
  // {
  //   id: "fame",
  //   name: "Sảnh danh vọng",
  //   description:
  //     "Bức tường vinh danh những chiến binh và cộng sự đã có đóng góp to lớn cho sự hưng thịnh của vương quốc.",
  //   worldX: -5,
  //   worldY: 3,
  //   width: 3,
  //   height: 3,
  //   type: "main",
  //   imageSrc: "/assets/buildings/fame.png",
  //   interactive: true,
  // },
];

// --- TỔNG HỢP TẤT CẢ ---
export const BUILDINGS: Building[] = [
  ...MAIN_BUILDINGS,
  ...SECONDARY_BUILDINGS,
  ...TORCH_BUILDINGS,
  ...DEFENSE_BUILDINGS,
];
