"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimeStatus, WeatherType } from "@/hooks/useTimeCycle";
import { useMapStore } from "@/stores/mapStore";
import { MIN_ZOOM, MAX_ZOOM } from "@/constants/map";
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  CloudRain,
  CloudSnow,
  SunMedium,
  Zap,
  ZapOff,
  CloudLightning,
  LucideIcon,
  Plus,
  Minus,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

// --- Interfaces ---
interface ConfigDetail {
  icon: LucideIcon;
  color: string;
  label: string;
}

interface HUDProps {
  currentStatus: TimeStatus;
  currentWeather: WeatherType;
  manualTime: TimeStatus | null;
  manualWeather: WeatherType | null;
  setManualTime: (val: TimeStatus | null) => void;
  setManualWeather: (val: WeatherType | null) => void;
}

// --- Configs ---
const TIME_CONFIG: Record<TimeStatus, ConfigDetail> = {
  morning: { icon: Sunrise, color: "text-orange-400", label: "Sáng" },
  afternoon: { icon: Sun, color: "text-yellow-400", label: "Trưa" },
  evening: { icon: Sunset, color: "text-indigo-400", label: "Chiều" },
  night: { icon: Moon, color: "text-blue-400", label: "Đêm" },
};

const WEATHER_CONFIG: Record<WeatherType, ConfigDetail> = {
  sunny: { icon: SunMedium, color: "text-yellow-200", label: "Nắng" },
  rain: { icon: CloudRain, color: "text-blue-400", label: "Mưa" },
  storm: { icon: CloudLightning, color: "text-purple-400", label: "Bão" },
  snow: { icon: CloudSnow, color: "text-slate-100", label: "Tuyết" },
};

