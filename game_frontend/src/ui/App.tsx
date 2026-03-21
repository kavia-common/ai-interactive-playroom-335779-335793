import React, { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getEnv } from "../config/env";
import { apiGet } from "../api/httpClient";
import { WsClient } from "../api/wsClient";
import { useGameStore } from "../state/useGameStore";
import GameBoard from "./GameBoard";
import Sidebar from "./Sidebar";
import OverlayLayer from "./OverlayLayer";
import ToastStack from "./ToastStack";

function useBackendWiring() {
  const setApiHealth = useGameStore((s) => s.setApiHealth);
  const setWsStatus = useGameStore((s) => s.setWsStatus);
  const pushToast = useGameStore((s) => s.pushToast);

  const wsRef = useRef<WsClient | null>(null);

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

    wsRef.current = new WsClient({
      onStatus: (st) => setWsStatus(st),
      onMessage: (msg) => {
        // We don't assume a backend protocol yet; show a lightweight toast.
        // This keeps WS wiring live without coupling to backend implementation.
        const str = typeof msg === "string" ? msg : JSON.stringify(msg);
        pushToast({
          type: "info",
          title: "WS message",
          message: str.slice(0, 160),
        });
      },
    });

    wsRef.current.connect();

    return () => {
      cancelled = true;
      wsRef.current?.disconnect();
      wsRef.current = null;
    };
  }, [pushToast, setApiHealth, setWsStatus]);

  return {
    sendWs: (data: unknown) => wsRef.current?.send(data),
    reconnectWs: () => wsRef.current?.reconnect(),
  };
}

export default function App() {
  const { backendUrl, wsUrl } = useMemo(() => getEnv(), []);
  const newGame = useGameStore((s) => s.newGame);
  const overlay = useGameStore((s) => s.overlay);
  const apiHealth = useGameStore((s) => s.apiHealth);
  const wsStatus = useGameStore((s) => s.wsStatus);

  const { reconnectWs } = useBackendWiring();

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

            <span className="hidden md:inline">WS:</span>
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
              title={wsUrl}
              onClick={() => reconnectWs()}
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
          <GameBoard />
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
