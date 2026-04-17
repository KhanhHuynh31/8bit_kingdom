"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapStore } from "@/stores/useMapStore";
import { X, Sparkles, RefreshCw, Zap } from "lucide-react";

// ── 6 Cosmic Symbols (thay thế Bầu/Cua/Tôm/Cá/Nai/Gà)
type SymbolKey = "nebula" | "comet" | "pulsar" | "orbit" | "nova" | "void";

interface CosmicSymbol {
  key: SymbolKey;
  emoji: string;
  name: string;
  color: string;
  glow: string;
  bg: string;
}

const SYMBOLS: CosmicSymbol[] = [
  {
    key: "nebula",
    emoji: "🌕",
    name: "Tinh Vân",
    color: "#a78bfa",
    glow: "#7c3aed",
    bg: "rgba(109,40,217,0.18)",
  },
  {
    key: "comet",
    emoji: "☄️",
    name: "Sao Chổi",
    color: "#fb923c",
    glow: "#ea580c",
    bg: "rgba(234,88,12,0.18)",
  },
  {
    key: "pulsar",
    emoji: "⚡",
    name: "Pulsar",
    color: "#34d399",
    glow: "#059669",
    bg: "rgba(5,150,105,0.18)",
  },
  {
    key: "orbit",
    emoji: "🪐",
    name: "Hành Tinh",
    color: "#f472b6",
    glow: "#db2777",
    bg: "rgba(219,39,119,0.18)",
  },
  {
    key: "nova",
    emoji: "✨",
    name: "Tân Tinh",
    color: "#fbbf24",
    glow: "#d97706",
    bg: "rgba(217,119,6,0.18)",
  },
  {
    key: "void",
    emoji: "🌀",
    name: "Hố Đen",
    color: "#60a5fa",
    glow: "#2563eb",
    bg: "rgba(37,99,235,0.18)",
  },
];

const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map((s) => [s.key, s])) as Record<
  SymbolKey,
  CosmicSymbol
>;

// Stars background (memoized positions)
const STARS = Array.from({ length: 50 }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 1 + Math.random() * 2,
  delay: Math.random() * 4,
  duration: 2 + Math.random() * 3,
}));

// Nebula orbs
const ORBS = [
  { color: "#7c3aed", x: -10, y: 20, size: 320 },
  { color: "#1d4ed8", x: 90, y: 60, size: 280 },
  { color: "#be185d", x: 50, y: 85, size: 200 },
];

// Roll result simulation
const rollThreeDice = (): SymbolKey[] => {
  const keys = SYMBOLS.map((s) => s.key);
  return Array.from({ length: 3 }, () => keys[Math.floor(Math.random() * 6)]);
};

