import type { GridState } from "../../src/editor/types";

export function sliceGrid(
  grid: GridState,
  top: number,
  bottom: number,
  left: number,
  right: number
): string[] {
  return grid
    .slice(top, bottom + 1)
    .map((row) => row.slice(left, right + 1).join(""));
}
