import type {
  ArrowHeadStyle,
  BorderStyle,
  DiamondStyle,
  Direction,
  LineStyle
} from "./types";

interface BorderGlyphSet {
  tl: string;
  tr: string;
  bl: string;
  br: string;
  h: string;
  v: string;
}

interface LineCornerSet {
  leftDown: string;
  leftUp: string;
  rightDown: string;
  rightUp: string;
}

interface LineGlyphSet {
  h: string;
  v: string;
  point: string;
  dashGap?: boolean;
  corners: LineCornerSet;
}

interface DiamondGlyphSet {
  point: string;
  upperLeft: string;
  upperRight: string;
  lowerLeft: string;
  lowerRight: string;
  midLeft: string;
  midRight: string;
  mid: string;
}

export const BORDER_GLYPHS: Record<BorderStyle, BorderGlyphSet> = {
  simple: { tl: "+", tr: "+", bl: "+", br: "+", h: "-", v: "|" },
  double: { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" },
  rounded: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
  heavy: { tl: "┏", tr: "┓", bl: "┗", br: "┛", h: "━", v: "┃" },
  light: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" }
};

export const LINE_GLYPHS: Record<LineStyle, LineGlyphSet> = {
  ascii: {
    h: "-",
    v: "|",
    point: "+",
    corners: { leftDown: "+", leftUp: "+", rightDown: "+", rightUp: "+" }
  },
  light: {
    h: "─",
    v: "│",
    point: "┼",
    corners: { leftDown: "┐", leftUp: "┘", rightDown: "┌", rightUp: "└" }
  },
  heavy: {
    h: "━",
    v: "┃",
    point: "╋",
    corners: { leftDown: "┓", leftUp: "┛", rightDown: "┏", rightUp: "┗" }
  },
  dashed: {
    h: "-",
    v: "|",
    point: "+",
    dashGap: true,
    corners: { leftDown: "+", leftUp: "+", rightDown: "+", rightUp: "+" }
  },
  dotted: {
    h: "·",
    v: ":",
    point: "+",
    corners: { leftDown: "+", leftUp: "+", rightDown: "+", rightUp: "+" }
  }
};

export const DIAMOND_GLYPHS: Record<DiamondStyle, DiamondGlyphSet> = {
  simple: {
    point: ".",
    upperLeft: "/",
    upperRight: "\\",
    lowerLeft: "\\",
    lowerRight: "/",
    midLeft: "<",
    midRight: ">",
    mid: "-"
  },
  unicode: {
    point: "◇",
    upperLeft: "╱",
    upperRight: "╲",
    lowerLeft: "╲",
    lowerRight: "╱",
    midLeft: "◀",
    midRight: "▶",
    mid: "─"
  }
};

export function getLineCornerGlyph(
  style: LineStyle,
  horizontalDirection: "left" | "right",
  verticalDirection: "up" | "down"
): string {
  const corners = LINE_GLYPHS[style].corners;

  if (horizontalDirection === "right" && verticalDirection === "down") {
    return corners.leftDown;
  }
  if (horizontalDirection === "right" && verticalDirection === "up") {
    return corners.leftUp;
  }
  if (horizontalDirection === "left" && verticalDirection === "down") {
    return corners.rightDown;
  }
  return corners.rightUp;
}

export function getArrowHeadGlyph(
  style: ArrowHeadStyle,
  direction: Direction
): string {
  if (style === "triangle") {
    return {
      up: "▲",
      down: "▼",
      left: "◀",
      right: "▶"
    }[direction];
  }

  return {
    up: "^",
    down: "v",
    left: "<",
    right: ">"
  }[direction];
}
