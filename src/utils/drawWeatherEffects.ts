// ─── Kiểu dữ liệu ────────────────────────────────────────────────────────────
interface RainParticle {
  x: number; y: number;
  v: number; vx: number;
  l: number;
  alpha: number; width: number;
  streak: boolean;
}

interface SnowParticle {
  x: number; y: number;
  v: number; vx: number;
  r: number;
  alpha: number;
  phase: number; wobble: number;
}

// ─── State ────────────────────────────────────────────────────────────────────
let rainParticles: RainParticle[] = [];
let snowParticles: SnowParticle[] = [];
let currentWeatherType = '';

// Lightning
let lightningTimer  = 0;
let lightningActive = false;
let lightningBranches: Float32Array = new Float32Array(0); // [x1,y1,x2,y2, ...]
let lightningCount  = 0;

// ─── Sin lookup table: tránh Math.sin trong hot path ─────────────────────────
const SIN_TABLE_SIZE = 2048;
const SIN_TABLE      = new Float32Array(SIN_TABLE_SIZE);
const SIN_SCALE      = SIN_TABLE_SIZE / (Math.PI * 2);
for (let i = 0; i < SIN_TABLE_SIZE; i++) {
  SIN_TABLE[i] = Math.sin((i / SIN_TABLE_SIZE) * Math.PI * 2);
}
function fastSin(x: number): number {
  // Normalize x vào [0, 2π) rồi lookup
  const idx = ((x * SIN_SCALE) % SIN_TABLE_SIZE + SIN_TABLE_SIZE) & (SIN_TABLE_SIZE - 1);
  return SIN_TABLE[idx];
}

// ─── Lightning helper ─────────────────────────────────────────────────────────
// Dùng stack thay đệ quy để tránh tạo nhiều array nhỏ
function generateLightningBranch(
  x1: number, y1: number, x2: number, y2: number, depth: number,
  out: number[], // flat array [x1,y1,x2,y2, ...]
): void {
  if (depth === 0) {
    out.push(x1, y1, x2, y2);
    return;
  }
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 60;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 20;
  generateLightningBranch(x1, y1, mx, my, depth - 1, out);
  generateLightningBranch(mx, my, x2, y2, depth - 1, out);
  if (Math.random() < 0.4 && depth > 1) {
    const bx = mx + (Math.random() - 0.5) * 80;
    const by = my + Math.random() * 60;
    generateLightningBranch(mx, my, bx, by, depth - 1, out);
  }
}

// ─── Init particles ───────────────────────────────────────────────────────────
function initRain(w: number, h: number, isStorm: boolean): RainParticle[] {
  const count = isStorm ? 350 : 200;
  const arr: RainParticle[] = new Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = {
      x:      Math.random() * w,
      y:      Math.random() * h,
      v:      isStorm ? 18 + Math.random() * 14 : 14 + Math.random() * 10,
      l:      isStorm ? 28 + Math.random() * 20 : 20 + Math.random() * 15,
      vx:     isStorm ? -3 + Math.random() * -1 : -1.5 + Math.random() * 0.5,
      alpha:  isStorm ? 0.3 + Math.random() * 0.4 : 0.25 + Math.random() * 0.3,
      width:  isStorm ? 0.7 + Math.random() * 1.2 : 0.5 + Math.random() * 0.8,
      streak: isStorm ? true : Math.random() > 0.7,
    };
  }
  return arr;
}

function initSnow(w: number, h: number): SnowParticle[] {
  const count = 180;
  const arr: SnowParticle[] = new Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = {
      x:      Math.random() * w,
      y:      Math.random() * h,
      v:      0.6 + Math.random() * 1.4,
      r:      1.5 + Math.random() * 3.5,
      vx:     (Math.random() - 0.5) * 0.5,
      alpha:  0.5 + Math.random() * 0.5,
      phase:  Math.random() * Math.PI * 2,
      wobble: 0.3 + Math.random() * 0.8,
    };
  }
  return arr;
}

// ─── Rain renderer: batch save/restore, không gọi mỗi particle ───────────────
function renderRain(
  ctx: CanvasRenderingContext2D, w: number, h: number, isStorm: boolean,
) {
  const baseColor = isStorm ? '174, 210, 255' : '174, 194, 224';
  const ps = rainParticles;
  const len = ps.length;

  ctx.save();
  ctx.lineCap = 'round';

  for (let i = 0; i < len; i++) {
    const p  = ps[i];
    const dx = p.vx * (p.l / p.v) * 4;

    // Chỉ set alpha + strokeStyle khi thực sự khác — tránh state change thừa
    ctx.globalAlpha  = p.alpha;
    ctx.strokeStyle  = `rgba(${baseColor}, ${p.alpha})`;
    ctx.lineWidth    = p.width;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + dx, p.y + p.l);
    ctx.stroke();

    // Streak: chỉ vẽ với particle được đánh dấu sẵn, không random mỗi frame
    if (p.streak) {
      ctx.globalAlpha = p.alpha * 0.25;
      ctx.lineWidth   = p.width * 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 1, p.y);
      ctx.lineTo(p.x + dx - 1, p.y + p.l * 0.6);
      ctx.stroke();
    }

    // Update position
    p.y += p.v;
    p.x += p.vx;
    if (p.y > h + p.l) { p.y = -p.l;          p.x = Math.random() * w; }
    if (p.x < -20)     { p.x = w + 20; }
  }

  ctx.restore();
}

