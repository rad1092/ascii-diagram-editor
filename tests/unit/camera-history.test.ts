import { describe, expect, it } from "vitest";

import { screenToCell, zoomCameraAtPoint } from "../../src/editor/camera";
import { createEmptyGrid, setCell } from "../../src/editor/grid";
import {
  createHistoryState,
  pushHistorySnapshot,
  redoGrid,
  undoGrid
} from "../../src/editor/history";

describe("camera and history behavior", () => {
  it("zooms toward the pointer in configured steps", () => {
    const next = zoomCameraAtPoint(
      { zoom: 1, panX: 0, panY: 0 },
      -100,
      120,
      60
    );

    expect(next.zoom).toBeCloseTo(1.05);
    expect(next.panX).toBeCloseTo(-6);
    expect(next.panY).toBeCloseTo(-3);
  });

  it("maps screen coordinates back into the fixed cell grid", () => {
    const point = screenToCell(
      new DOMRect(10, 20, 400, 300),
      110,
      70,
      { zoom: 1, panX: 0, panY: 0 },
      { width: 10, height: 20, fontSize: 16, lineHeight: 1.25 }
    );

    expect(point).toEqual({ col: 10, row: 2 });
  });

  it("stores full-grid undo and redo snapshots", () => {
    const history = createHistoryState();
    const grid = createEmptyGrid();
    pushHistorySnapshot(history, grid);
    setCell(grid, 1, 1, "X");

    const undone = undoGrid(history, grid);
    expect(undone?.[1]?.[1]).toBe(" ");

    const redone = redoGrid(history, undone ?? grid);
    expect(redone?.[1]?.[1]).toBe("X");
  });
});
