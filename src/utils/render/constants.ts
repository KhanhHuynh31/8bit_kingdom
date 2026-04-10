export const imageCache = new Map<string, HTMLImageElement>();

export function getImage(src: string): HTMLImageElement {
  if (!imageCache.has(src)) {
    const img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  return imageCache.get(src)!;
}

export const GLOBAL_COLORS = {
  grass: ["#5a9e3a", "#4d8c30"],
  fog: "rgba(15, 25, 35, 0.9)",
};

const NOISE_TABLE = new Float32Array(256);
for (let i = 0; i < 256; i++) NOISE_TABLE[i] = (Math.random() - 0.5) * 2;
let noiseIdx = 0;

export function nextNoise(): number {
  noiseIdx = (noiseIdx + 1) & 255;
  return NOISE_TABLE[noiseIdx];
}