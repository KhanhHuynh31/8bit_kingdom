"use client";

import { useEffect, useMemo, useRef } from "react";
import { worldToScreen } from "@/utils/coords";
import { Building, Camera } from "@/types";
import { torchStates } from "@/utils/torchManager";

interface LightSystemProps {
  camera: Camera;
  width: number;
  height: number;
  status: string;
  buildings: Building[];
}

interface TorchPosition {
  id: string;
  pos: { x: number; y: number };
}

interface TorchDOMRefs {
  lightGroup: SVGGElement;
  maskCircle: SVGCircleElement;
  outer: SVGCircleElement;
  mid: SVGCircleElement;
  core: SVGCircleElement;
}

const AMBIENT_OPACITY: Record<string, number> = {
  night: 0.82,
  evening: 0.48,
  day: 0,
  morning: 0,
};

export default function LightSystem({
  camera,
  width,
  height,
  status,
  buildings,
}: LightSystemProps) {
  const svgRef     = useRef<SVGSVGElement>(null);
  const rafRef     = useRef<number>(0);
  const domRefsRef = useRef<Map<string, TorchDOMRefs>>(new Map());

  // ── Refs cho RAF loop ─────────────────────────────────────────────────────
  const baseRadiusRef     = useRef(250 * camera.zoom);
  const isDarkTimeRef     = useRef(false);
  const torchPositionsRef = useRef<TorchPosition[]>([]);

  const torches = useMemo(
    () => buildings.filter((b: Building) => b.type === "torch"),
    [buildings],
  );

  const isDarkTime     = status === "evening" || status === "night";
  const ambientOpacity = AMBIENT_OPACITY[status] ?? 0;

  // ── useMemo cho render: không setState trong effect ───────────────────────
  const baseRadius = useMemo(() => 250 * camera.zoom, [camera.zoom]);

  const torchPositions = useMemo<TorchPosition[]>(
    () =>
      torches.map((t: Building) => ({
        id: t.id,
        pos: worldToScreen(t.worldX + 0.5, t.worldY, camera, width / 2, height / 2),
      })),
    [torches, camera, width, height],
  );

  // ── Sync refs từ memo values — effect chỉ update external system (refs) ──
  useEffect(() => { isDarkTimeRef.current = isDarkTime; },       [isDarkTime]);
  useEffect(() => { baseRadiusRef.current = baseRadius; },       [baseRadius]);
  useEffect(() => { torchPositionsRef.current = torchPositions; }, [torchPositions]);

  // ── Reset userPreference khi đổi buổi ────────────────────────────────────
  useEffect(() => {
    Object.keys(torchStates).forEach((id) => {
      torchStates[id].userPreference = null;
    });
  }, [status]);

  // ── Cache DOM refs sau khi SVG render ────────────────────────────────────
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const frameId = requestAnimationFrame(() => {
      const newRefs = new Map<string, TorchDOMRefs>();
      for (const t of torches) {
        const lightGroup = svg.getElementById(`light-group-${t.id}`) as SVGGElement;
        const maskCircle = svg.getElementById(`lf-mask-${t.id}`)     as SVGCircleElement;
        const outer      = svg.getElementById(`lf-outer-${t.id}`)    as SVGCircleElement;
        const mid        = svg.getElementById(`lf-mid-${t.id}`)      as SVGCircleElement;
        const core       = svg.getElementById(`lf-core-${t.id}`)     as SVGCircleElement;

        if (lightGroup && maskCircle && outer && mid && core) {
          newRefs.set(t.id, { lightGroup, maskCircle, outer, mid, core });
        }
      }
      domRefsRef.current = newRefs;
    });

    return () => cancelAnimationFrame(frameId);
  }, [torches]);

  // ── RAF loop: chỉ đọc refs, không phụ thuộc reactive values ─────────────
  useEffect(() => {
    if (torches.length === 0) return;

    const tick = (timestamp: number) => {
      const s  = timestamp / 1000;
      const fr = 1 + Math.sin(s * 7.31) * 0.028 + Math.sin(s * 13.7) * 0.014;
      const br        = baseRadiusRef.current;
      const darkTime  = isDarkTimeRef.current;
      const positions = torchPositionsRef.current;
      const domRefs   = domRefsRef.current;

      for (let i = 0; i < positions.length; i++) {
        const { id, pos } = positions[i];
        const refs = domRefs.get(id);
        if (!refs) continue;

        if (!torchStates[id]) {
          torchStates[id] = { alpha: darkTime ? 1 : 0, userPreference: null };
        }

        const state = torchStates[id];
        const isOn  = state.userPreference !== null ? state.userPreference : darkTime;
        state.alpha += ((isOn ? 1 : 0) - state.alpha) * 0.1;
        const a = state.alpha;

        if (a < 0.005 && !isOn) {
          refs.lightGroup.setAttribute("opacity", "0");
          refs.maskCircle.setAttribute("opacity", "0");
          continue;
        }

        const scale = fr * (0.8 + a * 0.2);
        const cx    = String(pos.x);
        const cy    = String(pos.y);
        const aStr  = String(a);

        refs.lightGroup.setAttribute("opacity", aStr);

        refs.maskCircle.setAttribute("opacity", aStr);
        refs.maskCircle.setAttribute("cx", cx);
        refs.maskCircle.setAttribute("cy", cy);
        refs.maskCircle.setAttribute("r", String(br * 1.55 * scale));

        refs.outer.setAttribute("cx", cx);
        refs.outer.setAttribute("cy", cy);
        refs.outer.setAttribute("r", String(br * 2.5 * scale));

        refs.mid.setAttribute("cx", cx);
        refs.mid.setAttribute("cy", cy);
        refs.mid.setAttribute("r", String(br * 1.1 * scale));

        refs.core.setAttribute("cx", cx);
        refs.core.setAttribute("cy", cy);
        refs.core.setAttribute("r", String(br * 0.45 * scale));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [torches.length]);

  if (torches.length === 0 && ambientOpacity === 0) return null;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-10"
      width={width}
      height={height}
    >
      <defs>
        {torches.map((t: Building) => (
          <g key={t.id}>
            <radialGradient id={`rg-mask-${t.id}`}>
              <stop offset="0%"   stopColor="#000" stopOpacity="1" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`rg-outer-${t.id}`}>
              <stop offset="0%"   stopColor="#FF8C00" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#881000" stopOpacity="0"    />
            </radialGradient>
            <radialGradient id={`rg-mid-${t.id}`}>
              <stop offset="0%"   stopColor="#FFBE30" stopOpacity="0.0"  />
              <stop offset="25%"  stopColor="#FFA020" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#660800" stopOpacity="0"    />
            </radialGradient>
            <radialGradient id={`rg-core-${t.id}`}>
              <stop offset="0%"   stopColor="#FFF4C2" stopOpacity="0.18" />
              <stop offset="60%"  stopColor="#FFB030" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FF6000" stopOpacity="0"    />
            </radialGradient>
          </g>
        ))}

        <mask id="night-mask">
          <rect width="100%" height="100%" fill="white" />
          {torchPositions.map(({ id, pos }) => (
            <circle
              key={id}
              id={`lf-mask-${id}`}
              cx={pos.x}
              cy={pos.y}
              r={baseRadius * 1.55}
              fill={`url(#rg-mask-${id})`}
            />
          ))}
        </mask>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill={`rgba(5, 8, 20, ${ambientOpacity})`}
        mask="url(#night-mask)"
        style={{ transition: "fill 3s ease" }}
      />

      <g style={{ mixBlendMode: "screen" }}>
        {torchPositions.map(({ id, pos }) => (
          <g key={id} id={`light-group-${id}`}>
            <circle id={`lf-outer-${id}`} cx={pos.x} cy={pos.y} r={baseRadius * 2.5}  fill={`url(#rg-outer-${id})`} />
            <circle id={`lf-mid-${id}`}   cx={pos.x} cy={pos.y} r={baseRadius * 1.1}  fill={`url(#rg-mid-${id})`}   />
            <circle id={`lf-core-${id}`}  cx={pos.x} cy={pos.y} r={baseRadius * 0.45} fill={`url(#rg-core-${id})`}  />
          </g>
        ))}
      </g>
    </svg>
  );
}