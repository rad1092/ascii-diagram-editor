import { BORDER_GLYPHS } from "../glyphs";
import { normalizeRect, setCell } from "../grid";
import type { BorderStyle, GridPoint, GridRect, GridState } from "../types";

export function drawRectangle(
  grid: GridState,
  start: GridPoint,
  end: GridPoint,
  style: BorderStyle
): GridRect {
  const rect = normalizeRect(start, end);
  const glyphs = BORDER_GLYPHS[style];

  if (rect.right - rect.left < 1 || rect.bottom - rect.top < 1) {
    return rect;
  }

  setCell(grid, rect.top, rect.left, glyphs.tl);
  setCell(grid, rect.top, rect.right, glyphs.tr);
  setCell(grid, rect.bottom, rect.left, glyphs.bl);
  setCell(grid, rect.bottom, rect.right, glyphs.br);

  for (let col = rect.left + 1; col < rect.right; col += 1) {
    setCell(grid, rect.top, col, glyphs.h);
    setCell(grid, rect.bottom, col, glyphs.h);
  }

  for (let row = rect.top + 1; row < rect.bottom; row += 1) {
    setCell(grid, row, rect.left, glyphs.v);
    setCell(grid, row, rect.right, glyphs.v);
  }

  return rect;
}
