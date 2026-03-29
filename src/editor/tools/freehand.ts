import { setCell } from "../grid";
import type { FreehandGlyph, GridPoint, GridState } from "../types";

export function drawFreehandCell(
  grid: GridState,
  point: GridPoint,
  glyph: FreehandGlyph
): void {
  setCell(grid, point.row, point.col, glyph);
}