// Dice face component
const DiceFace = ({
  symbol,
  rolling,
  delay = 0,
  revealed,
}: {
  symbol: CosmicSymbol | null;
  rolling: boolean;
  delay?: number;
  revealed: boolean;
}) => {
  const [sym] = useState(() => SYMBOLS[Math.floor(Math.random() * 6)]);
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{
        width: "clamp(72px, 18vw, 130px)",
        height: "clamp(72px, 18vw, 130px)",
        borderRadius: "clamp(12px, 3vw, 20px)",
        background: revealed && symbol ? symbol.bg : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${revealed && symbol ? symbol.color + "60" : "rgba(255,255,255,0.1)"}`,
        backdropFilter: "blur(12px)",
        boxShadow:
          revealed && symbol
            ? `0 0 32px ${symbol.glow}40, inset 0 0 20px ${symbol.glow}10`
            : "0 0 12px rgba(0,0,0,0.3)",
      }}
      animate={
        rolling
          ? {
              rotateY: [0, 180, 360, 540, 720],
              rotateX: [0, 90, 0, -90, 0],
              scale: [1, 0.9, 1.05, 0.95, 1],
            }
          : revealed
            ? {
                scale: [0.8, 1.08, 1],
                rotateY: [90, 0],
              }
            : {}
      }
      transition={
        rolling
          ? {
              duration: 1.2,
              delay,
              ease: "easeInOut",
            }
          : revealed
            ? {
                duration: 0.45,
                delay,
                ease: [0.34, 1.56, 0.64, 1],
              }
            : {
                duration: 0.3,
                delay,
                ease: "easeOut",
              }
      }
    >
      {/* Orbital ring */}
      {revealed && symbol && (
        <motion.div
          className="absolute inset-0 rounded-[inherit]"
          style={{ border: `1px solid ${symbol.color}30` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Rolling shimmer */}
      {rolling && (
        <motion.div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.05))",
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}

      {/* Emoji */}
      <AnimatePresence mode="wait">
        {rolling ? (
          <motion.span
            key="rolling"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            exit={{ opacity: 0 }}
            style={{
              fontSize: "clamp(1.6rem, 6vw, 3rem)",
              filter: "blur(1px)",
            }}
          >
            {sym.emoji}
          </motion.span>
        ) : revealed && symbol ? (
          <motion.div
            key={symbol.key}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18, delay }}
            className="flex flex-col items-center gap-0.5"
          >
            <motion.span
              style={{ fontSize: "clamp(1.8rem, 7vw, 3.2rem)" }}
              animate={{
                filter: [
                  `drop-shadow(0 0 4px ${symbol.glow})`,
                  `drop-shadow(0 0 12px ${symbol.glow})`,
                  `drop-shadow(0 0 4px ${symbol.glow})`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {symbol.emoji}
            </motion.span>
          </motion.div>
        ) : (
          <motion.span
            key="idle"
            style={{ fontSize: "clamp(1.4rem, 5vw, 2.5rem)", opacity: 0.15 }}
          >
            ?
          </motion.span>
        )}
      </AnimatePresence>

      {/* Particles on reveal */}
      {revealed && symbol && (
        <>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ backgroundColor: symbol.color }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: Math.cos((angle * Math.PI) / 180) * 40,
                y: Math.sin((angle * Math.PI) / 180) * 40,
                opacity: [0, 0.8, 0],
              }}
              transition={{ duration: 0.6, delay: delay + 0.1 + i * 0.03 }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};

// Bet chip button
const BetChip = ({
  symbol,
  amount,
  onClick,
  disabled,
}: {
  symbol: CosmicSymbol;
  amount: number;
  onClick: () => void;
  disabled: boolean;
}) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.06, y: -2 }}
    whileTap={disabled ? {} : { scale: 0.96 }}
    onClick={onClick}
    disabled={disabled}
    className="relative flex flex-col items-center gap-1"
    style={{ cursor: disabled ? "not-allowed" : "pointer" }}
  >
    <motion.div
      className="relative flex flex-col items-center justify-center"
      style={{
        width: "clamp(52px, 13vw, 86px)",
        height: "clamp(52px, 13vw, 86px)",
        borderRadius: "clamp(10px, 2.5vw, 16px)",
        background: amount > 0 ? symbol.bg : "rgba(255,255,255,0.03)",
        border: `1.5px solid ${amount > 0 ? symbol.color + "80" : "rgba(255,255,255,0.08)"}`,
        backdropFilter: "blur(8px)",
        boxShadow: amount > 0 ? `0 0 20px ${symbol.glow}30` : "none",
        opacity: disabled ? 0.5 : 1,
      }}
      animate={
        amount > 0
          ? {
              boxShadow: [
                `0 0 12px ${symbol.glow}20`,
                `0 0 28px ${symbol.glow}40`,
                `0 0 12px ${symbol.glow}20`,
              ],
            }
          : {}
      }
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <span style={{ fontSize: "clamp(1.2rem, 4vw, 2rem)" }}>
        {symbol.emoji}
      </span>

      {/* Bet amount badge */}
      <AnimatePresence>
        {amount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1.5 -right-1.5 rounded-full flex items-center justify-center"
            style={{
              background: symbol.glow,
              minWidth: "clamp(16px, 4vw, 22px)",
              height: "clamp(16px, 4vw, 22px)",
              padding: "0 4px",
            }}
          >
            <span
              className="text-white font-black"
              style={{ fontSize: "clamp(0.45rem, 1.5vw, 0.6rem)" }}
            >
              {amount}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    <span
      className="font-bold text-center leading-tight"
      style={{
        color: amount > 0 ? symbol.color : "rgba(255,255,255,0.3)",
        fontSize: "clamp(0.45rem, 1.6vw, 0.6rem)",
        letterSpacing: "0.05em",
      }}
    >
      {symbol.name}
    </span>
  </motion.button>
);

// Win burst effect
const WinBurst = ({ wins }: { wins: SymbolKey[] }) => (
  <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
    {wins.map((key, i) => {
      const sym = SYMBOL_MAP[key];
      return Array.from({ length: 8 }, (_, j) => {
        const angle = (j / 8) * 360 + i * 40;
        return (
          <motion.div
            key={`${key}-${j}`}
            className="absolute rounded-full"
            style={{
              width: 6 + j,
              height: 6 + j,
              background: sym.color,
              left: "50%",
              top: "50%",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * (80 + j * 20),
              y: Math.sin((angle * Math.PI) / 180) * (80 + j * 20),
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
          />
        );
      });
    })}
  </div>
);

export const BauCuaPopup = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { avocados } = useMapStore();

  const [bets, setBets] = useState<Partial<Record<SymbolKey, number>>>({});
  const [betUnit, setBetUnit] = useState(50);
  const [phase, setPhase] = useState<"betting" | "rolling" | "result">(
    "betting",
  );
  const [diceResults, setDiceResults] = useState<SymbolKey[] | null>(null);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [winAmount, setWinAmount] = useState(0);
  const [,setTotalBet] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [winSymbols, setWinSymbols] = useState<SymbolKey[]>([]);
  const [shakeBoard, setShakeBoard] = useState(false);

  const totalBetCalc = Object.values(bets).reduce((a, b) => a + (b || 0), 0);

  const placeBet = (key: SymbolKey) => {
    if (phase !== "betting") return;
    if (avocados - totalBetCalc < betUnit) return;
    setBets((prev) => ({ ...prev, [key]: (prev[key] || 0) + betUnit }));
    useMapStore.setState((s) => ({ avocados: s.avocados - betUnit }));
  };

  const removeBet = (key: SymbolKey) => {
    if (phase !== "betting") return;
    const cur = bets[key] || 0;
    if (cur === 0) return;
    const remove = Math.min(betUnit, cur);
    setBets((prev) => {
      const next = { ...prev };
      next[key] = (next[key] || 0) - remove;
      if (next[key]! <= 0) delete next[key];
      return next;
    });
    useMapStore.setState((s) => ({ avocados: s.avocados + remove }));
  };

  const roll = useCallback(() => {
    if (totalBetCalc === 0 || phase !== "betting") return;
    setTotalBet(totalBetCalc);
    setPhase("rolling");
    setRevealIndex(-1);
    setShakeBoard(true);
    setTimeout(() => setShakeBoard(false), 1200);

    const results = rollThreeDice();

    // Reveal dice one by one after rolling
    setTimeout(() => {
      setDiceResults(results);
      [0, 1, 2].forEach((i) => {
        setTimeout(() => setRevealIndex(i), i * 380 + 200);
      });

      // Calculate winnings
      setTimeout(() => {
        const counts: Partial<Record<SymbolKey, number>> = {};
        results.forEach((k) => {
          counts[k] = (counts[k] || 0) + 1;
        });

        let profit = 0;
        const winKeys: SymbolKey[] = [];
        SYMBOLS.forEach(({ key }) => {
          const bet = bets[key] || 0;
          if (bet > 0 && counts[key]) {
            profit += bet * counts[key]!;
            winKeys.push(key);
          }
        });

        setWinSymbols(winKeys);
        setWinAmount(profit);

        if (profit > 0) {
          useMapStore.setState((s) => ({
            avocados: s.avocados + profit + totalBetCalc,
          }));
          setShowBurst(true);
          setTimeout(() => setShowBurst(false), 1200);
        }

        setPhase("result");
      }, 2000);
    }, 1400);
  }, [bets, phase, totalBetCalc]);

  const resetGame = () => {
    setBets({});
    setDiceResults(null);
    setRevealIndex(-1);
    setPhase("betting");
    setWinAmount(0);
    setTotalBet(0);
    setWinSymbols([]);
    setShowBurst(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: "rgba(0,0,0,0.97)" }}
    >
      {/* ── Cosmic Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep space gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, #0d0a2a, #000010 60%)",
          }}
        />

        {/* Nebula orbs */}
        {ORBS.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, ${orb.color}18, transparent 70%)`,
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Stars */}
        {STARS.map((star, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: star.size,
              height: star.size,
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1] }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Scanline */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)",
          }}
        />
      </div>

      {/* Win burst */}
      <AnimatePresence>
        {showBurst && <WinBurst wins={winSymbols} />}
      </AnimatePresence>

      {/* ── Main Container ── */}
      <motion.div
        className="relative w-full h-full flex flex-col overflow-hidden"
        style={{
          padding:
            "env(safe-area-inset-top,8px) env(safe-area-inset-right,8px) env(safe-area-inset-bottom,8px) env(safe-area-inset-left,8px)",
          maxWidth: 520,
          margin: "0 auto",
        }}
        animate={
          shakeBoard
            ? {
                x: [0, -6, 8, -8, 6, -4, 3, 0],
                y: [0, -3, 4, -4, 3, -2, 1, 0],
              }
            : {}
        }
        transition={{ duration: 0.9 }}
      >
        {/* ── Header ── */}
        <div className="w-full flex justify-between items-start z-20 px-4 pt-4 flex-shrink-0">
          <div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
            >
              <Sparkles size={12} color="#a78bfa" />
              <span
                className="font-black text-purple-400"
                style={{ fontSize: "clamp(0.75rem, 3vw, 1rem)" }}
              >
                {avocados.toLocaleString()} 🥑
              </span>
            </div>
            {totalBetCalc > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-purple-500 font-bold ml-2 mt-0.5"
                style={{ fontSize: "clamp(0.5rem, 2vw, 0.65rem)" }}
              >
                Đặt: {totalBetCalc} 🥑
              </motion.p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{ color: "rgba(139,92,246,0.5)" }}
            className="hover:text-purple-400 transition-colors p-1"
          >
            <X
              style={{
                width: "clamp(22px, 6vw, 32px)",
                height: "clamp(22px, 6vw, 32px)",
              }}
            />
          </motion.button>
        </div>

        {/* ── Dice Zone ── */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 gap-4 py-2">
          {/* Phase label */}
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {phase === "betting" && (
              <p
                className="font-bold text-white/30"
                style={{
                  fontSize: "clamp(0.6rem, 2.5vw, 0.8rem)",
                  letterSpacing: "0.15em",
                }}
              >
                Chọn vào biểu tượng vũ trụ
              </p>
            )}
            {phase === "rolling" && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="font-black text-purple-400"
                style={{
                  fontSize: "clamp(0.7rem, 3vw, 1rem)",
                  letterSpacing: "0.2em",
                }}
              >
                ⚡ Đang lắc...
              </motion.p>
            )}
          </motion.div>

          {/* Three dice */}
          <div className="flex items-center justify-center gap-3 relative">
            {[0, 1, 2].map((i) => (
              <DiceFace
                key={i}
                symbol={diceResults ? SYMBOL_MAP[diceResults[i]] : null}
                rolling={phase === "rolling"}
                delay={i * 0.18}
                revealed={revealIndex >= i}
              />
            ))}

            {/* Connector lines */}
            <div
              className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none"
              style={{
                height: 1,
                background:
                  "linear-gradient(to right, transparent, rgba(167,139,250,0.15), transparent)",
                zIndex: -1,
              }}
            />
          </div>

          {/* Result banner */}
          <AnimatePresence>
            {phase === "result" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="text-center px-8 py-4 rounded-2xl"
                style={{
                  background:
                    winAmount > 0
                      ? "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.08))"
                      : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.08))",
                  border: `1.5px solid ${winAmount > 0 ? "rgba(52,211,153,0.4)" : "rgba(239,68,68,0.4)"}`,
                  backdropFilter: "blur(12px)",
                }}
              >
                {winAmount > 0 ? (
                  <>
                    <motion.p
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="font-serif font-black text-emerald-400"
                      style={{
                        fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
                        filter: "drop-shadow(0 0 12px #10b981)",
                      }}
                    >
                      +{winAmount} 🥑
                    </motion.p>
                    <p
                      className="text-emerald-400/60 font-bold"
                      style={{
                        fontSize: "clamp(0.55rem, 2vw, 0.7rem)",
                        letterSpacing: "0.2em",
                      }}
                    >
                      VŨ TRỤ PHÙ HỘ
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      className="font-serif font-black text-red-400"
                      style={{ fontSize: "clamp(1.5rem, 6vw, 2.2rem)" }}
                    >
                      Hụt rồi!
                    </p>
                    <p
                      className="text-red-400/50 font-bold"
                      style={{
                        fontSize: "clamp(0.55rem, 2vw, 0.7rem)",
                        letterSpacing: "0.2em",
                      }}
                    >
                      CÚ chơi nữa nào
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bet Board (6 symbols grid) ── */}
        <div className="z-20 flex-shrink-0 px-4 pb-2">
          {/* Highlight winning symbols */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {SYMBOLS.map((sym) => {
              const isWinner =
                phase === "result" && winSymbols.includes(sym.key);
              const isLoser =
                phase === "result" &&
                (bets[sym.key] || 0) > 0 &&
                !winSymbols.includes(sym.key);
              return (
                <motion.div
                  key={sym.key}
                  animate={
                    isWinner
                      ? {
                          boxShadow: [
                            `0 0 0px ${sym.glow}00`,
                            `0 0 24px ${sym.glow}80`,
                            `0 0 0px ${sym.glow}00`,
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 0.8, repeat: isWinner ? 3 : 0 }}
                  className="relative"
                  style={{ opacity: isLoser ? 0.45 : 1 }}
                >
                  <div
                    className="flex items-center justify-between px-2 py-1.5 rounded-xl"
                    style={{
                      background:
                        (bets[sym.key] || 0) > 0
                          ? sym.bg
                          : "rgba(255,255,255,0.03)",
                      border: `1px solid ${(bets[sym.key] || 0) > 0 ? sym.color + "50" : "rgba(255,255,255,0.07)"}`,
                    }}
                  >
                    {/* Minus */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => removeBet(sym.key)}
                      disabled={phase !== "betting"}
                      className="font-black text-white/30 hover:text-white/60 transition-colors"
                      style={{
                        fontSize: "clamp(0.9rem, 3.5vw, 1.2rem)",
                        minWidth: "clamp(18px,5vw,28px)",
                        lineHeight: 1,
                      }}
                    >
                      −
                    </motion.button>

                    {/* Symbol chip */}
                    <BetChip
                      symbol={sym}
                      amount={bets[sym.key] || 0}
                      onClick={() => placeBet(sym.key)}
                      disabled={phase !== "betting"}
                    />

                    {/* Plus */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => placeBet(sym.key)}
                      disabled={phase !== "betting"}
                      className="font-black hover:text-white/60 transition-colors"
                      style={{
                        color: sym.color + "80",
                        fontSize: "clamp(0.9rem, 3.5vw, 1.2rem)",
                        minWidth: "clamp(18px,5vw,28px)",
                        lineHeight: 1,
                      }}
                    >
                      +
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center justify-between gap-2">
            {/* Bet unit selector */}
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {[50, 100, 500].map((v) => (
                <motion.button
                  key={v}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setBetUnit(v)}
                  className="font-black rounded-lg px-2 py-1"
                  style={{
                    fontSize: "clamp(0.5rem, 2vw, 0.65rem)",
                    background:
                      betUnit === v ? "rgba(139,92,246,0.3)" : "transparent",
                    color: betUnit === v ? "#a78bfa" : "rgba(255,255,255,0.3)",
                    border:
                      betUnit === v
                        ? "1px solid rgba(139,92,246,0.4)"
                        : "1px solid transparent",
                  }}
                >
                  {v}
                </motion.button>
              ))}
            </div>

            {/* Roll / Reset button */}
            <AnimatePresence mode="wait">
              {phase === "result" ? (
                <motion.button
                  key="reset"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  className="flex items-center gap-2 rounded-xl font-black text-white"
                  style={{
                    padding: "clamp(8px,2.5vw,14px) clamp(16px,5vw,32px)",
                    fontSize: "clamp(0.6rem, 2.5vw, 0.8rem)",
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    letterSpacing: "0.1em",
                  }}
                >
                  <RefreshCw size={14} /> Chơi lại
                </motion.button>
              ) : (
                <motion.button
                  key="roll"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={
                    totalBetCalc > 0 && phase === "betting"
                      ? { scale: 1.05 }
                      : {}
                  }
                  whileTap={
                    totalBetCalc > 0 && phase === "betting"
                      ? { scale: 0.95 }
                      : {}
                  }
                  onClick={roll}
                  disabled={totalBetCalc === 0 || phase !== "betting"}
                  className="flex items-center gap-2 rounded-xl font-black text-white relative overflow-hidden"
                  style={{
                    padding: "clamp(8px,2.5vw,14px) clamp(16px,5vw,32px)",
                    fontSize: "clamp(0.6rem, 2.5vw, 0.8rem)",
                    background:
                      totalBetCalc > 0
                        ? "linear-gradient(135deg, #7c3aed, #ec4899)"
                        : "rgba(255,255,255,0.06)",
                    color: totalBetCalc > 0 ? "white" : "rgba(255,255,255,0.3)",
                    letterSpacing: "0.1em",
                    cursor:
                      totalBetCalc === 0 || phase !== "betting"
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {/* Shimmer */}
                  {totalBetCalc > 0 && (
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  )}
                  <Zap size={14} /> Lắc Ngay
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
