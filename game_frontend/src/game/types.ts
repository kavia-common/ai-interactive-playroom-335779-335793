export type Difficulty = "easy" | "normal" | "hard";

export type GameStatus = "idle" | "playing" | "won" | "lost" | "paused";

export type Cell = {
  id: string;
  x: number;
  y: number;
  revealed: boolean;
  hazard: boolean;
  hint: number; // number of adjacent hazards
};

export type GameStats = {
  moves: number;
  startedAt: number | null;
  finishedAt: number | null;
};

export type Toast = {
  id: string;
  type: "info" | "success" | "error";
  title: string;
  message?: string;
};
