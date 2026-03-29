import { floodSelectConnected } from "../floodFill";
import {
  clearConnectedCells,
  clearRect,
  computeCellsBounds,
  stampConnectedCells,
  translateRect
} from "../grid";
import type { ConnectedCell, GridPoint, GridRect, GridState } from "../types";

export function collectConnectedSelection(
  grid: GridState,
  point: GridPoint
): ConnectedCell[] {
  return floodSelectConnected(grid, point);
}

export function liftConnectedSelection(
  grid: GridState,
  point: GridPoint
): ConnectedCell[] {
  const cells = collectConnectedSelection(grid, point);
  clearConnectedCells(grid, cells);
  return cells;
}

export function stampMovedSelection(
  grid: GridState,
  cells: ConnectedCell[],
  deltaCol: number,
  deltaRow: number
): void {
  stampConnectedCells(grid, cells, deltaCol, deltaRow);
}

export function getMovedSelectionBounds(
  cells: ConnectedCell[],
  deltaCol = 0,
  deltaRow = 0
): GridRect | null {
  const bounds = computeCellsBounds(cells);
  return bounds ? translateRect(bounds, deltaCol, deltaRow) : null;
}

export function eraseMarqueeSelection(grid: GridState, rect: GridRect): void {
  clearRect(grid, rect);
}
