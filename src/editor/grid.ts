import { COLS, ROWS } from "./constants";
import type { ConnectedCell, GridPoint, GridRect, GridState } from "./types";

export function createEmptyGrid(): GridState {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => " "));
}

export function cloneGrid(grid: GridState): GridState {
  return grid.map((row) => [...row]);
}

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

export function getCell(grid: GridState, row: number, col: number): string {
  if (!isInBounds(row, col)) {
    return " ";
  }

  return grid[row]?.[col] ?? " ";
}

export function setCell(
  grid: GridState,
  row: number,
  col: number,
  char: string
): void {
  if (!isInBounds(row, col)) {
    return;
  }

  const nextChar = char.length === 0 ? " " : Array.from(char)[0] ?? " ";
  const targetRow = grid[row];
  if (!targetRow) {
    return;
  }

  targetRow[col] = nextChar;
}

export function normalizeRect(a: GridPoint, b: GridPoint): GridRect {
  return {
    left: Math.min(a.col, b.col),
    right: Math.max(a.col, b.col),
    top: Math.min(a.row, b.row),
    bottom: Math.max(a.row, b.row)
  };
}

export function translateRect(
  rect: GridRect,
  deltaCol: number,
  deltaRow: number
): GridRect {
  return {
    left: rect.left + deltaCol,
    right: rect.right + deltaCol,
    top: rect.top + deltaRow,
    bottom: rect.bottom + deltaRow
  };
}

export function clearRect(grid: GridState, rect: GridRect): void {
  for (let row = rect.top; row <= rect.bottom; row += 1) {
    for (let col = rect.left; col <= rect.right; col += 1) {
      setCell(grid, row, col, " ");
    }
  }
}

export function writeMultilineText(
  grid: GridState,
  anchor: GridPoint,
  text: string
): void {
  const lines = text.split("\n");
  lines.forEach((line, rowOffset) => {
    Array.from(line).forEach((char, colOffset) => {
      setCell(grid, anchor.row + rowOffset, anchor.col + colOffset, char);
    });
  });
}

export function clearConnectedCells(
  grid: GridState,
  cells: ConnectedCell[]
): void {
  cells.forEach((cell) => {
    setCell(grid, cell.row, cell.col, " ");
  });
}

export function stampConnectedCells(
  grid: GridState,
  cells: ConnectedCell[],
  deltaCol: number,
  deltaRow: number
): void {
  cells.forEach((cell) => {
    setCell(grid, cell.row + deltaRow, cell.col + deltaCol, cell.char);
  });
}

export function computeCellsBounds(cells: ConnectedCell[]): GridRect | null {
  if (cells.length === 0) {
    return null;
  }

  const cols = cells.map((cell) => cell.col);
  const rows = cells.map((cell) => cell.row);

  return {
    left: Math.min(...cols),
    right: Math.max(...cols),
    top: Math.min(...rows),
    bottom: Math.max(...rows)
  };
}

export function gridRectWidth(rect: GridRect): number {
  return rect.right - rect.left + 1;
}

export function gridRectHeight(rect: GridRect): number {
  return rect.bottom - rect.top + 1;
}
