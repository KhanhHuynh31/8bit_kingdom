'use client'
import { useState, useEffect, useCallback } from 'react';

// --- Types ---
export type TimeStatus = 'morning' | 'afternoon' | 'evening' | 'night';
export type WeatherType = 'sunny' | 'rain' | 'storm' | 'snow';

// --- Logic Hệ Thống Thời Tiết Thực Tế ---
// Định nghĩa tỉ lệ xuất hiện dựa trên buổi trong ngày
const WEATHER_PROBABILITIES: Record<TimeStatus, Record<WeatherType, number>> = {
  morning:   { sunny: 0.70, rain: 0.20, storm: 0.05, snow: 0.05 },
  afternoon: { sunny: 0.80, rain: 0.10, storm: 0.08, snow: 0.02 },
  evening:   { sunny: 0.60, rain: 0.25, storm: 0.10, snow: 0.05 },
  night:     { sunny: 0.40, rain: 0.30, storm: 0.10, snow: 0.20 },
};

/**
 * Hook kết hợp quản lý Thời gian và Thời tiết
 */
export const useTimeCycle = () => {
  const [status, setStatus] = useState<TimeStatus>('afternoon');

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setStatus('morning');
      else if (hour >= 11 && hour < 17) setStatus('afternoon');
      else if (hour >= 17 && hour < 20) setStatus('evening');
      else setStatus('night');
    };

    updateTime();
    const timer = setInterval(updateTime, 60000); // Check mỗi phút
    return () => clearInterval(timer);
  }, []);

  return status;
};

export function useWeatherCycle() {
  const timeStatus = useTimeCycle();
  const [weather, setWeather] = useState<WeatherType>('sunny');

  const getNextWeather = useCallback((currentWeather: WeatherType, time: TimeStatus): WeatherType => {
    const rand = Math.random();
    
    // 1. Logic Duy Trì (Persistence): 80% giữ nguyên thời tiết cũ để tránh bị đổi liên tục
    // Điều này tạo cảm giác mưa kéo dài hoặc nắng cả ngày.
    if (rand < 0.85) return currentWeather;

    // 2. Logic Chuyển đổi (Transition): 15% còn lại sẽ tính toán dựa trên buổi
    const probs = WEATHER_PROBABILITIES[time];
    const roll = Math.random();
    
    let cumulative = 0;
    for (const [type, chance] of Object.entries(probs)) {
      cumulative += chance;
      if (roll < cumulative) return type as WeatherType;
    }
    
    return 'sunny';
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      setWeather((prev) => getNextWeather(prev, timeStatus));
      
      // Thời gian giãn cách giữa các lần "check" sự thay đổi
      // Tăng lên 1-2 phút để tạo cảm giác thời tiết ổn định hơn
      const nextTickTime = 60000 + Math.random() * 60000; 
      timeoutId = setTimeout(tick, nextTickTime);
    };

    timeoutId = setTimeout(tick, 5000); // Lần chạy đầu tiên sau 5s
    return () => clearTimeout(timeoutId);
  }, [timeStatus, getNextWeather]);

  return weather;
}