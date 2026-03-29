import { describe, expect, it } from "vitest";

import { createEmptyGrid } from "../../src/editor/grid";
import { drawArrow } from "../../src/editor/tools/arrow";
import { drawLine } from "../../src/editor/tools/line";
import { sliceGrid } from "../fixtures/golden";

describe("line and arrow drawing", () => {
  it("uses an orthogonal horizontal-then-vertical path", () => {
    const grid = createEmptyGrid();
    drawLine(grid, { col: 1, row: 1 }, { col: 5, row: 3 }, "light");

    expect(sliceGrid(grid, 1, 3, 1, 5)).toEqual([
      "────┐",
      "    │",
      "    │"
    ]);
  });

  it("overwrites the endpoint with the correct arrow head", () => {
    const grid = createEmptyGrid();
    drawArrow(grid, { col: 1, row: 1 }, { col: 5, row: 3 }, "ascii", "ascii");

    expect(sliceGrid(grid, 1, 3, 1, 5)).toEqual([
      "----+",
      "    |",
      "    v"
    ]);
  });

  it("supports triangle arrow heads", () => {
    const grid = createEmptyGrid();
    drawArrow(grid, { col: 7, row: 3 }, { col: 3, row: 3 }, "heavy", "triangle");

    expect(sliceGrid(grid, 3, 3, 3, 7)).toEqual(["◀━━━━"]);
  });
});
