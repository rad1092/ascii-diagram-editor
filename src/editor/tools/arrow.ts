import { getArrowHeadGlyph } from "../glyphs";
import { setCell } from "../grid";
import { drawLine } from "./line";
import type {
  ArrowHeadStyle,
  GridPoint,
  GridState,
  LineDrawResult,
  LineStyle
} from "../types";

export function drawArrow(
  grid: GridState,
  start: GridPoint,
  end: GridPoint,
  lineStyle: LineStyle,
  arrowHeadStyle: ArrowHeadStyle
): LineDrawResult {
  const result = drawLine(grid, start, end, lineStyle);
  setCell(grid, end.row, end.col, getArrowHeadGlyph(arrowHeadStyle, result.endDirection));
  return result;
}
