import { TILE_SIZE } from '@/constants/map'
import type { Camera } from '@/types'

/** Chuyển tọa độ thế giới (tile) sang pixel màn hình */
export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: Camera,
  screenCenterX: number,
  screenCenterY: number
): { x: number; y: number } {
  const scaledTile = TILE_SIZE * camera.zoom
  return {
    x: screenCenterX + (worldX * scaledTile) + camera.offsetX,
    y: screenCenterY + (worldY * scaledTile) + camera.offsetY,
  }
}

/** Chuyển tọa độ pixel màn hình sang tọa độ thế giới (tile) */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera,
  screenCenterX: number,
  screenCenterY: number
): { x: number; y: number } {
  const scaledTile = TILE_SIZE * camera.zoom
  return {
    x: (screenX - screenCenterX - camera.offsetX) / scaledTile,
    y: (screenY - screenCenterY - camera.offsetY) / scaledTile,
  }
}