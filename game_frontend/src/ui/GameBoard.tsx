import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../state/useGameStore";
import { difficultyToSize } from "../game/logic";

function hintColor(hint: number) {
  if (hint === 0) return "text-slate-400";
  if (hint <= 2) return "text-blue-700";
  if (hint <= 4) return "text-cyan-700";
  return "text-red-700";
}

export default function GameBoard() {
  const grid = useGameStore((s) => s.grid);
  const difficulty = useGameStore((s) => s.difficulty);
  const status = useGameStore((s) => s.status);
  const reveal = useGameStore((s) => s.reveal);

  const { w, h } = useMemo(() => difficultyToSize(difficulty), [difficulty]);

  const colsClass = useMemo(() => {
    // Tailwind requires static class names; we use inline gridTemplateColumns instead.
    return "";
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-brand-muted">
          Status:{" "}
          <span className="font-medium text-brand-text">{status.toUpperCase()}</span>
        </div>
        <div className="text-xs text-brand-muted">Tap tiles to reveal safe zones.</div>
      </div>

      <div className="rounded-xl bg-gradient-to-b from-blue-50 to-white p-3">
        <div
          className={colsClass}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${w}, minmax(0, 1fr))`,
            gap: "10px",
          }}
        >
          {Array.from({ length: w * h }).map((_, idx) => {
            const cell = grid[idx];
            const revealed = cell?.revealed;

            return (
              <motion.button
                key={cell?.id ?? idx}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => reveal(cell.x, cell.y)}
                disabled={status !== "playing" || revealed}
                className={[
                  "relative aspect-square rounded-xl border text-center",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                  revealed
                    ? cell.hazard
                      ? "border-red-200 bg-red-50"
                      : "border-slate-200 bg-white"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100",
                  status !== "playing" ? "cursor-default" : "cursor-pointer",
                ].join(" ")}
                aria-label={`Cell ${cell.x},${cell.y}`}
              >
                {revealed ? (
                  cell.hazard ? (
                    <span className="absolute inset-0 grid place-items-center text-lg">
                      ⛔
                    </span>
                  ) : (
                    <span
                      className={[
                        "absolute inset-0 grid place-items-center text-sm font-semibold",
                        hintColor(cell.hint),
                      ].join(" ")}
                    >
                      {cell.hint === 0 ? "" : cell.hint}
                    </span>
                  )
                ) : null}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
