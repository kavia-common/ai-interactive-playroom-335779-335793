import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../state/useGameStore";

function toastClasses(type: "info" | "success" | "error") {
  switch (type) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "error":
      return "border-red-200 bg-red-50 text-red-900";
    case "info":
    default:
      return "border-slate-200 bg-white text-brand-text";
  }
}

export default function ToastStack() {
  const toasts = useGameStore((s) => s.toasts);
  const dismissToast = useGameStore((s) => s.dismissToast);

  useEffect(() => {
    const timers = toasts.map((t) =>
      window.setTimeout(() => dismissToast(t.id), 4500),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [dismissToast, toasts]);

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={() => dismissToast(t.id)}
            className={[
              "rounded-2xl border p-3 text-left shadow-sm",
              toastClasses(t.type),
            ].join(" ")}
            aria-label={`Toast: ${t.title}`}
          >
            <div className="text-sm font-semibold">{t.title}</div>
            {t.message ? (
              <div className="mt-1 text-xs opacity-80">{t.message}</div>
            ) : null}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
