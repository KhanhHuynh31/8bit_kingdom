'use client'
import { useReducer, memo } from 'react'
import WorldMap from '@/components/map/WorldMap'
import { useTimeCycle, TimeStatus, useWeatherCycle, WeatherType } from '@/hooks/useTimeCycle'

// ─── Gộp manualTime + manualWeather vào 1 state ──────────────────────────────
// Tránh 2 lần re-render khi set cả 2 cùng lúc
interface ManualOverride {
  time: TimeStatus | null
  weather: WeatherType | null
}

type OverrideAction =
  | { type: 'SET_TIME';    value: TimeStatus | null }
  | { type: 'SET_WEATHER'; value: WeatherType | null }

function overrideReducer(state: ManualOverride, action: OverrideAction): ManualOverride {
  switch (action.type) {
    case 'SET_TIME':    return state.time    === action.value ? state : { ...state, time:    action.value }
    case 'SET_WEATHER': return state.weather === action.value ? state : { ...state, weather: action.value }
  }
}

const INITIAL_OVERRIDE: ManualOverride = { time: null, weather: null }

// ─── WorldMap được memo hóa để chỉ re-render khi props thực sự thay đổi ──────
const MemoWorldMap = memo(WorldMap)

export default function HomePage() {
  const autoTime    = useTimeCycle()
  const autoWeather = useWeatherCycle()

  const [override, dispatch] = useReducer(overrideReducer, INITIAL_OVERRIDE)

  // Tính trực tiếp — không cần useMemo vì đây là phép || đơn giản
  const currentStatus  = override.time    ?? autoTime
  const currentWeather = override.weather ?? autoWeather

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#05070a] select-none">
      <MemoWorldMap
        status={currentStatus}
        weather={currentWeather}
        manualTime={override.time}
        manualWeather={override.weather}
        setManualTime={(value) => dispatch({ type: 'SET_TIME',    value })}
        setManualWeather={(value) => dispatch({ type: 'SET_WEATHER', value })}
      />
    </main>
  )
}