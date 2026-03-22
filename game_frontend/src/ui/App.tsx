import React, { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getEnv } from "../config/env";
import { apiGet } from "../api/httpClient";
import { emitGameEvent, interactAI } from "../api/backend";
import { useGameStore } from "../state/useGameStore";
import GameBoard from "./GameBoard";
import Sidebar from "./Sidebar";
import OverlayLayer from "./OverlayLayer";
import ToastStack from "./ToastStack";

function useBackendWiring() {
  const setApiHealth = useGameStore((s) => s.setApiHealth);
  const setWsStatus = useGameStore((s) => s.setWsStatus);
  const pushToast = useGameStore((s) => s.pushToast);

  const reveal = useGameStore((s) => s.reveal);

  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { healthcheckPath } = getEnv();
        await apiGet(healthcheckPath);
        if (!cancelled) setApiHealth("ok");
      } catch {
        if (!cancelled) setApiHealth("error");
      }
    })();

    // SSE stream: backend exposes GET /api/events/stream
    const { apiBase, ssePath } = getEnv();
    try {
      setWsStatus("connecting");
      const es = new EventSource(`${apiBase}${ssePath}`);
      sseRef.current = es;

      es.onopen = () => {
        setWsStatus("connected");
      };

      // Backend emits SSE event name "game_event"
      es.addEventListener("game_event", (evt) => {
        const data = (evt as MessageEvent).data;
        try {
          const parsed = JSON.parse(String(data));
          const type = parsed?.type ? String(parsed.type) : "EVENT";
          pushToast({
            type: "info",
            title: `Event: ${type}`,
            message: String(parsed?.payload ? JSON.stringify(parsed.payload) : data).slice(0, 160),
          });
        } catch {
          pushToast({ type: "info", title: "Event", message: String(data).slice(0, 160) });
        }
      });

      es.onerror = () => {
        setWsStatus("error");
      };
    } catch {
      setWsStatus("error");
    }

    return () => {
      cancelled = true;
      sseRef.current?.close();
      sseRef.current = null;
      setWsStatus("disconnected");
    };
  }, [pushToast, setApiHealth, setWsStatus]);

  return {
    reconnectStream: () => {
      // Simple reconnect: close and let effect re-run by forcing status change + recreating ES.
      sseRef.current?.close();
      sseRef.current = null;
      setWsStatus("disconnected");
      // Best-effort "poke" by setting connecting; user can click multiple times.
      setWsStatus("connecting");
      const { apiBase, ssePath } = getEnv();
      const es = new EventSource(`${apiBase}${ssePath}`);
      sseRef.current = es;
      es.onopen = () => setWsStatus("connected");
      es.addEventListener("game_event", (evt) => {
        const data = (evt as MessageEvent).data;
        pushToast({ type: "info", title: "Event", message: String(data).slice(0, 160) });
      });
      es.onerror = () => setWsStatus("error");
    },

    /**
     * Wrap reveal so we can emit an event + fetch an AI reply after a move.
     * This keeps integration minimal and does not change the existing game logic.
     */
    revealWithBackend: async (x: number, y: number) => {
      reveal(x, y);

      // Emit move event (non-blocking)
      void emitGameEvent({
        type: "PLAYER_REVEAL",
        payload: { x, y },
      }).catch(() => {
        // Ignore; backend may be down.
      });

      // Ask AI for a tiny narration (non-blocking)
      void interactAI({
        prompt: `Player revealed tile at (${x}, ${y}).`,
        mode: "narrate",
      })
        .then((resp) => {
          pushToast({
            type: "info",
            title: "AI",
            message: resp.result.reply.slice(0, 160),
          });
        })
        .catch(() => {
          // Ignore; backend may be down.
        });
    },
  };
}

export default function App() {
  const { backendUrl, wsUrl } = useMemo(() => getEnv(), []);
  const newGame = useGameStore((s) => s.newGame);
  const overlay = useGameStore((s) => s.overlay);
  const apiHealth = useGameStore((s) => s.apiHealth);
  const wsStatus = useGameStore((s) => s.wsStatus);

  const { reconnectStream, revealWithBackend } = useBackendWiring();

  useEffect(() => {
    // Start a game immediately.
    newGame();
  }, [newGame]);

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight text-brand-text">
              AI Interactive Playroom
            </div>
            <div className="hidden text-sm text-brand-muted md:block">
              Find all safe tiles. Avoid hazards.
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <span className="hidden md:inline">API:</span>
            <span
              className={
                "rounded-full px-2 py-1 " +
                (apiHealth === "ok"
                  ? "bg-emerald-50 text-emerald-700"
                  : apiHealth === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-50 text-slate-700")
              }
              title={backendUrl}
            >
              {apiHealth}
            </span>

            <span className="hidden md:inline">SSE:</span>
            <button
              type="button"
              className={
                "rounded-full px-2 py-1 " +
                (wsStatus === "connected"
                  ? "bg-cyan-50 text-cyan-700"
                  : wsStatus === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-50 text-slate-700")
              }
              title={`(legacy) ${wsUrl}`}
              onClick={() => reconnectStream()}
            >
              {wsStatus}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[1fr_320px]">
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-2xl border bg-white p-3 shadow-sm"
        >
          <GameBoard onReveal={revealWithBackend} />
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <Sidebar />
        </motion.aside>
      </main>

      <AnimatePresence>{overlay.type !== "none" && <OverlayLayer />}</AnimatePresence>
      <ToastStack />
    </div>
  );
}
