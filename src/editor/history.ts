import { HISTORY_LIMIT } from "./constants";
import { cloneGrid } from "./grid";
import type { GridState, HistoryState } from "./types";

export function createHistoryState(limit = HISTORY_LIMIT): HistoryState {
  return {
    undo: [],
    redo: [],
    limit
  };
}

export function pushHistorySnapshot(
  history: HistoryState,
  grid: GridState
): void {
  history.undo.push(cloneGrid(grid));
  if (history.undo.length > history.limit) {
    history.undo.shift();
  }
  history.redo = [];
}

export function undoGrid(
  history: HistoryState,
  currentGrid: GridState
): GridState | null {
  const previous = history.undo.pop();
  if (!previous) {
    return null;
  }

  history.redo.push(cloneGrid(currentGrid));
  return previous;
}

export function redoGrid(
  history: HistoryState,
  currentGrid: GridState
): GridState | null {
  const next = history.redo.pop();
  if (!next) {
    return null;
  }

  history.undo.push(cloneGrid(currentGrid));
  return next;
}
