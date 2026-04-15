"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapStore } from "@/stores/useMapStore";
import {
  X,
  RefreshCw,
  Shield,
  Zap,
  Sparkles,
  Orbit,
  Moon,
  Sun,
} from "lucide-react";

type CosmicType = "🌌" | "⭐" | "🌙" | "☀️" | "🪐" | "✨" | "💫" | "🌠";
type Rank =
  | "I"
  | "II"
  | "III"
  | "IV"
  | "V"
  | "VI"
  | "VII"
  | "VIII"
  | "IX"
  | "X"
  | "XI"
  | "XII"
  | "XIII";

interface Card {
  rank: Rank;
  cosmicType: CosmicType;
  value: number;
  id: string;
  celestialName: string;
}

const celestialNames: Record<Rank, string> = {
  I: "Nova",
  II: "Pulsar",
  III: "Nebula",
  IV: "Comet",
  V: "Asteroid",
  VI: "Moon",
  VII: "Planet",
  VIII: "Star",
  IX: "Supernova",
  X: "Galaxy",
  XI: "Quasar",
  XII: "Nebulon",
  XIII: "Singularity",
};

const rankValues: Record<Rank, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 10,
  XII: 10,
  XIII: 11,
};

const cosmicTypes: CosmicType[] = [
  "🌌",
  "⭐",
  "🌙",
  "☀️",
  "🪐",
  "✨",
  "💫",
  "🌠",
];
const ranks: Rank[] = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
];

const cosmicColors: Record<
  CosmicType,
  { main: string; glow: string; bgStart: string; bgEnd: string }
> = {
  "🌌": {
    main: "#8b5cf6",
    glow: "#a855f7",
    bgStart: "#1e1b4b",
    bgEnd: "#2e1065",
  },
  "⭐": {
    main: "#fbbf24",
    glow: "#fcd34d",
    bgStart: "#451a03",
    bgEnd: "#78350f",
  },
  "🌙": {
    main: "#94a3b8",
    glow: "#cbd5e1",
    bgStart: "#1e293b",
    bgEnd: "#0f172a",
  },
  "☀️": {
    main: "#f97316",
    glow: "#fb923c",
    bgStart: "#431407",
    bgEnd: "#7c2d12",
  },
  "🪐": {
    main: "#d946ef",
    glow: "#e879f9",
    bgStart: "#4a044e",
    bgEnd: "#701a75",
  },
  "✨": {
    main: "#34d399",
    glow: "#6ee7b7",
    bgStart: "#064e3b",
    bgEnd: "#047857",
  },
  "💫": {
    main: "#60a5fa",
    glow: "#93c5fd",
    bgStart: "#172554",
    bgEnd: "#1e3a8a",
  },
  "🌠": {
    main: "#f472b6",
    glow: "#f9a8d4",
    bgStart: "#4c0519",
    bgEnd: "#831843",
  },
};

const starPositions = Array.from({ length: 40 }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  opacity: 0.3 + Math.random() * 0.5,
  duration: 2 + Math.random() * 3,
}));

const warpRings = Array.from({ length: 6 }, (_, i) => ({
  scale: 1 + i * 2.5,
  delay: i * 0.08,
  size: 40 + i * 20,
}));

const createShuffledDeck = (): Card[] => {
  const deck: Card[] = [];
  cosmicTypes.forEach((cosmicType) => {
    ranks.forEach((rank) => {
      deck.push({
        rank,
        cosmicType,
        value: rankValues[rank],
        id: crypto.randomUUID(),
        celestialName: celestialNames[rank],
      });
    });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const calculateHandValue = (cards: Card[]): number => {
  let sum = cards.reduce((acc, card) => acc + card.value, 0);
  let aces = cards.filter((c) => c.rank === "XIII").length;
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
};

const WarpRipple = ({ win }: { win: boolean }) => (
  <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center overflow-hidden">
    {warpRings.map((ring, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: ring.scale, opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.2, delay: ring.delay, ease: "easeOut" }}
        className="absolute rounded-full border-2"
        style={{
          width: ring.size,
          height: ring.size,
          borderColor: win
            ? `rgba(168,85,247,${0.8 - i * 0.1})`
            : `rgba(239,68,68,${0.8 - i * 0.1})`,
        }}
      />
    ))}
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.5, 0], opacity: [0, 0.4, 0] }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`absolute w-32 h-32 rounded-full blur-2xl ${win ? "bg-purple-500" : "bg-red-600"}`}
    />
  </div>
);

