import { useCallback } from 'react'
import { BUILDINGS } from '@/constants/map'
import { useMapStore } from '@/stores/useMapStore'
import { screenToWorld } from '@/utils/coords'
import type { Camera } from '@/stores/types'

export function useBuildings() {
  const { selectBuilding } = useMapStore()

  const handleClick = useCallback(
    (
      clientX: number,
      clientY: number,
      camera: Camera,
      rect: DOMRect
    ) => {
      const screenCenterX = rect.width / 2
      const screenCenterY = rect.height / 2
      const relX = clientX - rect.left
      const relY = clientY - rect.top

      const world = screenToWorld(relX, relY, camera, screenCenterX, screenCenterY)

      for (const building of BUILDINGS) {
        if (
          world.x >= building.worldX &&
          world.x <= building.worldX + building.width &&
          world.y >= building.worldY &&
          world.y <= building.worldY + building.height
        ) {
          if (building.interactive) {
            selectBuilding(building)
            return
          }
        }
      }
      selectBuilding(null)
    },
    [selectBuilding]
  )

  return { buildings: BUILDINGS, handleClick }
}