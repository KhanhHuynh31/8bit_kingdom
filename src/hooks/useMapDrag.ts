import { useCallback, useRef, useEffect } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { storage } from '@/utils/storage'
import type { Camera } from '@/types'

const STORAGE_KEY = '8bitkingdom_camera'

export function useMapDrag(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { camera, updateOffset, setCamera } = useMapStore()
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Khôi phục camera từ localStorage khi mount
  useEffect(() => {
    const saved = storage.get<Camera>(STORAGE_KEY, camera)
    setCamera(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lưu camera sau 500ms không kéo (debounce)
  const saveCamera = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      storage.set(STORAGE_KEY, useMapStore.getState().camera)
    }, 500)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    canvasRef.current?.setPointerCapture(e.pointerId)
  }, [canvasRef])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    updateOffset(dx, dy)
    saveCamera()
  }, [updateOffset, saveCamera])

  const onPointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}