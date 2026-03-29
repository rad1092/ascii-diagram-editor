import { setCell } from "../grid";
import type { EraserSize, GridPoint, GridState } from "../types";

export function eraseArea(
  grid: GridState,
  center: GridPoint,
  size: EraserSize
): void {
  const half = Math.floor(size / 2);

  for (let row = center.row - half; row <= center.row + half; row += 1) {
    for (let col = center.col - half; col <= center.col + half; col += 1) {
      setCell(grid, row, col, " ");
    }
  }
}
