export type LogLevel = "debug" | "info" | "warn" | "error";

// PUBLIC_INTERFACE
export function getEnv() {
  /** Returns normalized environment configuration for API/WS connections. */
  const apiBase =
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:3001";

  const backendUrl = import.meta.env.VITE_BACKEND_URL || apiBase;

  // Prefer explicit WS URL; otherwise infer from backendUrl.
  const wsUrl =
    import.meta.env.VITE_WS_URL ||
    backendUrl.replace(/^http/i, "ws").replace(/\/+$/, "") + "/ws";

  const nodeEnv = (import.meta.env.VITE_NODE_ENV || "development") as string;
  const logLevel = (import.meta.env.VITE_LOG_LEVEL || "info") as LogLevel;

  return {
    apiBase: String(apiBase).replace(/\/+$/, ""),
    backendUrl: String(backendUrl).replace(/\/+$/, ""),
    wsUrl: String(wsUrl),
    nodeEnv,
    logLevel,
    frontendUrl: import.meta.env.VITE_FRONTEND_URL as string | undefined,
    healthcheckPath: (import.meta.env.VITE_HEALTHCHECK_PATH ||
      "/healthz") as string,
  };
}