export const BlackjackPopup = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { avocados } = useMapStore();
  const [betAmount, setBetAmount] = useState(100);
  const [currentBet, setCurrentBet] = useState(100);
  const [turn, setTurn] = useState<"player" | "dealer" | null>(null);
  const [showWarp, setShowWarp] = useState<{ active: boolean; win: boolean }>({
    active: false,
    win: false,
  });

  const [gameState, setGameState] = useState<{
    isActive: boolean;
    playerHand: Card[];
    dealerHand: Card[];
    deck: Card[];
    result: "win" | "lose" | "draw" | null;
    dealerStayed: boolean;
    playerStayed: boolean;
  }>({
    isActive: false,
    playerHand: [],
    dealerHand: [],
    deck: [],
    result: null,
    dealerStayed: false,
    playerStayed: false,
  });

  const pScore = useMemo(
    () => calculateHandValue(gameState.playerHand),
    [gameState.playerHand],
  );
  const dScore = useMemo(
    () => calculateHandValue(gameState.dealerHand),
    [gameState.dealerHand],
  );

  const finalizeGame = useCallback(
    (pHand: Card[], dHand: Card[], finalBet: number) => {
      const ps = calculateHandValue(pHand);
      const ds = calculateHandValue(dHand);
      let result: "win" | "lose" | "draw";
      let winMult = 0;
      if (ps > 21) {
        result = "lose";
      } else if (ds > 21 || ps > ds) {
        result = "win";
        winMult = 2;
      } else if (ps < ds) {
        result = "lose";
      } else {
        result = "draw";
        winMult = 1;
      }
      if (winMult > 0)
        useMapStore.setState((s) => ({
          avocados: s.avocados + finalBet * winMult,
        }));
      setGameState((s) => ({ ...s, isActive: false, result }));
      setTurn(null);
      setShowWarp({ active: true, win: result !== "lose" });
      setTimeout(() => setShowWarp({ active: false, win: false }), 1500);
    },
    [],
  );

  const startRound = () => {
    if (avocados < betAmount) return;
    const newDeck = createShuffledDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!];
    setCurrentBet(betAmount);
    useMapStore.setState((s) => ({ avocados: s.avocados - betAmount }));
    setGameState({
      isActive: true,
      playerHand: pHand,
      dealerHand: dHand,
      deck: newDeck,
      result: null,
      dealerStayed: false,
      playerStayed: false,
    });
    setTurn("player");
  };

  useEffect(() => {
    if (turn !== "dealer" || !gameState.isActive || gameState.dealerStayed)
      return;
    const timer = setTimeout(() => {
      const dealerScore = calculateHandValue(gameState.dealerHand);
      const playerScore = calculateHandValue(gameState.playerHand);
      const shouldHit =
        dealerScore < 17 ||
        (dealerScore < playerScore && playerScore <= 21 && Math.random() < 0.6);
      if (shouldHit) {
        const nextDeck = [...gameState.deck];
        const newCard = nextDeck.pop();
        if (!newCard) return;
        const newHand = [...gameState.dealerHand, newCard];
        setGameState((s) => ({ ...s, dealerHand: newHand, deck: nextDeck }));
        if (calculateHandValue(newHand) > 21)
          finalizeGame(gameState.playerHand, newHand, currentBet);
        else setTurn(gameState.playerStayed ? "dealer" : "player");
      } else {
        setGameState((s) => ({ ...s, dealerStayed: true }));
        if (gameState.playerStayed)
          finalizeGame(gameState.playerHand, gameState.dealerHand, currentBet);
        else setTurn("player");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [turn, gameState, finalizeGame, currentBet]);

  const handlePlayerHit = () => {
    if (turn !== "player" || gameState.playerStayed) return;
    const nextDeck = [...gameState.deck];
    const newCard = nextDeck.pop();
    if (!newCard) return;
    const newHand = [...gameState.playerHand, newCard];
    setGameState((s) => ({ ...s, playerHand: newHand, deck: nextDeck }));
    if (calculateHandValue(newHand) > 21)
      finalizeGame(newHand, gameState.dealerHand, currentBet);
    else setTurn(gameState.dealerStayed ? "player" : "dealer");
  };

  const handleDouble = () => {
    if (
      turn !== "player" ||
      avocados < currentBet ||
      gameState.playerHand.length !== 2
    )
      return;
    useMapStore.setState((s) => ({ avocados: s.avocados - currentBet }));
    const finalBet = currentBet * 2;
    setCurrentBet(finalBet);
    const nextDeck = [...gameState.deck];
    const newCard = nextDeck.pop();
    if (!newCard) return;
    const newHand = [...gameState.playerHand, newCard];
    setGameState((s) => ({
      ...s,
      playerHand: newHand,
      deck: nextDeck,
      playerStayed: true,
    }));
    if (calculateHandValue(newHand) > 21)
      finalizeGame(newHand, gameState.dealerHand, finalBet);
    else setTurn("dealer");
  };

  const handlePlayerStay = () => {
    if (turn !== "player") return;
    setGameState((s) => ({ ...s, playerStayed: true }));
    if (gameState.dealerStayed)
      finalizeGame(gameState.playerHand, gameState.dealerHand, currentBet);
    else setTurn("dealer");
  };

  const resetRound = () => {
    setGameState((s) => ({
      ...s,
      result: null,
      playerHand: [],
      dealerHand: [],
    }));
    setShowWarp({ active: false, win: false });
  };

  if (!isOpen) return null;

  const resultConfig = {
    win: {
      label: "WIN",
      color: "text-emerald-400",
      border: "border-emerald-500/50",
    },
    draw: {
      label: "DRAW",
      color: "text-purple-400",
      border: "border-purple-500/50",
    },
    lose: { label: "LOSE", color: "text-red-400", border: "border-red-500/50" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 overflow-hidden"
    >
      {/* ── Outer shell: full-screen, no padding, safe-area aware ── */}
      <div
        className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden"
        style={{
          padding:
            "env(safe-area-inset-top, 8px) env(safe-area-inset-right, 8px) env(safe-area-inset-bottom, 8px) env(safe-area-inset-left, 8px)",
        }}
      >
        {/* Cosmic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2a] via-[#1a0a2e] to-[#0a0a1a]" />
          {starPositions.map((pos, i) => (
            <motion.div
              key={i}
              className="absolute w-[2px] h-[2px] bg-white rounded-full"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                opacity: pos.opacity,
              }}
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.5, 1] }}
              transition={{
                duration: pos.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          <motion.div
            className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl"
            animate={{ rotate: -360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Warp Ripple */}
        <AnimatePresence>
          {showWarp.active && <WarpRipple win={showWarp.win} />}
        </AnimatePresence>

        <AnimatePresence>
          {gameState.result && (
            <motion.div
              // Animation xuất hiện từ dưới nhẹ nhàng bay lên
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              // Căn giữa ngang (left-1/2 -translate-x-1/2)
              // Căn vị trí dọc ở mức 35% từ trên xuống (top-[35%])
              className={`absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 
                  z-50 pointer-events-none 
                  flex flex-col items-center justify-center
                  w-fit min-w-[200px] px-10 py-5 rounded-3xl border-2
                  bg-black/80 backdrop-blur-2xl 
                  shadow-[0_0_60px_rgba(0,0,0,0.6)]
                  ${resultConfig[gameState.result].border}`}
            >
              <motion.span
                // Hiệu ứng nhịp thở cho chữ kết quả
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`font-serif font-black tracking-[0.25em] ${resultConfig[gameState.result].color}`}
                style={{
                  fontSize: "clamp(2.5rem, 10vw, 4.5rem)",
                  filter: "drop-shadow(0 0 20px currentColor)",
                }}
              >
                {resultConfig[gameState.result].label}
              </motion.span>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-2" />

              <span className="text-white/50 text-[10px] uppercase tracking-[0.3em] font-light">
                Trận đấu kết thúc
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HEADER ── */}
        <div className="w-full flex justify-between items-center z-20 px-5 pt-5 flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            <div className="bg-purple-950/30 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/30">
              <span
                className="text-purple-400 font-black flex items-center gap-1"
                style={{ fontSize: "clamp(0.75rem, 3vw, 1rem)" }}
              >
                <Sparkles size={12} />
                {avocados.toLocaleString()} 🥑
              </span>
            </div>
            {gameState.isActive && (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-purple-500 font-bold ml-2"
                style={{ fontSize: "clamp(0.55rem, 2vw, 0.7rem)" }}
              >
                Đặt: {currentBet}
              </motion.span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-purple-800 hover:text-purple-400 transition-all p-1"
          >
            <X
              style={{
                width: "clamp(24px, 6vw, 36px)",
                height: "clamp(24px, 6vw, 36px)",
              }}
            />
          </motion.button>
        </div>

        {/* ── DEALER HAND ── */}
        <motion.div
          animate={{
            scale: turn === "player" ? 0.8 : 0.9,
            opacity: turn === "player" ? 0.7 : 1,
          }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex items-center justify-center z-10 w-full min-h-0"
        >
          <div
            className="relative flex justify-center items-center w-full"
            style={{ height: "clamp(100px, 22vh, 220px)" }}
          >
            <AnimatePresence mode="popLayout">
              {gameState.dealerHand.map((card, i) => (
                <CardItem
                  key={card.id}
                  card={card}
                  index={i}
                  totalCards={gameState.dealerHand.length}
                  isDealer
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── CENTER HUB ── */}
        <div
          className="w-full flex justify-between items-center z-30 flex-shrink-0 px-10"
          style={{ height: "clamp(100px, 18vh, 176px)" }}
        >
          {/* Double btn */}
          <div
            style={{ width: "clamp(52px, 14vw, 96px)" }}
            className="flex justify-center"
          >
            {gameState.isActive &&
              gameState.playerHand.length === 2 &&
              !gameState.playerStayed && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={handleDouble}
                  className="flex flex-col items-center rounded-xl border border-purple-500/40 bg-purple-500/10 backdrop-blur-sm text-purple-400 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all"
                  style={{ padding: "clamp(6px,2vw,16px)" }}
                >
                  <Orbit
                    style={{
                      width: "clamp(16px,4vw,28px)",
                      height: "clamp(16px,4vw,28px)",
                    }}
                  />
                  <span
                    className="font-black mt-0.5 text-center leading-tight"
                    style={{ fontSize: "clamp(0.45rem, 1.8vw, 0.65rem)" }}
                  >
                    NHÂN ĐÔI
                  </span>
                </motion.button>
              )}
          </div>

          {/* Score hub - Tinh chỉnh nhỏ gọn */}
          <div
            className="relative flex flex-col items-center bg-black/40 rounded-xl backdrop-blur-xl border border-white/10"
            // Giảm padding: Min từ 8px -> 6px, Max từ 16px -> 12px
            style={{
              padding: "clamp(6px, 2vw, 12px) clamp(10px, 2.5vw, 16px)",
            }}
          >
            {/* Các vòng tròn orbit - Giảm độ âm (inset) để thu sát vào hub */}
            <motion.div
              className="absolute -inset-2 rounded-full border border-purple-500/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-4 rounded-full border border-blue-500/10"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />

            {/* Icon Moon - Thu nhỏ container và icon */}
            <div
              className="absolute -top-2 -right-2 rounded-full bg-purple-500/20 flex items-center justify-center backdrop-blur-sm"
              style={{
                width: "clamp(20px, 4vw, 32px)",
                height: "clamp(20px, 4vw, 32px)",
              }}
            >
              <Moon
                style={{
                  width: "clamp(8px, 2vw, 12px)",
                  height: "clamp(8px, 2vw, 12px)",
                }}
                className="text-purple-400"
              />
            </div>

            {/* Dealer score - Giảm font size */}
            <motion.span
              animate={{
                textShadow:
                  turn === "dealer"
                    ? ["0 0 8px #a855f7", "0 0 16px #a855f7", "0 0 8px #a855f7"]
                    : "none",
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className={`font-serif font-black ${turn === "dealer" ? "text-purple-400" : "text-zinc-600"}`}
              // Cũ: 1.25rem - 2.25rem -> Mới: 1rem - 1.5rem
              style={{ fontSize: "clamp(1rem, 3vw, 1.5rem)", lineHeight: 1 }}
            >
              {dScore}
            </motion.span>

            {/* Đường kẻ ngăn cách - Thu hẹp width */}
            <div className="h-px w-6 bg-gradient-to-r from-transparent via-purple-500 to-transparent my-1" />

            {/* Player score - Giảm font size */}
            <motion.span
              animate={{
                textShadow:
                  turn === "player"
                    ? ["0 0 8px #fbbf24", "0 0 16px #fbbf24", "0 0 8px #fbbf24"]
                    : "none",
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className={`font-serif font-black ${turn === "player" ? "text-amber-400" : "text-zinc-500"}`}
              // Cũ: 2rem - 3.75rem -> Mới: 1.5rem - 2.5rem
              style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", lineHeight: 1 }}
            >
              {pScore}
            </motion.span>

            {/* Icon Sun - Thu nhỏ container và icon */}
            <div
              className="absolute -bottom-2 -left-2 rounded-full bg-amber-500/20 flex items-center justify-center backdrop-blur-sm"
              style={{
                width: "clamp(20px, 4vw, 32px)",
                height: "clamp(20px, 4vw, 32px)",
              }}
            >
              <Sun
                style={{
                  width: "clamp(8px, 2vw, 12px)",
                  height: "clamp(8px, 2vw, 12px)",
                }}
                className="text-amber-400"
              />
            </div>
          </div>

          {/* Hit card */}
          <div
            style={{ width: "clamp(52px, 14vw, 96px)" }}
            className="flex justify-center"
          >
            <motion.div
              whileHover={turn === "player" ? { scale: 1.08 } : {}}
              whileTap={turn === "player" ? { scale: 0.95 } : {}}
              onClick={handlePlayerHit}
              className={`cursor-pointer ${turn !== "player" || gameState.playerStayed ? "opacity-20 pointer-events-none" : ""}`}
              style={{
                width: "clamp(44px,12vw,96px)",
                height: "clamp(64px,16vw,144px)",
              }}
            >
              <motion.div
                animate={
                  turn === "player"
                    ? {
                        boxShadow: [
                          "0 0 8px rgba(139,92,246,0.3)",
                          "0 0 24px rgba(139,92,246,0.6)",
                          "0 0 8px rgba(139,92,246,0.3)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-full h-full bg-gradient-to-br from-purple-900/50 to-indigo-950/50 border-2 border-purple-500 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm"
              >
                <Zap
                  style={{
                    width: "clamp(14px,3.5vw,24px)",
                    height: "clamp(14px,3.5vw,24px)",
                  }}
                  className="text-purple-400"
                />
                <span
                  className="text-purple-400 font-black mt-0.5 text-center leading-tight"
                  style={{ fontSize: "clamp(0.45rem, 1.8vw, 0.65rem)" }}
                >
                  RÚT THẺ
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* ── PLAYER HAND ── */}
        <motion.div
          animate={{
            scale: turn === "dealer" ? 0.8 : 0.9,
            opacity: turn === "dealer" ? 0.7 : 1,
          }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex items-center justify-center z-10 w-full min-h-0"
        >
          <div
            className="relative flex justify-center items-center w-full"
            style={{ height: "clamp(100px, 22vh, 220px)" }}
          >
            <AnimatePresence mode="popLayout">
              {gameState.playerHand.map((card, i) => (
                <CardItem
                  key={card.id}
                  card={card}
                  index={i}
                  totalCards={gameState.playerHand.length}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── BOTTOM BAR ── */}
        <div className="w-full flex justify-center items-center z-20 flex-shrink-0 px-5 pb-2 gap-2">
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!gameState.isActive ? (
              /* Bet controls */
              <div
                className="flex items-center gap-2 bg-purple-950/30 backdrop-blur-md rounded-2xl border border-purple-500/30"
                style={{
                  padding: "clamp(4px,1.5vw,8px) clamp(8px,2.5vw,16px)",
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setBetAmount((b) => Math.max(100, b - 100))}
                  className="text-purple-600 hover:text-purple-300 font-bold"
                  style={{ fontSize: "clamp(1rem, 4vw, 1.5rem)" }}
                >
                  −
                </motion.button>
                <span
                  className="font-serif font-black text-purple-400 text-center"
                  style={{
                    fontSize: "clamp(1rem, 4vw, 1.875rem)",
                    minWidth: "clamp(36px,10vw,64px)",
                  }}
                >
                  {betAmount}
                </span>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setBetAmount((b) => b + 100)}
                  className="text-purple-600 hover:text-purple-300 font-bold"
                  style={{ fontSize: "clamp(1rem, 4vw, 1.5rem)" }}
                >
                  +
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startRound}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-lg uppercase ml-1"
                  style={{
                    padding: "clamp(4px,1.5vw,8px) clamp(10px,3vw,28px)",
                    fontSize: "clamp(0.55rem, 2vw, 0.75rem)",
                  }}
                >
                  Bắt đầu
                </motion.button>
              </div>
            ) : (
              /* Stay button */
              <motion.button
                whileHover={turn === "player" ? { scale: 1.1 } : {}}
                whileTap={turn === "player" ? { scale: 0.95 } : {}}
                disabled={turn !== "player" || gameState.playerStayed}
                onClick={handlePlayerStay}
                className={`flex flex-col items-center gap-0.5 ${turn !== "player" ? "opacity-30" : ""}`}
              >
                <div
                  className="rounded-full border-2 border-blue-500/40 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm"
                  style={{
                    width: "clamp(40px,10vw,64px)",
                    height: "clamp(40px,10vw,64px)",
                  }}
                >
                  <Shield
                    style={{
                      width: "clamp(18px,5vw,32px)",
                      height: "clamp(18px,5vw,32px)",
                    }}
                    className="text-blue-400"
                  />
                </div>
                <span
                  className="font-black text-blue-400"
                  style={{ fontSize: "clamp(0.45rem, 1.8vw, 0.6rem)" }}
                >
                  HOLD
                </span>
              </motion.button>
            )}

            {gameState.result && (
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={resetRound}
                className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                style={{ padding: "clamp(8px,2.5vw,16px)" }}
              >
                <RefreshCw
                  style={{
                    width: "clamp(16px,4vw,24px)",
                    height: "clamp(16px,4vw,24px)",
                  }}
                />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── CardItem ──
const CardItem = ({
  card,
  index,
  totalCards,
  isDealer,
}: {
  card: Card;
  index: number;
  totalCards: number;
  isDealer?: boolean;
}) => {
  const colors = cosmicColors[card.cosmicType];

  // Responsive card size & spread via CSS custom props — no window.innerWidth needed
  // We use vw-based values; clamp keeps them sane on all screens
  const cardW = "clamp(64px, 16vw, 160px)";
  const cardH = "clamp(92px, 23vw, 224px)";
  const step =
    typeof window !== "undefined" ? Math.min(window.innerWidth * 0.09, 70) : 50;

  const offsetX = (index - (totalCards - 1) / 2) * step;
  const rotateZ = (index - (totalCards - 1) / 2) * 4;

  const particles = useMemo(() => {
    const seed = card.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rnd = (n: number) => {
      const x = Math.sin(seed + n) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: 3 }, (_, i) => ({
      startX: rnd(i * 10) * 100,
      startY: rnd(i * 10 + 1) * 100,
      endX: rnd(i * 10 + 2) * 100,
      endY: rnd(i * 10 + 3) * 100,
      duration: 2 + rnd(i * 10 + 4) * 3,
      delay: rnd(i * 10 + 5) * 2,
    }));
  }, [card.id]);

  return (
    <motion.div
      layout
      initial={{
        x: 600,
        y: isDealer ? -400 : 400,
        opacity: 0,
        rotate: 90,
        scale: 0.8,
      }}
      animate={{ x: offsetX, y: 0, rotate: rotateZ, opacity: 1, scale: 1 }}
      exit={{
        x: -600,
        opacity: 0,
        rotate: -90,
        scale: 0.8,
        transition: { duration: 0.3, ease: "easeIn" },
      }}
      transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.8 }}
      whileHover={{
        y: -12,
        rotate: 0,
        scale: 1.05,
        zIndex: 100,
        transition: { duration: 0.2 },
      }}
      className="absolute rounded-2xl shadow-2xl overflow-hidden cursor-pointer will-change-transform"
      style={{
        width: cardW,
        height: cardH,
        zIndex: index,
        background: `radial-gradient(ellipse at 30% 40%, ${colors.bgStart}, ${colors.bgEnd})`,
        border: `1px solid ${colors.main}40`,
        boxShadow: `0 0 30px ${colors.glow}20, 0 8px 16px rgba(0,0,0,0.3)`,
      }}
    >
      <div
        className="w-full h-full flex flex-col justify-between relative"
        style={{ padding: "clamp(6px,2vw,20px)" }}
      >
        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ backgroundColor: colors.main }}
              animate={{
                x: [p.startX, p.endX],
                y: [p.startY, p.endY],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Top row */}
        <div className="flex justify-between items-start relative z-10">
          <span
            className="font-bold leading-none"
            style={{
              color: colors.main,
              fontSize: "clamp(0.75rem, 3.5vw, 1.875rem)",
            }}
          >
            {card.rank}
          </span>
          <span
            style={{
              fontSize: "clamp(1rem, 4.5vw, 2.5rem)",
              filter: `drop-shadow(0 0 3px ${colors.glow})`,
            }}
          >
            {card.cosmicType}
          </span>
        </div>

        {/* Center name */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-1 pointer-events-none">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="font-serif tracking-wider"
            style={{
              color: colors.main,
              fontSize: "clamp(0.45rem, 1.8vw, 0.75rem)",
            }}
          >
            {card.celestialName}
          </motion.div>
        </div>

        {/* Bg watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="select-none font-serif opacity-[0.06]"
            style={{ fontSize: "clamp(2.5rem, 10vw, 5rem)" }}
          >
            {card.cosmicType}
          </span>
        </div>

        {/* Bottom row (rotated) */}
        <div className="flex justify-between items-end rotate-180 relative z-10">
          <span
            className="font-bold leading-none"
            style={{
              color: colors.main,
              fontSize: "clamp(0.75rem, 3.5vw, 1.875rem)",
            }}
          >
            {card.rank}
          </span>
          <span
            style={{
              fontSize: "clamp(1rem, 4.5vw, 2.5rem)",
              filter: `drop-shadow(0 0 3px ${colors.glow})`,
            }}
          >
            {card.cosmicType}
          </span>
        </div>

        {/* Corner dots */}
        <span
          className="absolute bottom-1 left-1 opacity-40 text-white"
          style={{ fontSize: 8 }}
        >
          ✦
        </span>
        <span
          className="absolute top-1 left-1 opacity-40 text-white"
          style={{ fontSize: 8 }}
        >
          ✧
        </span>

        {/* Hover glow overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit] opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: `inset 0 0 20px ${colors.glow}, 0 0 15px ${colors.glow}`,
          }}
        />
      </div>
    </motion.div>
  );
};
