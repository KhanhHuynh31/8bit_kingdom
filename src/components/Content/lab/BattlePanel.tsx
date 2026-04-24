"use client";
// src/components/Content/BattlePanel.tsx

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useMapStore } from "@/stores/useMapStore";
import {
  Trash2,
  Swords,
  FlaskConical,
  Shovel,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
} from "lucide-react";
import { type SavedPlant } from "@/stores/slices/plantSlice";
import {
  TabBtn,
  ActionBtn,
  type BattleState,
  canvasRoundRect,
  parsePlacedModules,
  drawPlantModulesOnCanvas,
  type PlacedModule,
} from "../shared/labBattleShared";
import { PLANT_MODULES } from "@/constants/plantModules";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_BATTLE_W = 1080;
const CELL_SIZE = 120;
const MIN_ROWS = 1;
const MAX_ROWS = 8;
const DEFAULT_ROWS = 5;
const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.0;
const TARGET_MIN_HEIGHT = 400;

const COLS = Math.floor(BASE_BATTLE_W / CELL_SIZE);
const COL_CENTERS = Array.from(
  { length: COLS },
  (_, i) => i * CELL_SIZE + CELL_SIZE / 2,
);

// ─── Image cache ──────────────────────────────────────────────────────────────

function loadImageIntoCache(
  cache: Record<string, HTMLImageElement>,
  imagePath: string,
): HTMLImageElement | null {
  if (!imagePath) return null;
  if (cache[imagePath]) return cache[imagePath];
  const img = new window.Image();
  img.src = imagePath;
  cache[imagePath] = img;
  return img;
}

// ─── SavedPlantCard ───────────────────────────────────────────────────────────

