import { getEnv } from "../config/env";

export type WsStatus = "disconnected" | "connecting" | "connected" | "error";

export type WsHandlers = {
  onStatus?: (status: WsStatus) => void;
  onMessage?: (data: unknown) => void;
  onError?: (err: Event) => void;
};

export class WsClient {
  private ws: WebSocket | null = null;
  private handlers: WsHandlers;
  private reconnectTimer: number | null = null;

  constructor(handlers: WsHandlers) {
    this.handlers = handlers;
  }

  // PUBLIC_INTERFACE
  connect() {
    /** Connects to the backend websocket using VITE_WS_URL. */
    const { wsUrl } = getEnv();
    this.handlers.onStatus?.("connecting");

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (e) {
      this.handlers.onStatus?.("error");
      return;
    }

    this.ws.onopen = () => this.handlers.onStatus?.("connected");

    this.ws.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.data));
        this.handlers.onMessage?.(parsed);
      } catch {
        this.handlers.onMessage?.(evt.data);
      }
    };

    this.ws.onerror = (evt) => {
      this.handlers.onStatus?.("error");
      this.handlers.onError?.(evt);
    };

    this.ws.onclose = () => {
      this.handlers.onStatus?.("disconnected");
    };
  }

  // PUBLIC_INTERFACE
  disconnect() {
    /** Closes the websocket and cancels reconnection. */
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.handlers.onStatus?.("disconnected");
  }

  // PUBLIC_INTERFACE
  reconnect(delayMs = 800) {
    /** Reconnects after a short delay. */
    this.disconnect();
    this.reconnectTimer = window.setTimeout(() => this.connect(), delayMs);
  }

  // PUBLIC_INTERFACE
  send(data: unknown) {
    /** Sends JSON over the websocket when connected. */
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(data));
  }
}
