import type { Cell, Difficulty } from "./types";

function randInt(maxExclusive: number) {
  return Math.floor(Math.random() * maxExclusive);
}

function key(x: number, y: number) {
  return `${x},${y}`;
}

function neighbors(x: number, y: number, w: number, h: number) {
  const coords: Array<[number, number]> = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) coords.push([nx, ny]);
    }
  }
  return coords;
}

export function difficultyToSize(d: Difficulty) {
  switch (d) {
    case "easy":
      return { w: 6, h: 6, hazards: 6 };
    case "hard":
      return { w: 10, h: 10, hazards: 18 };
    case "normal":
    default:
      return { w: 8, h: 8, hazards: 12 };
  }
}

// PUBLIC_INTERFACE
export function createNewGrid(difficulty: Difficulty): Cell[] {
  /** Creates a new grid of cells, placing hazards and computing hints. */
  const { w, h, hazards } = difficultyToSize(difficulty);

  const hazardSet = new Set<string>();
  while (hazardSet.size < hazards) {
    hazardSet.add(key(randInt(w), randInt(h)));
  }

  const cells: Cell[] = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      cells.push({
        id: `c-${x}-${y}`,
        x,
        y,
        revealed: false,
        hazard: hazardSet.has(key(x, y)),
        hint: 0,
      });
    }
  }

  // compute hints
  const map = new Map<string, Cell>();
  for (const c of cells) map.set(key(c.x, c.y), c);

  for (const c of cells) {
    const n = neighbors(c.x, c.y, w, h);
    const hint = n.reduce((acc, [nx, ny]) => {
      const nc = map.get(key(nx, ny));
      return acc + (nc?.hazard ? 1 : 0);
    }, 0);
    c.hint = hint;
  }

  return cells;
}

// PUBLIC_INTERFACE
export function floodReveal(
  cells: Cell[],
  x: number,
  y: number,
  difficulty: Difficulty,
): { next: Cell[]; revealedCountDelta: number } {
  /** Reveals a cell; if hint is 0, reveals connected empty region. */
  const { w, h } = difficultyToSize(difficulty);

  const map = new Map<string, Cell>();
  for (const c of cells) map.set(key(c.x, c.y), { ...c });

  const start = map.get(key(x, y));
  if (!start || start.revealed) return { next: cells, revealedCountDelta: 0 };

  let delta = 0;
  const q: Array<[number, number]> = [[x, y]];

  while (q.length) {
    const [cx, cy] = q.shift()!;
    const c = map.get(key(cx, cy));
    if (!c || c.revealed) continue;

    c.revealed = true;
    map.set(key(cx, cy), c);
    delta += 1;

    if (!c.hazard && c.hint === 0) {
      for (const [nx, ny] of neighbors(cx, cy, w, h)) {
        const nc = map.get(key(nx, ny));
        if (nc && !nc.revealed && !nc.hazard) q.push([nx, ny]);
      }
    }
  }

  return { next: Array.from(map.values()), revealedCountDelta: delta };
}