function SavedPlantCard({
  plant,
  selected,
  onClick,
  imageCache,
  instancesMap,
}: {
  plant: SavedPlant;
  selected: boolean;
  onClick: () => void;
  imageCache: React.RefObject<Record<string, HTMLImageElement>>;
  instancesMap: React.RefObject<Record<string, PlacedModule[]>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idleTRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Preload images
  useEffect(() => {
    const instances = instancesMap.current?.[plant.id] ??
      parsePlacedModules(plant);
    instances.forEach((inst) => {
      const modData = PLANT_MODULES[inst.type].find((m) => m.id === inst.moduleId);
      const path =
        modData?.imagePath ?? plant.partSnapshots?.[inst.type]?.imagePath ?? "";
      if (path && imageCache.current) loadImageIntoCache(imageCache.current, path);
    });
    if (plant.partSnapshots && imageCache.current) {
      (Object.values(plant.partSnapshots) as ({
        imagePath: string;
        tint: string;
      } | null)[]).forEach((snap) => {
        if (snap?.imagePath && imageCache.current) {
          loadImageIntoCache(imageCache.current, snap.imagePath);
        }
      });
    }
  }, [plant, imageCache, instancesMap]);

  useEffect(() => {
    const loop = () => {
      idleTRef.current++;
      const canvas = canvasRef.current;
      const cache = imageCache.current;
      const map = instancesMap.current;
      if (canvas && cache && map) {
        const instances = map[plant.id] ?? parsePlacedModules(plant);
        if (!map[plant.id]) map[plant.id] = instances;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawPlantModulesOnCanvas(
            ctx,
            instances,
            cache,
            canvas.width,
            canvas.height,
            idleTRef.current,
            plant.partSnapshots,
          );
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [plant, imageCache, instancesMap]);

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        textAlign: "center",
        opacity: selected ? 1 : 0.75,
        transform: selected ? "scale(1.08)" : "scale(1)",
        transition: "opacity 0.15s, transform 0.1s",
      }}
    >
      <canvas
        ref={canvasRef}
        width={60}
        height={72}
        style={{
          borderRadius: 8,
          border: `1.5px solid ${
            selected ? "#3b82f6" : "rgba(107,76,30,0.4)"
          }`,
          display: "block",
        }}
      />
      <div
        style={{
          fontSize: 9,
          color: selected ? "#93c5fd" : "#6b7280",
          marginTop: 3,
          maxWidth: 60,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: selected ? 600 : 400,
        }}
      >
        {plant.name}
      </div>
    </div>
  );
}

// ─── Battle renderer ──────────────────────────────────────────────────────────

function renderBattle(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  plants: SavedPlant[],
  imageCache: Record<string, HTMLImageElement>,
  rows: number,
  showSlots: boolean,
  instancesMap: Record<string, PlacedModule[]>,
): void {
  const ROW_H = CELL_SIZE;
  const battleHeight = rows * ROW_H;
  ctx.clearRect(0, 0, BASE_BATTLE_W, battleHeight);

  // Checkerboard grass
  const grassColors = ["#5a9e3a", "#4d8c30"];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = grassColors[(r + c) % 2];
      ctx.fillRect(c * CELL_SIZE, r * ROW_H, CELL_SIZE, ROW_H);
    }
  }

  // Row dividers
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * ROW_H);
    ctx.lineTo(BASE_BATTLE_W, r * ROW_H);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Slot indicators
  if (showSlots && !state.running) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = COL_CENTERS[c];
        const cy = r * ROW_H + ROW_H / 2;
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        canvasRoundRect(ctx, cx - 20, cy - 24, 40, 48, 8);
        ctx.stroke();
      }
    }
  }

  // Draw plants
  state.plants.forEach((pp) => {
    const plant = plants.find((p) => p.id === pp.plantId);
    if (!plant) return;
    const instances = instancesMap[plant.id] ?? parsePlacedModules(plant);
    if (!instancesMap[plant.id]) instancesMap[plant.id] = instances;

    const mini = document.createElement("canvas");
    mini.width = CELL_SIZE;
    mini.height = CELL_SIZE;
    const mc = mini.getContext("2d");
    if (!mc) return;

    drawPlantModulesOnCanvas(
      mc,
      instances,
      imageCache,
      mini.width,
      mini.height,
      pp.t,
      plant.partSnapshots,
    );

    const colX = COL_CENTERS[pp.col];
    const rowY = pp.row * ROW_H + ROW_H / 2;
    ctx.drawImage(mini, colX - mini.width / 2, rowY - mini.height / 2);
  });

  // Bullets
  state.bullets.forEach((b) => {
    const cy = b.row * ROW_H + ROW_H / 2;
    ctx.beginPath();
    ctx.arc(b.x, cy, b.size * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = b.color + "40";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(b.x, cy, b.size, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(b.x - b.size * 3, cy);
    ctx.lineTo(b.x, cy);
    ctx.strokeStyle = b.color + "80";
    ctx.lineWidth = b.size * 0.8;
    ctx.lineCap = "round";
    ctx.stroke();
  });

  // Zombies
  state.zombies.forEach((z) => {
    const cy = z.row * ROW_H + 4;
    const wobble = Math.sin(z.t * 0.18) * 3;
    ctx.save();
    ctx.translate(z.x, cy + ROW_H * 0.4);
    ctx.rotate((wobble * Math.PI) / 180);
    ctx.translate(-z.x, -(cy + ROW_H * 0.4));
    ctx.font = `${Math.round(ROW_H * 0.6)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (z.frozen > 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillText("🧊", z.x, cy + ROW_H * 0.4);
      ctx.globalAlpha = 1;
    }
    if (z.poison > 0) {
      ctx.globalAlpha = 0.5;
      ctx.font = "14px serif";
      ctx.fillText("🟢", z.x + 12, cy + 4);
      ctx.globalAlpha = 1;
      ctx.font = `${Math.round(ROW_H * 0.6)}px serif`;
    }
    ctx.fillText("🧟", z.x, cy + ROW_H * 0.4);
    ctx.restore();

    // HP bar
    const barW = 36;
    const barX = z.x - barW / 2;
    const barY = cy + ROW_H * 0.78;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(barX, barY, barW, 3);
    const pct = Math.max(0, z.hp / z.maxHp);
    ctx.fillStyle =
      pct > 0.5 ? "#22c55e" : pct > 0.25 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(barX, barY, barW * pct, 3);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BattlePanel({ onSwitchLab }: { onSwitchLab: () => void }) {
  const savedPlants = useMapStore((s) => s.savedPlants);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const plantInstancesCacheRef = useRef<Record<string, PlacedModule[]>>({});

  const [rows, setRows] = useState<number>(DEFAULT_ROWS);
  const [zombieMultiplier, setZombieMultiplier] = useState<number>(1.0);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);

  const battleRef = useRef<BattleState>({
    plants: [],
    zombies: [],
    bullets: [],
    frame: 0,
    running: false,
    zombieId: 0,
    bulletId: 0,
    nextSpawn: 120,
    wave: 0,
    defeated: 0,
    survived: 0,
  });

  const savedPlantsRef = useRef<SavedPlant[]>(savedPlants);
  useEffect(() => {
    savedPlantsRef.current = savedPlants;
    // Reset plant instances cache when savedPlants change
    plantInstancesCacheRef.current = {};
  }, [savedPlants]);

  // Preload images
  useEffect(() => {
    savedPlants.forEach((plant) => {
      const instances = plantInstancesCacheRef.current[plant.id] ??
        parsePlacedModules(plant);
      if (!plantInstancesCacheRef.current[plant.id]) {
        plantInstancesCacheRef.current[plant.id] = instances;
      }
      instances.forEach((inst) => {
        const modData = PLANT_MODULES[inst.type].find((m) => m.id === inst.moduleId);
        const path =
          modData?.imagePath ?? plant.partSnapshots?.[inst.type]?.imagePath ?? "";
        if (path) loadImageIntoCache(imageCacheRef.current, path);
      });
      if (plant.partSnapshots) {
        (Object.values(plant.partSnapshots) as ({
          imagePath: string;
          tint: string;
        } | null)[]).forEach((snap) => {
          if (snap?.imagePath)
            loadImageIntoCache(imageCacheRef.current, snap.imagePath);
        });
      }
    });
  }, [savedPlants]);

  const [selectedPlantIdx, setSelectedPlantIdx] = useState<number | null>(null);
  const [shovelMode, setShovelMode] = useState<boolean>(false);
  const [waveActive, setWaveActive] = useState(false);
  const [info, setInfo] = useState("Chọn cây → Click ô để đặt");
  const [score, setScore] = useState({ defeated: 0, survived: 0 });

  const selectedPlantIdxRef = useRef(selectedPlantIdx);
  useEffect(() => {
    selectedPlantIdxRef.current = selectedPlantIdx;
  }, [selectedPlantIdx]);

  const ROW_H = CELL_SIZE;
  const battleHeight = rows * ROW_H;

  const autoScale = useMemo(
    () => Math.max(1.0, TARGET_MIN_HEIGHT / battleHeight),
    [battleHeight],
  );
  const finalScale = zoom * autoScale;
  const scaledWidth = BASE_BATTLE_W * finalScale;
  const scaledHeight = battleHeight * finalScale;

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const s = battleRef.current;
      const rect = canvasRef.current!.getBoundingClientRect();
      const bx = (e.clientX - rect.left) * (BASE_BATTLE_W / rect.width);
      const by = (e.clientY - rect.top) * (battleHeight / rect.height);
      const col = Math.floor(bx / CELL_SIZE);
      const row = Math.floor(by / ROW_H);
      if (row < 0 || row >= rows || col < 0 || col >= COLS) return;

      if (shovelMode) {
        const idx = s.plants.findIndex((p) => p.row === row && p.col === col);
        if (idx !== -1) {
          s.plants.splice(idx, 1);
          setInfo(`Đã nhổ cây ở hàng ${row + 1}, cột ${col + 1}`);
        } else {
          setInfo("Không có cây để nhổ ở đây");
        }
        return;
      }

      if (s.running) {
        setInfo("Không thể đặt khi đang chiến!");
        return;
      }

      const idx = selectedPlantIdxRef.current;
      if (idx === null) {
        setInfo("Chọn cây trước!");
        return;
      }
      const plant = savedPlantsRef.current[idx];
      if (!plant) return;
      if (s.plants.find((p) => p.row === row && p.col === col)) {
        setInfo("Ô này đã có cây!");
        return;
      }

      s.plants.push({
        uid: Date.now(),
        plantId: plant.id,
        row,
        col,
        t: 0,
        lastShot: 0,
      });
      setInfo(`Đặt ${plant.name} tại hàng ${row + 1}, cột ${col + 1}`);
    },
    [battleHeight, ROW_H, rows, shovelMode],
  );

  const stopWave = useCallback(() => {
    battleRef.current.running = false;
    battleRef.current.zombies = [];
    battleRef.current.bullets = [];
    cancelAnimationFrame(rafRef.current);
    setWaveActive(false);
    setInfo("Đã dừng.");
  }, []);

  const startWave = useCallback(() => {
    if (battleRef.current.plants.length === 0) {
      setInfo("Đặt ít nhất 1 cây!");
      return;
    }
    const s = battleRef.current;
    Object.assign(s, {
      running: true,
      zombies: [],
      bullets: [],
      frame: 0,
      nextSpawn: 80,
      wave: 0,
      defeated: 0,
      survived: 0,
      zombieId: 0,
      bulletId: 0,
    });
    setWaveActive(true);
    setScore({ defeated: 0, survived: 0 });
    setInfo("Sóng zombie đang tấn công! 🧟");
  }, []);

  const clearAll = useCallback(() => {
    stopWave();
    battleRef.current.plants = [];
    setInfo("Đã xóa bàn.");
  }, [stopWave]);

  const handleRowsChange = (newRows: number) => {
    if (waveActive) stopWave();
    battleRef.current.plants = [];
    setRows(newRows);
    setInfo(`Đã đặt số hàng = ${newRows}`);
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleZoomChange = (v: number) =>
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v)));

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = battleRef.current;
      const plants = savedPlantsRef.current;
      s.frame++;
      s.plants.forEach((pp) => {
        pp.t++;
      });

      if (s.running) {
        const maxZombies = Math.floor((15 + s.wave * 5) * zombieMultiplier);

        if (s.frame >= s.nextSpawn && s.zombieId < maxZombies) {
          const row = Math.floor(Math.random() * rows);
          const hp = 80 + s.wave * 20;
          s.zombies.push({
            id: s.zombieId++,
            row,
            x: BASE_BATTLE_W + 30,
            hp,
            maxHp: hp,
            speed: 0.35 + Math.random() * 0.25 + s.wave * 0.04,
            t: 0,
            frozen: 0,
            poison: 0,
          });
          s.nextSpawn = s.frame + 80 + Math.floor(Math.random() * 60);
        }

        s.plants.forEach((pp) => {
          const plant = plants.find((p) => p.id === pp.plantId);
          if (!plant) return;
          const fireRate = Math.max(40, 110 - plant.agi * 3.5);
          const colX = COL_CENTERS[pp.col];
          if (
            s.zombies.some((z) => z.row === pp.row && z.x > colX) &&
            pp.t - pp.lastShot > fireRate
          ) {
            pp.lastShot = pp.t;
            const bt = plant.bulletType;
            s.bullets.push({
              id: s.bulletId++,
              row: pp.row,
              x: colX + 20,
              color: bt.color,
              size: bt.size,
              dmg: bt.dmg,
              speed: bt.speed,
              effectName: plant.effect?.name,
            });
          }
        });

        s.bullets = s.bullets.filter((b) => {
          b.x += b.speed;
          if (b.x > BASE_BATTLE_W + 20) return false;
          const isPiercing = b.effectName === "Xuyên giáp";
          let consumed = false;
          for (let i = s.zombies.length - 1; i >= 0; i--) {
            const z = s.zombies[i];
            if (z.row !== b.row || Math.abs(z.x - b.x) >= 20) continue;
            z.hp -= b.dmg * (0.8 + Math.random() * 0.4);
            if (b.effectName === "Đóng băng") z.frozen = 120;
            if (b.effectName === "Độc") z.poison = 180;
            if (b.effectName === "Đẩy lùi")
              z.x = Math.min(BASE_BATTLE_W + 30, z.x + 40);
            if (z.hp <= 0) {
              s.zombies.splice(i, 1);
              s.defeated++;
              setScore((p) => ({ ...p, defeated: s.defeated }));
            }
            consumed = true;
            if (!isPiercing) break;
          }
          return isPiercing || !consumed;
        });

        s.zombies = s.zombies.filter((z) => {
          z.t++;
          if (z.frozen > 0) z.frozen--;
          if (z.poison > 0) {
            z.poison--;
            if (z.t % 20 === 0) z.hp -= 5;
          }
          z.x -= z.frozen > 0 ? z.speed * 0.2 : z.speed;
          if (z.hp <= 0) {
            s.defeated++;
            setScore((p) => ({ ...p, defeated: s.defeated }));
            return false;
          }
          if (z.x < -20) {
            s.survived++;
            setScore((p) => ({ ...p, survived: s.survived }));
            setInfo(`💀 Zombie vượt qua! (${s.survived})`);
            return false;
          }
          return true;
        });

        if (s.zombieId >= maxZombies && s.zombies.length === 0) {
          s.wave++;
          s.zombieId = 0;
          s.nextSpawn = s.frame + 200;
          setInfo(`🎉 Sóng ${s.wave} hoàn thành!`);
        }
      }

      renderBattle(
        ctx,
        s,
        plants,
        imageCacheRef.current,
        rows,
        selectedPlantIdx !== null && !shovelMode,
        plantInstancesCacheRef.current,
      );
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rows, zombieMultiplier, shovelMode, selectedPlantIdx]);

  return (
    <div
      style={{
        color: "#c8a870",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          borderBottom: "1px solid rgba(107,76,30,0.4)",
          paddingBottom: 10,
        }}
      >
        <TabBtn onClick={onSwitchLab}>
          <FlaskConical size={14} /> Lai Tạo
        </TabBtn>
        <TabBtn active>
          <Swords size={14} /> Thực Chiến
        </TabBtn>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 2, minWidth: 220 }}>
          <div
            style={{
              fontSize: 10,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            Cây đã tạo
          </div>
          {savedPlants.length === 0 ? (
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Chưa có cây. Tạo ở tab Lai Tạo.
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {savedPlants.map((p, i) => (
                <SavedPlantCard
                  key={p.id}
                  plant={p}
                  selected={selectedPlantIdx === i}
                  onClick={() => {
                    setSelectedPlantIdx(i);
                    setShovelMode(false);
                  }}
                  imageCache={imageCacheRef}
                  instancesMap={plantInstancesCacheRef}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ fontSize: 11, color: "#9ca3af" }}>Hàng:</span>
              <input
                type="range"
                min={MIN_ROWS}
                max={MAX_ROWS}
                value={rows}
                onChange={(e) => handleRowsChange(Number(e.target.value))}
                disabled={waveActive}
                style={{ width: 80 }}
              />
              <span style={{ fontSize: 12, minWidth: 20 }}>{rows}</span>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                Zombie:
              </span>
              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.1}
                value={zombieMultiplier}
                onChange={(e) =>
                  setZombieMultiplier(Number(e.target.value))
                }
                disabled={waveActive}
                style={{ width: 80 }}
              />
              <span style={{ fontSize: 12, minWidth: 30 }}>
                {zombieMultiplier.toFixed(1)}x
              </span>
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <ActionBtn
                onClick={waveActive ? stopWave : startWave}
                color={waveActive ? "red" : "green"}
              >
                <Swords size={13} /> {waveActive ? "Dừng" : "Bắt đầu"}
              </ActionBtn>
              <ActionBtn onClick={clearAll} color="gray">
                <Trash2 size={13} /> Xóa
              </ActionBtn>
              <ActionBtn
                onClick={() => setShovelMode((p) => !p)}
                color={shovelMode ? "amber" : "gray"}
              >
                <Shovel size={13} /> Cuốc
              </ActionBtn>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            <span>{info}</span>
            <span>
              <span style={{ color: "#4ade80" }}>
                ☠ {score.defeated}
              </span>{" "}
              <span style={{ color: "#f87171" }}>
                💀 {score.survived}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Battle area */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          borderRadius: 12,
          border: "1px solid rgba(80,140,60,0.35)",
          background: "#0f1a0a",
          overflow: "hidden",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Zoom toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            background: "rgba(0,0,0,0.3)",
            borderBottom: "1px solid rgba(80,140,60,0.2)",
          }}
        >
          <button
            onClick={() => handleZoomChange(zoom - 0.1)}
            style={iconButtonStyle}
            title="Thu nhỏ"
          >
            <ZoomOut size={14} />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <button
            onClick={() => handleZoomChange(zoom + 0.1)}
            style={iconButtonStyle}
            title="Phóng to"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(DEFAULT_ZOOM)}
            style={iconButtonStyle}
            title="Reset zoom"
          >
            <RotateCcw size={14} />
          </button>
          <span
            style={{
              fontSize: 12,
              color: "#c8a870",
              marginLeft: 4,
            }}
          >
            {Math.round(finalScale * 100)}%
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={toggleFullscreen}
            style={iconButtonStyle}
            title="Toàn màn hình"
          >
            <Maximize size={14} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#0a1207",
          }}
        >
          <div
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              position: "relative",
              margin: "auto",
            }}
          >
            <canvas
              ref={canvasRef}
              width={BASE_BATTLE_W}
              height={battleHeight}
              onClick={handleCanvasClick}
              style={{
                display: "block",
                cursor: shovelMode ? "grab" : "crosshair",
                transform: `scale(${finalScale})`,
                transformOrigin: "0 0",
                width: `${BASE_BATTLE_W}px`,
                height: `${battleHeight}px`,
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 10,
          color: "#4b5563",
          marginTop: 6,
          textAlign: "center",
        }}
      >
        {shovelMode
          ? "Click vào cây để nhổ · Chọn cây để thoát chế độ cuốc"
          : "Click ô để đặt cây · Dùng cuốc để xóa"}
      </div>
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  borderRadius: 4,
  color: "#c8a870",
  cursor: "pointer",
  padding: "4px 6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.2s",
};