export default function HUD({
  currentStatus,
  currentWeather,
  manualTime,
  manualWeather,
  setManualTime,
  setManualWeather,
}: HUDProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { camera, setZoom } = useMapStore();
  const isAutoMode = !manualTime && !manualWeather;

  const handleZoom = (delta: number) => {
    const newZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, parseFloat((camera.zoom + delta).toFixed(1))),
    );
    setZoom(newZoom);
  };

  const cycleTime = (dir: number) => {
    const keys = Object.keys(TIME_CONFIG) as TimeStatus[];
    const idx = keys.indexOf(currentStatus);
    const next = (idx + dir + keys.length) % keys.length;
    setManualTime(keys[next]);
  };

  const cycleWeather = (dir: number) => {
    const keys = Object.keys(WEATHER_CONFIG) as WeatherType[];
    const idx = keys.indexOf(currentWeather);
    const next = (idx + dir + keys.length) % keys.length;
    setManualWeather(keys[next]);
  };

  const ActiveTimeIcon = TIME_CONFIG[currentStatus].icon;
  const ActiveWeatherIcon = WEATHER_CONFIG[currentWeather].icon;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* --- CỤM ĐIỀU KHIỂN GÓC PHẢI --- */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex flex-col gap-3 items-end">
        {/* NHÓM NÚT ZOOM (Pointer-events-auto để click được) */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => handleZoom(0.2)}
            className="w-10 h-10 bg-black/80 border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="w-10 h-10 bg-black/80 border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <Minus size={18} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="w-10 h-10 bg-black/80 border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* MENU ĐIỀU KHIỂN CHÍNH */}
        <motion.div
          layout
          animate={{ width: isCollapsed ? "41px" : "190px" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="pointer-events-auto bg-black/80 border border-white/10 backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col items-center rounded-xl"
        >
          {/* NÚT TOGGLE (Icon trạng thái) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
            flex items-center justify-center transition-all relative group
             border border-white/10 rounded-xl hover:bg-black
            ${
              isCollapsed
                ? "w-10 h-10" // Khi thu nhỏ: Hình vuông 40px trùng khít nút Zoom
                : "w-full h-10 border-b-0 rounded-b-none bg-white/5" // Khi mở: Giãn ngang, khớp vào khung menu bên dưới
            }
          `}
          >
            <div className="flex items-center gap-2">
              <ActiveTimeIcon
                size={18}
                className={`${TIME_CONFIG[currentStatus].color} transition-transform ${!isCollapsed && "scale-110"}`}
              />

              {!isCollapsed && (
                <>
                  <span className="w-[1px] h-3 bg-white/10" />{" "}
                  {/* Vạch ngăn cách nhẹ */}
                  <ActiveWeatherIcon
                    size={18}
                    className={WEATHER_CONFIG[currentWeather].color}
                  />
                  <ChevronDown
                    size={14}
                    className="text-white/20 group-hover:text-white/60 ml-1 transition-colors"
                  />
                </>
              )}
            </div>
          </button>

          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="menu-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="p-4 flex flex-col gap-5 w-full items-center"
              >
                {/* 📱 MOBILE: QUICK SELECT (Không text, cực gọn) */}
                <div className="flex md:hidden flex-col gap-2 w-full">
                  <MiniSelector
                    item={TIME_CONFIG[currentStatus]}
                    onPrev={() => cycleTime(-1)}
                    onNext={() => cycleTime(1)}
                  />
                  <MiniSelector
                    item={WEATHER_CONFIG[currentWeather]}
                    onPrev={() => cycleWeather(-1)}
                    onNext={() => cycleWeather(1)}
                  />
                </div>

                {/* 💻 DESKTOP: GRID SELECT (Lớn, đầy đủ tiêu đề như trước) */}
                <div className="hidden md:flex flex-col gap-5 w-full">
                  <FullGrid
                    title="Cycle"
                    items={TIME_CONFIG}
                    active={currentStatus}
                    onSelect={setManualTime}
                  />
                  <FullGrid
                    title="Weather"
                    items={WEATHER_CONFIG}
                    active={currentWeather}
                    onSelect={setManualWeather}
                  />
                </div>

                {/* NÚT RESET AUTO */}
                <button
                  onClick={() => {
                    setManualTime(null);
                    setManualWeather(null);
                  }}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-[10px]  w-full justify-center transition-all ${
                    isAutoMode
                      ? "border-yellow-500/50 text-yellow-500 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                      : "border-white/10 text-white/30 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {isAutoMode ? (
                    <Zap size={14} className="animate-pulse" />
                  ) : (
                    <ZapOff size={14} />
                  )}
                  <span>{isAutoMode ? "AUTO ACTIVE" : "RESUME"}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* BANNER TRUNG TÂM */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 select-none pointer-events-none">
        <span className="bg-black/90 text-yellow-400 text-[10px] md:text-xs px-5 py-2 rounded-full border border-yellow-400/20 tracking-[0.3em] shadow-2xl ">
          8BIT KINGDOM
        </span>
      </div>
    </div>
  );
}

// --- Component phụ cho Mobile (Tối giản hoàn toàn) ---
function MiniSelector({
  item,
  onPrev,
  onNext,
}: {
  item: ConfigDetail;
  onPrev: () => void;
  onNext: () => void;
}) {
  const Icon = item.icon;
  return (
    <div className="flex items-center justify-between bg-white/5 rounded-xl border border-white/5 p-1">
      <button
        onClick={onPrev}
        className="p-2 text-white/20 hover:text-white transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <Icon size={20} className={item.color} />
      <button
        onClick={onNext}
        className="p-2 text-white/20 hover:text-white transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// --- Component phụ cho Desktop (Menu lớn như trước) ---
function FullGrid<T extends string>({
  title,
  items,
  active,
  onSelect,
}: {
  title: string;
  items: Record<T, ConfigDetail>;
  active: T;
  onSelect: (key: T) => void;
}) {
  return (
    <div className="w-full flex flex-col gap-2.5 text-center">
      <div className="flex items-center gap-2">
        <div className="h-[1px] flex-1 bg-white/5" />
        <span className="text-[8px]  text-white/20 tracking-widest uppercase">
          {title}
        </span>
        <div className="h-[1px] flex-1 bg-white/5" />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {(Object.entries(items) as [T, ConfigDetail][]).map(([key, item]) => {
          const Icon = item.icon;
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex justify-center p-2 rounded-lg transition-all ${
                isActive
                  ? "bg-white/10 text-white ring-1 ring-white/10"
                  : "text-white/10 hover:text-white/40 hover:bg-white/5"
              }`}
            >
              <Icon
                size={16}
                className={isActive ? item.color : "text-current"}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
