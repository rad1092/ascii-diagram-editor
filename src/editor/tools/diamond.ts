import { DIAMOND_GLYPHS } from "../glyphs";
import { normalizeRect, setCell } from "../grid";
import type { DiamondStyle, GridPoint, GridRect, GridState } from "../types";

export function drawDiamond(
  grid: GridState,
  start: GridPoint,
  end: GridPoint,
  style: DiamondStyle
): GridRect {
  const rect = normalizeRect(start, end);
  const centerCol = (rect.left + rect.right) / 2;
  const centerRow = (rect.top + rect.bottom) / 2;
  const halfWidth = (rect.right - rect.left) / 2;
  const halfHeight = (rect.bottom - rect.top) / 2;
  const glyphs = DIAMOND_GLYPHS[style];

  if (halfWidth < 1 || halfHeight < 1) {
    return rect;
  }

  for (let row = rect.top; row <= rect.bottom; row += 1) {
    const distance = Math.abs(row - centerRow) / halfHeight;
    const widthAtRow = Math.round((1 - distance) * halfWidth);
    const leftCol = Math.round(centerCol) - widthAtRow;
    const rightCol = Math.round(centerCol) + widthAtRow;

    if (row === rect.top || row === rect.bottom) {
      setCell(grid, row, Math.round(centerCol), glyphs.point);
      continue;
    }

    if (Math.abs(row - centerRow) < 0.6) {
      setCell(grid, row, leftCol, glyphs.midLeft);
      setCell(grid, row, rightCol, glyphs.midRight);
      for (let col = leftCol + 1; col < rightCol; col += 1) {
        setCell(grid, row, col, glyphs.mid);
      }
      continue;
    }

    if (leftCol === rightCol) {
      setCell(grid, row, leftCol, glyphs.point);
      continue;
    }

    setCell(
      grid,
      row,
      leftCol,
      row < centerRow ? glyphs.upperLeft : glyphs.lowerLeft
    );
    setCell(
      grid,
      row,
      rightCol,
      row < centerRow ? glyphs.upperRight : glyphs.lowerRight
    );
  }

  return rect;
}
