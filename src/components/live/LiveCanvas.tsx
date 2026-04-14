"use client";

import { useRef, useState, useCallback, useEffect, memo } from "react";
import {
  Video,
  X,
  Lock,
  Unlock,
  Eye,
  LayoutGrid,
  MessageSquare,
  Camera,
  Activity,
  Zap,
  Music,
  Users,
  Star,
  Type,
  Trash2,
} from "lucide-react";

export type WidgetKind =
  | "chat"
  | "camera"
  | "progress"
  | "alert"
  | "nowplaying"
  | "follower_goal"
  | "sub_count"
  | "text"
  | "separator";

export interface LiveWidget {
  id: string;
  kind: WidgetKind;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: Record<string, string | number | boolean>;
}

const L = {
  bg:     "rgba(8,10,16,0.97)",
  panel:  "rgba(12,14,22,0.98)",
  border: "rgba(255,255,255,0.08)",
  amber:  "#d4a843",
  amberD: "rgba(212,168,67,0.15)",
  red:    "#ef4444",
  redD:   "rgba(239,68,68,0.15)",
  text:   "#e2e8f0",
  muted:  "#64748b",
  green:  "#22c55e",
  purple: "#a855f7",
  blue:   "#3b82f6",
};

interface WidgetDef {
  kind: WidgetKind;
  label: string;
  icon: React.ElementType;
  defaultW: number;
  defaultH: number;
  defaultConfig: Record<string, string | number | boolean>;
  imageSrc?: string;
  color: string;
}

const WIDGET_CATALOG: WidgetDef[] = [
  {
    kind: "chat", label: "Khung Chat", icon: MessageSquare,
    defaultW: 320, defaultH: 480,
    defaultConfig: { title: "Chat", showAvatar: true, fontSize: 14, opacity: 90 },
    imageSrc: "/assets/live/chat_frame.png", color: L.blue,
  },
  {
    kind: "camera", label: "Khung Camera", icon: Camera,
    defaultW: 320, defaultH: 180,
    defaultConfig: { label: "Camera", borderRadius: 8, borderColor: "#ffffff", borderWidth: 3 },
    imageSrc: "/assets/live/camera_frame.png", color: L.purple,
  },
  {
    kind: "progress", label: "Thanh Tiến Độ", icon: Activity,
    defaultW: 400, defaultH: 80,
    defaultConfig: { title: "Mục tiêu", current: 750, goal: 1000, unit: "sub", color: "#22c55e" },
    imageSrc: "/assets/live/progress_bar.png", color: L.green,
  },
  {
    kind: "alert", label: "Alert Donation", icon: Zap,
    defaultW: 480, defaultH: 120,
    defaultConfig: { title: "Cảm ơn!", message: "đã ủng hộ!", sound: true },
    imageSrc: "/assets/live/alert_box.png", color: "#f59e0b",
  },
  {
    kind: "nowplaying", label: "Đang phát", icon: Music,
    defaultW: 360, defaultH: 90,
    defaultConfig: { song: "Tên bài hát", artist: "Nghệ sĩ", showCover: true },
    imageSrc: "/assets/live/now_playing.png", color: "#ec4899",
  },
  {
    kind: "follower_goal", label: "Mục Tiêu Follower", icon: Users,
    defaultW: 280, defaultH: 100,
    defaultConfig: { current: 1240, goal: 2000, label: "Followers" },
    imageSrc: "/assets/live/follower_goal.png", color: L.blue,
  },
  {
    kind: "sub_count", label: "Số Sub", icon: Star,
    defaultW: 200, defaultH: 80,
    defaultConfig: { count: 1337, label: "Subscribers", showIcon: true },
    imageSrc: "/assets/live/sub_count.png", color: "#f59e0b",
  },
  {
    kind: "text", label: "Văn Bản Tự Do", icon: Type,
    defaultW: 300, defaultH: 60,
    defaultConfig: { content: "Nhập nội dung...", fontSize: 18, color: "#ffffff", align: "center", bold: false },
    color: L.muted,
  },
];

