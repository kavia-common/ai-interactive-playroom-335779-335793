import React from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../state/useGameStore";

function Card({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-[min(92vw,520px)] rounded-2xl border bg-white p-5 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="text-lg font-semibold text-brand-text">{title}</div>
      <div className="mt-3 text-sm text-brand-muted">{children}</div>
      <div className="mt-5 flex justify-end gap-2">{actions}</div>
    </motion.div>
  );
}

export default function OverlayLayer() {
  const overlay = useGameStore((s) => s.overlay);
  const setOverlay = useGameStore((s) => s.setOverlay);
  const newGame = useGameStore((s) => s.newGame);

  const close = () => setOverlay({ type: "none" });

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        // click outside closes
        if (e.target === e.currentTarget) close();
      }}
    >
      {overlay.type === "help" ? (
        <Card
          title="How to play"
          actions={
            <button
              type="button"
              onClick={close}
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Got it
            </button>
          }
        >
          Reveal tiles to uncover safe areas. If you reveal a hazard, you lose.
          Numbers indicate how many hazards are adjacent. Clearing all safe tiles
          wins the round.
        </Card>
      ) : overlay.type === "settings" ? (
        <Card
          title="Settings"
          actions={
            <>
              <button
                type="button"
                onClick={close}
                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-brand-text hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  newGame();
                  close();
                }}
                className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                Restart
              </button>
            </>
          }
        >
          Difficulty and gameplay controls are in the sidebar. (This overlay is
          here to demonstrate animated dialogs per the UI plan.)
        </Card>
      ) : overlay.type === "result" ? (
        <Card
          title={overlay.result === "won" ? "You won!" : "You lost"}
          actions={
            <>
              <button
                type="button"
                onClick={close}
                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-brand-text hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  newGame();
                  close();
                }}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Play again
              </button>
            </>
          }
        >
          {overlay.result === "won"
            ? "Great job clearing the board."
            : "Try a different approach (or reduce difficulty)."}
        </Card>
      ) : null}
    </motion.div>
  );
}
