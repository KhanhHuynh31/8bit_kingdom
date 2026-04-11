import { FarmState } from "./slices/farmSlice";
import { GachaState } from "./slices/gachaSlice";

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
export interface SpatialData {
  grid: Map<string, { ids: string[] }>;
  buildingMap: Map<string, Building>;
}

export interface TunaRefs {
  visible: boolean;
  offsetY: number;
  animating: boolean;
  diving: boolean;
  progress: number;
  hiddenIds: Set<string>;
}
export interface Camera {
  offsetX: number; // pixel offset so với center màn hình
  offsetY: number;
  zoom: number;
}

export type TileType = "grass" | "grass_dark" | "path" | "water" | "flower";
export const DEFAULT_CAMERA: Camera = { offsetX: 0, offsetY: 0, zoom: 1 };
export const DEFAULT_YT_STATS: YtStats = {
  subscribers: 0,
  views: 0,
  totalLikes: 0,
  totalComments: 0,
  videoCount: 0,
  lastUpdated: 0,
};

export const YOUTUBE_CHANNEL_ID = "UCXA1PWUJIHV_PDStz7ksAUg";
export const TUNA_ANIM_DURATION = 800;
export const TUNA_FLOAT_OFFSET = 3;

export const DEFAULT_T1_X = 9;
export const DEFAULT_T1_Y = -8;
export const TROPHY_X = 12;
export const TROPHY_Y = -7;
export const T1_W = 3;
export const FAR_LEFT_X = TROPHY_X - 30;

export interface News {
  id: string;
  title: string;
  content: string;
  type: "important" | "news" | "classified";
}

export interface YtStats {
  subscribers: number;
  views: number;
  totalLikes: number;
  totalComments: number;
  videoCount: number;
  lastUpdated: number;
}

export interface T1Animation {
  active: boolean;
  startX: number;
  endX: number;
  startY: number;
  progress: number;
  startTime: number;
  duration: number;
}

export interface T1AppearAnimation {
  active: boolean;
  startX: number;
  endX: number;
  startY: number;
  progress: number;
  startTime: number;
  duration: number;
}

export interface MapState extends FarmState, GachaState {
  // ← THÊM
  // Building & General
  camera: Camera;
  selectedBuilding: Building | null;
  avocados: number;
  isLoading: boolean;
  lastHarvestTime: Record<string, number>;
  unlockedMemories: number[];
  latestNews: News | null;

  // Youtube
  ytStats: YtStats;

  // Tuna
  tunaVisible: boolean;
  tunaAnimOffsetY: number;
  tunaAnimating: boolean;
  tunaDiving: boolean;
  tunaInfoOpen: boolean;
  tunaProgress: number;

  // T1 & Trophy
  t1Visible: boolean;
  t1WorldX: number;
  t1WorldY: number;
  trophyVisible: boolean;
  t1Animation: T1Animation | null;
  t1AppearAnimation: T1AppearAnimation | null;
  mergedVisible: boolean;

  // Actions
  fetchYtStats: (force?: boolean) => Promise<void>;
  unlockMemory: (slotId: number, cost: number) => boolean;
  setCamera: (camera: Camera) => void;
  updateOffset: (dx: number, dy: number) => void;
  setZoom: (zoom: number) => void;
  selectBuilding: (building: Building | null) => void;
  harvest: (buildingId: string) => void;
  addAvocados: (amount: number) => void;
  setLatestNews: (news: News) => void;
  setTunaProgress: (val: number) => void;
  animateTuna: () => void;
  sinkTuna: () => void;
  toggleTunaInfo: () => void;
  showT1LeftOfTrophy: () => void;
  startT1MoveAcrossTrophy: () => void;
  updateT1Animation: (now: number) => void;
  resetT1AndTrophy: () => void;
}