// ─── Lightning renderer: dùng flat Float32Array, for loop thay forEach ────────
function renderLightning(ctx: CanvasRenderingContext2D, w: number, h: number) {
  lightningTimer--;

  if (lightningTimer <= 0) {
    if (!lightningActive) {
      if (Math.random() < 0.015) {
        lightningActive = true;
        lightningTimer  = 4 + Math.floor(Math.random() * 4);
        const sx  = w * 0.1 + Math.random() * w * 0.8;
        const out: number[] = [];
        generateLightningBranch(
          sx, 0,
          sx + (Math.random() - 0.5) * 80,
          h * 0.55 + Math.random() * h * 0.3,
          5, out,
        );
        lightningCount   = out.length / 4;
        // Lưu vào Float32Array: tránh GC từ array object lớn
        lightningBranches = new Float32Array(out);
      }
    } else {
      lightningActive = false;
      lightningTimer  = 80 + Math.floor(Math.random() * 180);
    }
  }

  if (!lightningActive) return;

  ctx.save();
  const branches = lightningBranches;

  for (let i = 0; i < lightningCount; i++) {
    const base  = i * 4;
    const x1 = branches[base];
    const y1 = branches[base + 1];
    const x2 = branches[base + 2];
    const y2 = branches[base + 3];

    const depth = Math.floor(i / 4);
    const alpha = Math.max(0.1, 0.9 - depth * 0.15);
    const lw    = Math.max(0.5, 2.5 - depth * 0.4);

    if (depth === 0) {
      ctx.globalAlpha  = alpha * 0.15;
      ctx.strokeStyle  = 'rgba(180, 210, 255, 1)';
      ctx.lineWidth    = 12;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
    ctx.lineWidth   = lw;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  ctx.restore();

  // Flash overlay — xác suất thấp, vẫn random được
  if (Math.random() < 0.3) {
    ctx.save();
    ctx.globalAlpha = 0.04 + Math.random() * 0.06;
    ctx.fillStyle   = '#a0c8ff';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

// ─── Snow renderer: batch save/restore + fastSin lookup table ─────────────────
function renderSnow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const ps  = snowParticles;
  const len = ps.length;

  ctx.save();

  for (let i = 0; i < len; i++) {
    const p    = ps[i];
    const wobX = fastSin(p.y / 45 + p.phase) * p.wobble;
    const px   = p.x + wobX;

    if (p.r > 2.5) {
      // Glow halo cho snow lớn
      ctx.globalAlpha = p.alpha * 0.25;
      ctx.fillStyle   = 'rgba(220,235,255,0.4)';
      ctx.beginPath();
      ctx.arc(px, p.y, p.r * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    ctx.arc(px, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    // Update position
    p.y += p.v;
    p.x += p.vx;
    if (p.y > h + p.r)  { p.y = -p.r; p.x = Math.random() * w; }
    if (p.x < -10)      { p.x = w + 10; }
    else if (p.x > w + 10) { p.x = -10; }
  }

  ctx.restore();
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export function drawWeatherEffects(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  weather: string,
) {
  if (weather === 'sunny') {
    if (currentWeatherType !== 'sunny') {
      rainParticles    = [];
      snowParticles    = [];
      currentWeatherType = 'sunny';
    }
    return;
  }

  if (currentWeatherType !== weather) {
    // Reset trước để GC có thể thu hồi array cũ
    rainParticles    = [];
    snowParticles    = [];
    lightningActive  = false;
    lightningTimer   = 60;
    lightningCount   = 0;

    if (weather === 'rain' || weather === 'storm') {
      rainParticles = initRain(w, h, weather === 'storm');
    } else if (weather === 'snow') {
      snowParticles = initSnow(w, h);
    }

    currentWeatherType = weather;
  }

  if (weather === 'rain')  { renderRain(ctx, w, h, false); }
  if (weather === 'storm') { renderRain(ctx, w, h, true); renderLightning(ctx, w, h); }
  if (weather === 'snow')  { renderSnow(ctx, w, h); }
}