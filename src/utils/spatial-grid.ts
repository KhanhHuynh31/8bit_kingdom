import { Building } from "@/stores/types";

export const CELL_SIZE = 200;

export function buildSpatialGrid(buildings: Building[]) {
  const grid = new Map<string, { ids: string[] }>();
  for (const b of buildings) {
    if (!b.interactive) continue;
    const x0 = Math.floor(b.worldX / CELL_SIZE);
    const x1 = Math.floor((b.worldX + b.width) / CELL_SIZE);
    const y0 = Math.floor(b.worldY / CELL_SIZE);
    const y1 = Math.floor((b.worldY + b.height) / CELL_SIZE);

    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const key = `${cx}:${cy}`;
        if (!grid.has(key)) grid.set(key, { ids: [] });
        grid.get(key)!.ids.push(b.id);
      }
    }
  }
  return grid;
}

export function hitTest(
  wx: number,
  wy: number,
  grid: Map<string, { ids: string[] }>,
  buildingMap: Map<string, Building>,
  hiddenIds: Set<string>
): string | null {
  const cx = Math.floor(wx / CELL_SIZE);
  const cy = Math.floor(wy / CELL_SIZE);
  const cell = grid.get(`${cx}:${cy}`);
  if (!cell) return null;

  let best: Building | null = null;
  for (const id of cell.ids) {
    if (hiddenIds.has(id)) continue;
    const b = buildingMap.get(id);
    if (!b) continue;
    if (
      wx >= b.worldX &&
      wx <= b.worldX + b.width &&
      wy >= b.worldY &&
      wy <= b.worldY + b.height
    ) {
      if (!best || (b.zIndex ?? 0) > (best.zIndex ?? 0)) best = b;
    }
  }
  return best?.id ?? null;
}