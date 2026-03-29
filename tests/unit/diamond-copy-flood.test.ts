import { describe, expect, it } from "vitest";

import { setCell, createEmptyGrid } from "../../src/editor/grid";
import { serializeGridForClipboard } from "../../src/editor/serialize";
import { floodSelectConnected } from "../../src/editor/floodFill";
import { drawDiamond } from "../../src/editor/tools/diamond";
import { sliceGrid } from "../fixtures/golden";

describe("diamond, copy, and flood selection behavior", () => {
  it("draws the simple diamond style from the prototype geometry", () => {
    const grid = createEmptyGrid();
    drawDiamond(grid, { col: 1, row: 1 }, { col: 7, row: 5 }, "simple");

    expect(sliceGrid(grid, 1, 5, 1, 7)).toEqual([
      "   .   ",
      " /   \\ ",
      "<----->",
      " \\   / ",
      "   .   "
    ]);
  });

  it("connects diagonal neighbors for move selection", () => {
    const grid = createEmptyGrid();
    setCell(grid, 1, 1, "#");
    setCell(grid, 2, 2, "#");
    setCell(grid, 4, 4, "#");

    expect(floodSelectConnected(grid, { row: 1, col: 1 })).toHaveLength(2);
  });

  it("normalizes copied ASCII output", () => {
    const grid = createEmptyGrid();
    const text = "    A  \n    B  ";
    Array.from(text.split("\n")[0] ?? "").forEach((char, col) => setCell(grid, 2, col, char));
    Array.from(text.split("\n")[1] ?? "").forEach((char, col) => setCell(grid, 3, col, char));

    expect(serializeGridForClipboard(grid)).toBe("A\nB");
  });
});
