export type LogLevel = "debug" | "info" | "warn" | "error";

// PUBLIC_INTERFACE
export function getEnv() {
  /** Returns normalized environment configuration for API/SSE connections. */
  // Backend defaults to PORT=3000 in this repo.
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE ||
    "http://localhost:3000";

  // API base should include the backend API namespace.
  // Backend routes are mounted at /api (see backend/src/routes/index.js).
  const apiBase =
    import.meta.env.VITE_API_BASE ||
    `${String(backendUrl).replace(/\/*$/, "")}/api`;

  // Keep wsUrl for compatibility with existing UI labels/envs, but the backend
  // does not expose a websocket route in this step (we use SSE).
  const wsUrl =
    import.meta.env.VITE_WS_URL ||
    String(backendUrl).replace(/^http/i, "ws").replace(/\/*$/, "") + "/ws";

  const nodeEnv = (import.meta.env.VITE_NODE_ENV || "development") as string;
  const logLevel = (import.meta.env.VITE_LOG_LEVEL || "info") as LogLevel;

  return {
    apiBase: String(apiBase).replace(/\/*$/, ""),
    backendUrl: String(backendUrl).replace(/\/*$/, ""),
    wsUrl: String(wsUrl),
    nodeEnv,
    logLevel,
    frontendUrl: import.meta.env.VITE_FRONTEND_URL as string | undefined,

    // Backend health is served at GET /
    healthcheckPath: (import.meta.env.VITE_HEALTHCHECK_PATH || "/") as string,

    // SSE endpoint path relative to apiBase
    ssePath: (import.meta.env.VITE_SSE_PATH || "/events/stream") as string,
  };
}
