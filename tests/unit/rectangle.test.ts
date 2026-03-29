import { describe, expect, it } from "vitest";

import { createEmptyGrid } from "../../src/editor/grid";
import { drawRectangle } from "../../src/editor/tools/rectangle";
import { sliceGrid } from "../fixtures/golden";

describe("drawRectangle", () => {
  it("draws an ASCII rectangle border", () => {
    const grid = createEmptyGrid();
    drawRectangle(grid, { col: 1, row: 1 }, { col: 5, row: 3 }, "simple");

    expect(sliceGrid(grid, 1, 3, 1, 5)).toEqual([
      "+---+",
      "|   |",
      "+---+"
    ]);
  });

  it("draws the unicode styles from the spec", () => {
    const grid = createEmptyGrid();
    drawRectangle(grid, { col: 2, row: 2 }, { col: 6, row: 4 }, "double");
    drawRectangle(grid, { col: 8, row: 2 }, { col: 12, row: 4 }, "rounded");

    expect(sliceGrid(grid, 2, 4, 2, 6)).toEqual([
      "╔═══╗",
      "║   ║",
      "╚═══╝"
    ]);

    expect(sliceGrid(grid, 2, 4, 8, 12)).toEqual([
      "╭───╮",
      "│   │",
      "╰───╯"
    ]);
  });
});
