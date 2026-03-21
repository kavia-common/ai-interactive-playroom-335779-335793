import { create } from "zustand";
import type { Difficulty, GameStats, GameStatus, Toast } from "../game/types";
import { createNewGrid, floodReveal, difficultyToSize } from "../game/logic";
import type { Cell } from "../game/types";

type Overlay =
  | { type: "none" }
  | { type: "help" }
  | { type: "settings" }
  | { type: "result"; result: "won" | "lost" };

type GameState = {
  difficulty: Difficulty;
  status: GameStatus;
  grid: Cell[];
  revealedSafe: number;
  stats: GameStats;

  overlay: Overlay;
  toasts: Toast[];

  apiHealth: "unknown" | "ok" | "error";
  wsStatus: "disconnected" | "connecting" | "connected" | "error";

  // actions
  newGame: (difficulty?: Difficulty) => void;
  reveal: (x: number, y: number) => void;
  setOverlay: (overlay: Overlay) => void;

  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;

  setApiHealth: (h: GameState["apiHealth"]) => void;
  setWsStatus: (s: GameState["wsStatus"]) => void;
};

function toastId() {
  return `t-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function countSafeTotal(difficulty: Difficulty) {
  const { w, h, hazards } = difficultyToSize(difficulty);
  return w * h - hazards;
}

// PUBLIC_INTERFACE
export const useGameStore = create<GameState>((set, get) => ({
  difficulty: "normal",
  status: "idle",
  grid: createNewGrid("normal"),
  revealedSafe: 0,
  stats: { moves: 0, startedAt: null, finishedAt: null },

  overlay: { type: "none" },
  toasts: [],

  apiHealth: "unknown",
  wsStatus: "disconnected",

  newGame: (difficulty) => {
    const d = difficulty ?? get().difficulty;
    set({
      difficulty: d,
      status: "playing",
      grid: createNewGrid(d),
      revealedSafe: 0,
      stats: { moves: 0, startedAt: Date.now(), finishedAt: null },
      overlay: { type: "none" },
    });
  },

  reveal: (x, y) => {
    const { status, grid, difficulty } = get();
    if (status !== "playing") return;

    const cell = grid.find((c) => c.x === x && c.y === y);
    if (!cell || cell.revealed) return;

    // If hazard -> lose immediately.
    if (cell.hazard) {
      set((s) => ({
        grid: s.grid.map((c) => (c.x === x && c.y === y ? { ...c, revealed: true } : c)),
        status: "lost",
        overlay: { type: "result", result: "lost" },
        stats: { ...s.stats, finishedAt: Date.now(), moves: s.stats.moves + 1 },
      }));
      return;
    }

    const { next, revealedCountDelta } = floodReveal(grid, x, y, difficulty);
    set((s) => {
      const newRevealedSafe = s.revealedSafe + revealedCountDelta;
      const safeTotal = countSafeTotal(difficulty);
      const won = newRevealedSafe >= safeTotal;

      return {
        grid: next,
        revealedSafe: newRevealedSafe,
        status: won ? "won" : s.status,
        overlay: won ? { type: "result", result: "won" } : s.overlay,
        stats: {
          ...s.stats,
          moves: s.stats.moves + 1,
          finishedAt: won ? Date.now() : s.stats.finishedAt,
        },
      };
    });
  },

  setOverlay: (overlay) => set({ overlay }),

  pushToast: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: toastId() }],
    })),

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setApiHealth: (h) => set({ apiHealth: h }),
  setWsStatus: (s) => set({ wsStatus: s }),
}));
