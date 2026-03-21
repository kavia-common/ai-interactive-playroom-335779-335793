import { getEnv } from "../config/env";

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// PUBLIC_INTERFACE
export async function apiGet<T = unknown>(path: string): Promise<T> {
  /** Performs a GET to the backend using VITE_API_BASE. */
  const { apiBase } = getEnv();
  const res = await fetch(`${apiBase}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const body = await safeJson(res);
  if (!res.ok) {
    throw new HttpError(`GET ${path} failed`, res.status, body);
  }
  return body as T;
}

// PUBLIC_INTERFACE
export async function apiPost<T = unknown, B = unknown>(
  path: string,
  payload: B,
): Promise<T> {
  /** Performs a POST to the backend using VITE_API_BASE. */
  const { apiBase } = getEnv();
  const res = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await safeJson(res);
  if (!res.ok) {
    throw new HttpError(`POST ${path} failed`, res.status, body);
  }
  return body as T;
}
