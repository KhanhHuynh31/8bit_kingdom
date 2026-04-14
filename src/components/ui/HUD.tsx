"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimeStatus, WeatherType } from "@/hooks/useTimeCycle";
import { useMapStore } from "@/stores/useMapStore";
import { MIN_ZOOM, MAX_ZOOM } from "@/constants/map";
import {
  Sun, Moon, Sunrise, Sunset, CloudRain, CloudSnow, SunMedium,
  Zap, ZapOff, CloudLightning, LucideIcon, Plus, Minus, RotateCcw,
  ChevronDown, EyeOff, Wind
} from "lucide-react";

// --- Interfaces & Types ---
interface ConfigDetail {
  icon: LucideIcon;
  color: string;
}

interface HUDProps {
  currentStatus: TimeStatus;
  currentWeather: WeatherType;
  manualTime: TimeStatus | null;
  manualWeather: WeatherType | null;
  setManualTime: (val: TimeStatus | null) => void;
  setManualWeather: (val: WeatherType | null) => void;
}

interface FullGridProps<T extends string> {
  title: string;
  items: Record<T, ConfigDetail>;
  active: T;
  onSelect: (key: T) => void;
}

interface ZoomBtnProps {
  onClick: () => void;
  icon: LucideIcon;
  size?: number;
  color?: string;
}

// --- Configs ---
const TIME_CONFIG: Record<TimeStatus, ConfigDetail> = {
  morning: { icon: Sunrise, color: "text-orange-400" },
  afternoon: { icon: Sun, color: "text-yellow-400" },
  evening: { icon: Sunset, color: "text-indigo-400" },
  night: { icon: Moon, color: "text-blue-400" },
};

const WEATHER_CONFIG: Record<WeatherType, ConfigDetail> = {
  sunny: { icon: SunMedium, color: "text-yellow-200" },
  rain: { icon: CloudRain, color: "text-blue-400" },
  storm: { icon: CloudLightning, color: "text-purple-400" },
  snow: { icon: CloudSnow, color: "text-slate-100" },
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
  const [showBanner, setShowBanner] = useState(true);
  const [showZoom, setShowZoom] = useState(true);
  const [showWeather, setShowWeather] = useState(true);

  const { camera, setZoom } = useMapStore();
  const isAutoMode = !manualTime && !manualWeather;

  const handleZoom = (delta: number) => {
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat((camera.zoom + delta).toFixed(1))));
    setZoom(newZoom);
  };

  const ActiveTimeIcon = TIME_CONFIG[currentStatus].icon;
  const ActiveWeatherIcon = WEATHER_CONFIG[currentWeather].icon;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none">
      
      {/* 1. BANNER TRUNG TÂM */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center">
        <AnimatePresence mode="wait">
          {showBanner ? (
            <motion.button
              key="banner"
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              onClick={() => setShowBanner(false)}
              className="bg-black/80 backdrop-blur-md text-yellow-400 text-[10px] px-6 py-2 rounded-full border border-yellow-400/20 tracking-[0.4em] shadow-2xl transition-all active:scale-95"
            >
              KINGDOM 8BIT
            </motion.button>
          ) : (
            <motion.button
              key="banner-hint"
              initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
              onClick={() => setShowBanner(true)}
              className="text-[8px] text-white/10 hover:text-yellow-400/50 tracking-[0.3em] uppercase transition-all"
            >
              [ Show Title ]
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 2. CỤM ĐIỀU KHIỂN BÊN PHẢI */}
      <div className="absolute top-16 right-2  flex flex-col gap-4 items-end pointer-events-auto">
        
        {/* ZOOM */}
        <div className="min-h-[40px] flex items-center justify-end">
          <AnimatePresence mode="wait">
            {showZoom ? (
              <motion.div
                key="zoom-box"
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                className="flex flex-col gap-1 p-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl"
              >
                <ZoomBtn onClick={() => handleZoom(0.2)} icon={Plus} />
                <ZoomBtn onClick={() => handleZoom(-0.2)} icon={Minus} />
                <ZoomBtn onClick={() => setZoom(1)} icon={RotateCcw} size={14} />
                <div className="h-[1px] w-4 bg-white/10 self-center my-1" />
                <ZoomBtn onClick={() => setShowZoom(false)} icon={EyeOff} size={14} color="text-red-400/40" />
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                onClick={() => setShowZoom(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/10 hover:text-white/40 transition-all"
              >
                <Plus size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* WEATHER */}
        <div className="flex flex-col items-end gap-2">
          <AnimatePresence mode="wait">
            {showWeather ? (
              <motion.div
                key="weather-box"
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                className="flex flex-col items-end gap-2"
              >
                <motion.div
                  layout
                  animate={{ width: isCollapsed ? "52px" : "210px" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[22px] shadow-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center justify-center w-full h-12 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ActiveTimeIcon size={20} className={TIME_CONFIG[currentStatus].color} />
                      {!isCollapsed && (
                        <>
                          <div className="w-[1px] h-4 bg-white/10" />
                          <ActiveWeatherIcon size={20} className={WEATHER_CONFIG[currentWeather].color} />
                          <ChevronDown size={14} className="text-white/20" />
                        </>
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="p-5 flex flex-col gap-6"
                      >
                        <FullGrid title="Cycle" items={TIME_CONFIG} active={currentStatus} onSelect={setManualTime} />
                        <FullGrid title="Weather" items={WEATHER_CONFIG} active={currentWeather} onSelect={setManualWeather} />
                        
                        <button
                          onClick={() => { setManualTime(null); setManualWeather(null); }}
                          className={`flex items-center gap-3 py-3 rounded-xl border text-[10px] w-full justify-center transition-all font-bold tracking-widest
                            ${isAutoMode ? "border-yellow-500/50 text-yellow-500 bg-yellow-500/10" : "border-white/10 text-white/20 hover:text-white"}`}
                        >
                          {isAutoMode ? <Zap size={14} className="animate-pulse" /> : <ZapOff size={14} />}
                          {isAutoMode ? "AUTO" : "RESUME"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                <button onClick={() => setShowWeather(false)} className="mr-2 text-white/5 hover:text-white/20 transition-colors">
                  <EyeOff size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                onClick={() => setShowWeather(true)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white/10 hover:text-white/40 transition-all"
              >
                <Wind size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components với Type an toàn ---
function ZoomBtn({ onClick, icon: Icon, size = 18, color = "text-white/40" }: ZoomBtnProps) {
  return (
    <button onClick={onClick} className={`w-9 h-9 flex items-center justify-center ${color} hover:text-white hover:bg-white/5 rounded-xl transition-all`}>
      <Icon size={size} />
    </button>
  );
}

function FullGrid<T extends string>({ title, items, active, onSelect }: FullGridProps<T>) {
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center gap-2 opacity-20">
        <span className="text-[7px] text-white font-bold uppercase tracking-widest">{title}</span>
        <div className="h-[1px] flex-1 bg-white" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(items) as T[]).map((key) => {
          const item = items[key];
          const Icon = item.icon;
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex justify-center p-2.5 rounded-xl transition-all ${isActive ? "bg-white/10" : "opacity-30 hover:opacity-100 hover:bg-white/5"}`}
            >
              <Icon size={18} className={isActive ? item.color : "text-white"} />
            </button>
          );
        })}
      </div>
    </div>
  );
}