import { apiGet, apiPost } from "./httpClient";

/**
 * Types mirror the backend Swagger schemas in backend/src/routes/api.js
 */
export type AIInteractRequest = {
  prompt: string;
  playerId?: string;
  mode?: string;
  context?: Record<string, unknown>;
};

export type AIInteractResult = {
  interactionId: string;
  reply: string;
  effects: Array<{ type: string; payload: Record<string, unknown> }>;
  meta: { model: string; latencyMs: number };
};

export type AIInteractResponse = {
  status: "ok";
  result: AIInteractResult;
};

export type GameEventEmitRequest = {
  type: string;
  playerId?: string;
  payload: Record<string, unknown>;
};

export type GameEventEnvelope = {
  id: string;
  type: string;
  playerId: string | null;
  timestamp: string;
  payload: Record<string, unknown>;
};

export type EmitEventResponse = {
  status: "ok";
  event: GameEventEnvelope;
};

export type ListEventsResponse = {
  status: "ok";
  events: GameEventEnvelope[];
};

// PUBLIC_INTERFACE
export async function interactAI(payload: AIInteractRequest) {
  /** Calls POST /api/ai/interact to get an AI-style reply. */
  return apiPost<AIInteractResponse, AIInteractRequest>("/ai/interact", payload);
}

// PUBLIC_INTERFACE
export async function emitGameEvent(payload: GameEventEmitRequest) {
  /** Calls POST /api/events to publish an in-memory game event envelope. */
  return apiPost<EmitEventResponse, GameEventEmitRequest>("/events", payload);
}

// PUBLIC_INTERFACE
export async function listRecentEvents(limit = 50) {
  /** Calls GET /api/events?limit=N to list recent in-memory events. */
  const q = new URLSearchParams({ limit: String(limit) }).toString();
  return apiGet<ListEventsResponse>(`/events?${q}`);
}
