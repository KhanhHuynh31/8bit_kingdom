export interface Building {
  id: string;
  name: string;
  stats?: {
    subscribers?: string | number;
    videoCount?: string | number;
  };
  description: string;
  worldX: number; // tọa độ thế giới (tính từ nhà chính = 0,0)
  worldY: number;
  width: number; // số tile chiều ngang
  height: number; // số tile chiều dọc
  type: "main" | "secondary" | "decoration" | "torch";
  animationType?: string;
  zIndex?: number; // ưu tiên vẽ trước (nhỏ hơn) hay sau (lớn hơn) khi cùng loại
  imageSrc: string;
  interactive: boolean;
  clickedAt?: number; // timestamp mỗi lần click, tạo unique key
}

export interface Camera {
  offsetX: number; // pixel offset so với center màn hình
  offsetY: number;
  zoom: number;
}

export type TileType = "grass" | "grass_dark" | "path" | "water" | "flower";
