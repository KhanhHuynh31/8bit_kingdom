'use client'

import { useMapStore } from '@/stores/useMapStore'

export default function CoordDisplay() {
  const { camera } = useMapStore()
  const x = Math.round(-camera.offsetX / (48 * camera.zoom))
  const y = Math.round(-camera.offsetY / (48 * camera.zoom))

  return (
    <div className="absolute bottom-3 left-3 bg-black/60 text-green-400 text-xs  px-2 py-1 rounded pointer-events-none select-none">
      X: {x} Y: {y} | Zoom: {camera.zoom.toFixed(1)}x
    </div>
  )
}