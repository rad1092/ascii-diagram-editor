import { describe, expect, it } from "vitest";

import { createEmptyGrid, setCell } from "../../src/editor/grid";
import { textFromGridForExport } from "../../src/editor/document";

describe("text export", () => {
  it("keeps normalized TXT export behavior", () => {
    const grid = createEmptyGrid();
    const lines = ["    +---+", "    | A |", "    +---+"];

    lines.forEach((line, rowOffset) => {
      Array.from(line).forEach((char, colOffset) => {
        setCell(grid, rowOffset + 3, colOffset, char);
      });
    });

    expect(textFromGridForExport(grid)).toBe("+---+\n| A |\n+---+");
  });
});
