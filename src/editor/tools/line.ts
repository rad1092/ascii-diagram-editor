import { getLineCornerGlyph, LINE_GLYPHS } from "../glyphs";
import { normalizeRect, setCell } from "../grid";
import type {
  GridPoint,
  GridState,
  LineDrawResult,
  LineStyle
} from "../types";

function shouldDrawDashed(offset: number, dashed: boolean | undefined): boolean {
  return !dashed || offset % 2 === 0;
}

export function drawLine(
  grid: GridState,
  start: GridPoint,
  end: GridPoint,
  style: LineStyle
): LineDrawResult {
  const glyphs = LINE_GLYPHS[style];
  const bounds = normalizeRect(start, end);

  if (start.col === end.col && start.row === end.row) {
    setCell(grid, start.row, start.col, glyphs.point);
    return { bounds, bend: null, endDirection: "right" };
  }

  if (start.row === end.row) {
    const horizontalDirection = end.col > start.col ? "right" : "left";
    const left = Math.min(start.col, end.col);
    const right = Math.max(start.col, end.col);
    for (let col = left; col <= right; col += 1) {
      if (shouldDrawDashed(col - left, glyphs.dashGap)) {
        setCell(grid, start.row, col, glyphs.h);
      }
    }

    return { bounds, bend: null, endDirection: horizontalDirection };
  }

  if (start.col === end.col) {
    const verticalDirection = end.row > start.row ? "down" : "up";
    const top = Math.min(start.row, end.row);
    const bottom = Math.max(start.row, end.row);
    for (let row = top; row <= bottom; row += 1) {
      if (shouldDrawDashed(row - top, glyphs.dashGap)) {
        setCell(grid, row, start.col, glyphs.v);
      }
    }

    return { bounds, bend: null, endDirection: verticalDirection };
  }

  const horizontalDirection = end.col > start.col ? "right" : "left";
  const verticalDirection = end.row > start.row ? "down" : "up";
  const bend = { col: end.col, row: start.row };
  const horizontalStart = Math.min(start.col, end.col);
  const horizontalEnd = Math.max(start.col, end.col);
  const verticalStart = Math.min(start.row, end.row);
  const verticalEnd = Math.max(start.row, end.row);

  for (let col = horizontalStart; col <= horizontalEnd; col += 1) {
    if (shouldDrawDashed(col - horizontalStart, glyphs.dashGap)) {
      setCell(grid, start.row, col, glyphs.h);
    }
  }

  for (let row = verticalStart; row <= verticalEnd; row += 1) {
    if (shouldDrawDashed(row - verticalStart, glyphs.dashGap)) {
      setCell(grid, row, end.col, glyphs.v);
    }
  }

  setCell(
    grid,
    bend.row,
    bend.col,
    getLineCornerGlyph(style, horizontalDirection, verticalDirection)
  );

  return {
    bounds,
    bend,
    endDirection: verticalDirection
  };
}
