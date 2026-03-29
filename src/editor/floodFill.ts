import { COLS, ROWS } from "./constants";
import { getCell } from "./grid";
import type { ConnectedCell, GridPoint, GridState } from "./types";

const NEIGHBOR_OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1]
] as const;

export function floodSelectConnected(
  grid: GridState,
  start: GridPoint
): ConnectedCell[] {
  if (getCell(grid, start.row, start.col) === " ") {
    return [];
  }

  const visited = new Set<number>();
  const stack: GridPoint[] = [start];
  const result: ConnectedCell[] = [];

  while (stack.length > 0) {
    const point = stack.pop();
    if (!point) {
      continue;
    }

    const key = point.row * COLS + point.col;
    if (visited.has(key)) {
      continue;
    }

    visited.add(key);

    if (
      point.row < 0 ||
      point.row >= ROWS ||
      point.col < 0 ||
      point.col >= COLS
    ) {
      continue;
    }

    const char = getCell(grid, point.row, point.col);
    if (char === " ") {
      continue;
    }

    result.push({ row: point.row, col: point.col, char });

    NEIGHBOR_OFFSETS.forEach(([rowDelta, colDelta]) => {
      stack.push({ row: point.row + rowDelta, col: point.col + colDelta });
    });
  }

  return result;
}
