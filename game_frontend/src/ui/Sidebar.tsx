import React from "react";
import { useGameStore } from "../state/useGameStore";
import type { Difficulty } from "../game/types";

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

export default function Sidebar() {
  const difficulty = useGameStore((s) => s.difficulty);
  const status = useGameStore((s) => s.status);
  const stats = useGameStore((s) => s.stats);
  const revealedSafe = useGameStore((s) => s.revealedSafe);
  const newGame = useGameStore((s) => s.newGame);
  const setOverlay = useGameStore((s) => s.setOverlay);

  const elapsed =
    stats.startedAt && !stats.finishedAt
      ? Date.now() - stats.startedAt
      : stats.startedAt && stats.finishedAt
        ? stats.finishedAt - stats.startedAt
        : 0;

  const onDifficulty = (d: Difficulty) => {
    newGame(d);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <div className="text-sm font-semibold text-brand-text">Controls</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => newGame()}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            New Game
          </button>
          <button
            type="button"
            onClick={() => setOverlay({ type: "help" })}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-brand-text hover:bg-slate-50"
          >
            Help
          </button>
          <button
            type="button"
            onClick={() => setOverlay({ type: "settings" })}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-brand-text hover:bg-slate-50"
          >
            Settings
          </button>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-brand-text">Difficulty</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDifficulty(d)}
              className={[
                "rounded-xl px-3 py-2 text-sm font-semibold",
                d === difficulty
                  ? "bg-cyan-600 text-white"
                  : "border bg-white text-brand-text hover:bg-slate-50",
              ].join(" ")}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-3">
        <div className="text-sm font-semibold text-brand-text">Stats</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="text-brand-muted">Status</div>
          <div className="font-semibold text-brand-text">{status}</div>

          <div className="text-brand-muted">Moves</div>
          <div className="font-semibold text-brand-text">{stats.moves}</div>

          <div className="text-brand-muted">Revealed</div>
          <div className="font-semibold text-brand-text">{revealedSafe}</div>

          <div className="text-brand-muted">Time</div>
          <div className="font-semibold text-brand-text">{formatMs(elapsed)}</div>
        </div>
      </div>

      <div className="mt-auto text-xs leading-relaxed text-brand-muted">
        This is a fully client-side game UI with optional backend health + websocket
        wiring via <code>VITE_API_BASE</code> and <code>VITE_WS_URL</code>.
      </div>
    </div>
  );
}