function renderWidgetContent(widget: LiveWidget, def: WidgetDef) {
  const cfg = widget.config;
  if (def.imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={def.imageSrc} alt={def.label} draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "fill", pointerEvents: "none" }} />
    );
  }
  switch (widget.kind) {
    case "chat":
      return (
        <div style={{ padding: "8px 12px", height: "100%", display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: def.color, textTransform: "uppercase", letterSpacing: ".08em", borderBottom: `1px solid ${L.border}`, paddingBottom: 4 }}>{String(cfg.title)}</div>
          {["Viewer123: Gg ez!", "StreamerFan: pog pog", "NewUser456: xin chào!", "Regular: F in chat"].map((line, i) => (
            <div key={i} style={{ fontSize: Number(cfg.fontSize) - 2, color: "rgba(255,255,255,.75)", lineHeight: 1.4 }}>
              <span style={{ color: def.color, fontWeight: 600 }}>{line.split(":")[0]}:</span>
              <span style={{ marginLeft: 4 }}>{line.split(":")[1]}</span>
            </div>
          ))}
          <div style={{ marginTop: "auto", padding: "4px 8px", background: "rgba(255,255,255,.06)", borderRadius: 4, fontSize: 10, color: L.muted }}>Viết tin nhắn...</div>
        </div>
      );
    case "camera":
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(20,20,30,.9)", border: `${Number(cfg.borderWidth)}px solid ${String(cfg.borderColor)}`, borderRadius: Number(cfg.borderRadius), position: "relative", overflow: "hidden" }}>
          <Camera size={32} style={{ color: "rgba(255,255,255,.2)" }} />
          <div style={{ position: "absolute", bottom: 6, left: 8, fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: ".05em" }}>{String(cfg.label)}</div>
          <div style={{ position: "absolute", top: 6, right: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: L.red, animation: "livePulse 1.2s ease-in-out infinite" }} />
            <span style={{ fontSize: 8, color: L.red, fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
      );
    case "progress": {
      const pct = Math.min(100, Math.round((Number(cfg.current) / Number(cfg.goal)) * 100));
      return (
        <div style={{ padding: "10px 14px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: L.text }}>{String(cfg.title)}</span>
            <span style={{ fontSize: 11, color: String(cfg.color) }}>{Number(cfg.current).toLocaleString()} / {Number(cfg.goal).toLocaleString()} {String(cfg.unit)}</span>
          </div>
          <div style={{ height: 12, background: "rgba(255,255,255,.1)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${String(cfg.color)}bb, ${String(cfg.color)})`, borderRadius: 6, transition: "width .3s" }} />
          </div>
          <div style={{ fontSize: 10, color: L.muted, textAlign: "right" }}>{pct}%</div>
        </div>
      );
    }
    case "alert":
      return (
        <div style={{ padding: "10px 16px", height: "100%", display: "flex", alignItems: "center", gap: 12 }}>
          <Zap size={28} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b" }}>{String(cfg.title)}</div>
            <div style={{ fontSize: 11, color: L.muted }}>Username {String(cfg.message)}</div>
          </div>
        </div>
      );
    case "nowplaying":
      return (
        <div style={{ padding: "8px 12px", height: "100%", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 50, height: 50, borderRadius: 6, background: "rgba(236,72,153,.2)", border: "1px solid rgba(236,72,153,.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Music size={20} style={{ color: "#ec4899" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: L.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(cfg.song)}</div>
            <div style={{ fontSize: 10, color: L.muted, marginTop: 2 }}>{String(cfg.artist)}</div>
            <div style={{ height: 2, background: "rgba(236,72,153,.2)", borderRadius: 1, marginTop: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "45%", background: "#ec4899", borderRadius: 1 }} />
            </div>
          </div>
        </div>
      );
    case "follower_goal": {
      const pct2 = Math.min(100, Math.round((Number(cfg.current) / Number(cfg.goal)) * 100));
      return (
        <div style={{ padding: "8px 14px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: L.text }}>{String(cfg.label)}</span>
            <span style={{ fontSize: 11, color: L.blue }}>{Number(cfg.current).toLocaleString()} / {Number(cfg.goal).toLocaleString()}</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,.08)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct2}%`, background: L.blue, borderRadius: 4 }} />
          </div>
        </div>
      );
    }
    case "sub_count":
      return (
        <div style={{ padding: "8px 14px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Star size={22} style={{ color: "#f59e0b" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{Number(cfg.count).toLocaleString()}</div>
            <div style={{ fontSize: 9, color: L.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>{String(cfg.label)}</div>
          </div>
        </div>
      );
    case "text":
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: String(cfg.align) as "center" | "flex-start" | "flex-end", padding: "4px 10px" }}>
          <span style={{ fontSize: Number(cfg.fontSize), color: String(cfg.color), fontWeight: Boolean(cfg.bold) ? 700 : 400, textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>{String(cfg.content)}</span>
        </div>
      );
    default:
      return <div style={{ padding: 12, fontSize: 12, color: L.muted }}>Widget</div>;
  }
}

const RESIZE_HANDLE_SIZE = 10;
const MIN_W = 80;
const MIN_H = 50;

interface WidgetProps {
  widget: LiveWidget;
  def: WidgetDef;
  locked: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number, anchor: "se" | "sw" | "ne" | "nw") => void;
  onDelete: () => void;
}

const LiveWidgetBox = memo(function LiveWidgetBox({ widget, def, locked, selected, onSelect, onMove, onResize, onDelete }: WidgetProps) {
  const dragStart  = useRef<{ mx: number; my: number } | null>(null);
  const resizeInfo = useRef<{ mx: number; my: number; anchor: "se" | "sw" | "ne" | "nw" } | null>(null);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if (locked) return;
    if ((e.target as HTMLElement).closest("[data-resize]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { mx: e.clientX, my: e.clientY };
    onSelect();
  }, [locked, onSelect]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (locked) return;
    if (resizeInfo.current) {
      const { mx, my, anchor } = resizeInfo.current;
      const dx = e.clientX - mx, dy = e.clientY - my;
      onResize(dx, dy, anchor);
      resizeInfo.current = { mx: e.clientX, my: e.clientY, anchor };
      return;
    }
    if (!dragStart.current) return;
    onMove(e.clientX - dragStart.current.mx, e.clientY - dragStart.current.my);
    dragStart.current = { mx: e.clientX, my: e.clientY };
  }, [locked, onMove, onResize]);

  const handleDragEnd = useCallback(() => { dragStart.current = null; resizeInfo.current = null; }, []);

  const startResize = useCallback((e: React.PointerEvent, anchor: "se" | "sw" | "ne" | "nw") => {
    if (locked) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeInfo.current = { mx: e.clientX, my: e.clientY, anchor };
  }, [locked]);

  return (
    <div
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
      style={{
        position: "absolute", left: widget.x, top: widget.y, width: widget.w, height: widget.h,
        cursor: locked ? "default" : "move", userSelect: "none",
        outline: !locked ? `1px dashed ${def.color}88` : "none", outlineOffset: 2,
        borderRadius: 6, touchAction: "none", zIndex: selected ? 999 : 1,
      }}
    >
      <div style={{ width: "100%", height: "100%", background: "rgba(8,10,18,0.85)", border: `1px solid ${!locked ? def.color : "rgba(255,255,255,0.1)"}`, borderRadius: 6, overflow: "hidden", backdropFilter: "blur(4px)", boxShadow: !locked ? `0 4px 15px rgba(0,0,0,0.4)` : "none" }}>
        {renderWidgetContent(widget, def)}
      </div>
      {!locked && (
        <div style={{ position: "absolute", top: -26, left: 0, display: "flex", alignItems: "center", gap: 4, pointerEvents: "auto" }}>
          <div style={{ background: def.color, borderRadius: 3, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: "#000", whiteSpace: "nowrap" }}>{widget.label}</div>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ width: 20, height: 20, borderRadius: 3, background: "rgba(239,68,68,.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <Trash2 size={10} />
          </button>
        </div>
      )}
      {!locked && (["se", "sw", "ne", "nw"] as const).map((anchor) => (
        <div key={anchor} data-resize={anchor} onPointerDown={(e) => startResize(e, anchor)}
          style={{ position: "absolute", width: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE, background: def.color, borderRadius: "50%", border: "2px solid #000", cursor: anchor === "se" || anchor === "nw" ? "nwse-resize" : "nesw-resize", ...(anchor === "se" ? { bottom: -5, right: -5 } : anchor === "sw" ? { bottom: -5, left: -5 } : anchor === "ne" ? { top: -5, right: -5 } : { top: -5, left: -5 }) }} />
      ))}
    </div>
  );
});

function LivePanel({ onAddWidget, onClose }: { onAddWidget: (kind: WidgetKind) => void; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", width: 200, background: L.panel, border: `1px solid ${L.border}`, borderRadius: 10, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,.8)", zIndex: 9100, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${L.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(239,68,68,.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: L.red, animation: "livePulse 1.2s ease-in-out infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: L.red, textTransform: "uppercase", letterSpacing: ".08em" }}>Live Widgets</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: L.muted, display: "flex" }}><X size={12} /></button>
      </div>
      <div style={{ overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        {WIDGET_CATALOG.map((def) => {
          const Icon = def.icon;
          return (
            <button key={def.kind} onClick={() => onAddWidget(def.kind)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 5, cursor: "pointer", border: `1px solid ${L.border}`, background: "transparent", color: L.text, fontSize: 11, fontWeight: 500, transition: "background .1s", textAlign: "left" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${def.color}18`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Icon size={13} style={{ color: def.color, flexShrink: 0 }} />
              {def.label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "8px 10px", borderTop: `1px solid ${L.border}`, fontSize: 9, color: L.muted, lineHeight: 1.5 }}>
        Kéo để di chuyển · Kéo góc để resize
      </div>
    </div>
  );
}

// ─── Live HUD bar ─────────────────────────────────────────────────────────────
// YÊU CẦU 1+2: Nút Live dời sang góc phải, chữ LIVE toggle ẩn/hiện HUD
// YÊU CẦU 3: Copy URL thêm ?obs=1 mà không ảnh hưởng trang hiện tại

function LiveHUDBar({
  locked, hudVisible, panelOpen,
  onToggleLock, onToggleHUD, onTogglePanel, onExit,
  widgets,
}: {
  locked: boolean; hudVisible: boolean; widgetCount: number; panelOpen: boolean;
  onToggleLock: () => void; onToggleHUD: () => void; onTogglePanel: () => void; onExit: () => void;
  widgets: LiveWidget[];
}) {
  const [copyFlash, setCopyFlash] = useState(false);

  // YÊU CẦU 3: tạo URL OBS — thêm obs=1 (luôn ẩn HUD) + giữ layout, KHÔNG thay đổi URL hiện tại
  const handleCopyOBSUrl = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      // obs=1 báo cho trang biết render ở chế độ OBS (luôn ẩn HUD)
      url.searchParams.set("obs", "1");

      // Encode widgets vào URL để OBS load đúng layout
      if (widgets.length > 0) {
        const encoded = btoa(
          encodeURIComponent(JSON.stringify(widgets)).replace(/%([0-9A-F]{2})/g, (_, p1) =>
            String.fromCharCode(parseInt(p1, 16)),
          ),
        );
        url.searchParams.set("layout", encoded);
      }

      navigator.clipboard.writeText(url.toString());
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1800);
    } catch {
      alert("Không thể copy URL");
    }
  }, [widgets]);

return (
    <div style={{ position: "fixed", top: 16, right: 16, display: "flex", alignItems: "center", gap: 6, zIndex: 9200, pointerEvents: "auto" }}>

      {/* Chữ LIVE — Luôn luôn hiện để làm nút bấm toggle */}
      <button
        onClick={onToggleHUD}
        title={hudVisible ? "Nhấn để ẩn HUD (H)" : "Nhấn để hiện HUD (H)"}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: hudVisible ? L.redD : "rgba(30,10,10,0.9)",
          border: `1px solid ${hudVisible ? L.red : "rgba(239,68,68,0.3)"}`,
          borderRadius: 6, padding: "5px 10px", cursor: "pointer",
          transition: "all .2s",
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: L.red, animation: "livePulse 1.2s ease-in-out infinite" }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: L.red, letterSpacing: ".12em" }}>LIVE</span>
        <Eye size={11} style={{ color: hudVisible ? L.muted : "rgba(239,68,68,0.5)", marginLeft: 2 }} />
      </button>

      {/* Bọc toàn bộ các nút còn lại vào điều kiện hudVisible */}
      {hudVisible && (
        <>
          {/* Copy URL cho OBS */}
          <HUDIconBtn active={copyFlash} activeColor={L.green} onClick={handleCopyOBSUrl} title="Copy URL cho OBS (tự ẩn HUD)">
            {copyFlash
              ? <span style={{ fontSize: 9, fontWeight: 700, color: L.green }}>✓</span>
              : <Zap size={14} />
            }
          </HUDIconBtn>

          {/* Lock */}
          <HUDIconBtn active={locked} activeColor={L.amber} onClick={onToggleLock} title={locked ? "Mở khóa (K)" : "Khóa (K)"}>
            {locked ? <Lock size={14} /> : <Unlock size={14} />}
          </HUDIconBtn>

          {/* Toggle widget panel */}
          <HUDIconBtn active={panelOpen} activeColor={L.blue} onClick={onTogglePanel} title="Thêm widget">
            <LayoutGrid size={14} />
          </HUDIconBtn>

          {/* Exit */}
          <button onClick={onExit} title="Thoát chế độ Live (L)"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, border: `1px solid rgba(255,255,255,.1)`, background: "rgba(8,10,16,.9)", color: L.muted, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            <X size={12} /> Thoát
          </button>
        </>
      )}
    </div>
  );
}

function HUDIconBtn({ children, active, activeColor, onClick, title }: {
  children: React.ReactNode; active: boolean; activeColor: string; onClick: () => void; title: string;
}) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, cursor: "pointer", border: `1px solid ${active ? activeColor : "rgba(255,255,255,.1)"}`, background: active ? `${activeColor}20` : "rgba(8,10,16,.9)", color: active ? activeColor : L.muted, transition: "all .15s" }}>
      {children}
    </button>
  );
}

export interface LiveCanvasProps {
  onLiveModeChange?: (active: boolean) => void;
}

export default function LiveCanvas({ onLiveModeChange }: LiveCanvasProps) {
  const [liveMode,   setLiveMode]   = useState(false);
  const [panelOpen,  setPanelOpen]  = useState(false);
  const [locked,     setLocked]     = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [widgets,    setWidgets]    = useState<LiveWidget[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── YÊU CẦU 3: Đọc ?obs=1 khi load — tự vào live mode VÀ ẩn HUD ──────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Đọc layout
    const layoutData = params.get("layout");
    if (layoutData) {
      try {
        const decoded = JSON.parse(
          decodeURIComponent(
            atob(layoutData).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""),
          ),
        );
        setTimeout(() => setWidgets(decoded), 0);
      } catch (e) {
        console.error("Lỗi giải mã layout", e);
      }
    }

    // YÊU CẦU 3: ?obs=1 → vào live mode + ẩn HUD ngay, KHÔNG thay đổi URL hiện tại
    if (params.get("obs") === "1") {
      setTimeout(() => { 
        setLiveMode(true);
        setHudVisible(false);  // tự ẩn HUD khi dùng URL OBS
        setLocked(true);     // TỰ ĐỘNG KHÓA (Yêu cầu mới)
      }, 0);
    }
  }, []);

  // Sync layout vào URL (không bao gồm obs param — tránh ảnh hưởng URL gốc)
  useEffect(() => {
    if (widgets.length === 0) return;
    try {
      const encoded = btoa(
        encodeURIComponent(JSON.stringify(widgets)).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16)),
        ),
      );
      const url = new URL(window.location.href);
      url.searchParams.set("layout", encoded);
      // Chỉ set layout, KHÔNG set obs — giữ URL gốc sạch
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      console.error("Không thể mã hóa layout:", e);
    }
  }, [widgets]);

  useEffect(() => { onLiveModeChange?.(liveMode); }, [liveMode, onLiveModeChange]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "l" || e.key === "L") setLiveMode((v) => !v);
      if (!liveMode) return;
      if (e.key === "k" || e.key === "K") setLocked((v) => !v);
      if (e.key === "h" || e.key === "H") setHudVisible((v) => !v);
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [liveMode]);

  useEffect(() => {
    if (!selectedId) return;
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-live-widget]")) setSelectedId(null);
    };
    const id = setTimeout(() => window.addEventListener("click", fn), 10);
    return () => { clearTimeout(id); window.removeEventListener("click", fn); };
  }, [selectedId]);

  const addWidget = useCallback((kind: WidgetKind) => {
    const def = WIDGET_CATALOG.find((d) => d.kind === kind);
    if (!def) return;
    const id = `${kind}_${Date.now()}`;
    const offset = widgets.length * 20;
    setWidgets((prev) => [...prev, { id, kind, label: def.label, x: 60 + offset, y: 60 + offset, w: def.defaultW, h: def.defaultH, config: { ...def.defaultConfig } }]);
    setSelectedId(id);
  }, [widgets.length]);

  const moveWidget = useCallback((id: string, dx: number, dy: number) => {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, x: Math.max(0, w.x + dx), y: Math.max(0, w.y + dy) } : w));
  }, []);

  const resizeWidget = useCallback((id: string, dw: number, dh: number, anchor: "se" | "sw" | "ne" | "nw") => {
    setWidgets((prev) => prev.map((w) => {
      if (w.id !== id) return w;
      let { x, y, width: ww, height: wh } = { x: w.x, y: w.y, width: w.w, height: w.h };
      if (anchor === "se") { ww = Math.max(MIN_W, ww + dw); wh = Math.max(MIN_H, wh + dh); }
      if (anchor === "sw") { x += dw; ww = Math.max(MIN_W, ww - dw); wh = Math.max(MIN_H, wh + dh); }
      if (anchor === "ne") { y += dh; ww = Math.max(MIN_W, ww + dw); wh = Math.max(MIN_H, wh - dh); }
      if (anchor === "nw") { x += dw; y += dh; ww = Math.max(MIN_W, ww - dw); wh = Math.max(MIN_H, wh - dh); }
      return { ...w, x, y, w: ww, h: wh };
    }));
  }, []);

  const deleteWidget = useCallback((id: string) => { setWidgets((prev) => prev.filter((w) => w.id !== id)); setSelectedId(null); }, []);

  // ── YÊU CẦU 2: Nút Live dời sang góc PHẢI, bố trí cùng row với HUD bar ───
  // Khi chưa vào live mode: nút Video nhỏ ở cụm góc phải cùng row tương lai
  // Khi vào live mode: nút bị thay bằng HUD bar đầy đủ

  if (!liveMode) {
    return (
      <>
        {/* Nút Live — góc phải trên, tách biệt với HUD gốc */}
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 400, pointerEvents: "auto" }}>
          <button
            onClick={() => setLiveMode(true)}
            title="Bật chế độ Live (L)"
            style={{
              height: 36, paddingInline: 12,
              background: "rgba(0,0,0,.8)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 8, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7,
              transition: "all .2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = L.red;
              e.currentTarget.style.background = "rgba(239,68,68,.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,.12)";
              e.currentTarget.style.background = "rgba(0,0,0,.8)";
            }}
          >
            <Video size={15} style={{ color: "rgba(255,255,255,.5)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", letterSpacing: ".04em" }}>Live</span>
          </button>
        </div>
        <style>{`@keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.15)} }`}</style>
      </>
    );
  }

  // ── Live mode ─────────────────────────────────────────────────────────────
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9000, pointerEvents: "none" }}>

        {/* Widgets */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: locked ? "none" : "auto" }} onClick={() => setSelectedId(null)}>
          {widgets.map((widget) => {
            const def = WIDGET_CATALOG.find((d) => d.kind === widget.kind)!;
            return (
              <div key={widget.id} data-live-widget style={{ position: "absolute", left: 0, top: 0, pointerEvents: "auto" }}>
                <LiveWidgetBox widget={widget} def={def} locked={locked} selected={selectedId === widget.id}
                  onSelect={() => setSelectedId(widget.id)}
                  onMove={(dx, dy) => moveWidget(widget.id, dx, dy)}
                  onResize={(dw, dh, anchor) => resizeWidget(widget.id, dw, dh, anchor)}
                  onDelete={() => deleteWidget(widget.id)} />
              </div>
            );
          })}
        </div>

        {/* YÊU CẦU 1+2: HUD bar — chữ LIVE luôn hiện, phần còn lại ẩn/hiện theo hudVisible */}
        <div style={{ pointerEvents: "auto" }}>
          <LiveHUDBar
            locked={locked} hudVisible={hudVisible} widgetCount={widgets.length}
            panelOpen={panelOpen}
            onToggleLock={() => setLocked((v) => !v)}
            onToggleHUD={() => setHudVisible((v) => !v)}
            onTogglePanel={() => setPanelOpen((v) => !v)}
            onExit={() => { setLiveMode(false); setPanelOpen(false); setLocked(false); setHudVisible(true); }}
            widgets={widgets}
          />
        </div>

        {/* Panel widget — chỉ hiện khi HUD visible */}
        {panelOpen && hudVisible && (
          <div style={{ pointerEvents: "auto" }}>
            <LivePanel onAddWidget={addWidget} onClose={() => setPanelOpen(false)} />
          </div>
        )}

        {/* Lock indicator */}
        {locked && hudVisible && (
          <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(8,10,16,.9)", border: `1px solid ${L.amber}`, borderRadius: 20, padding: "5px 14px", fontSize: 10, fontWeight: 600, color: L.amber, display: "flex", alignItems: "center", gap: 5, pointerEvents: "none" }}>
            <Lock size={11} /> Màn hình đang bị khóa
          </div>
        )}
      </div>

      <style>{`
        @keyframes livePulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.45; transform:scale(1.18); }
        }
      `}</style>
    </>
  );
}