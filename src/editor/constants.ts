import type {
  ArrowHeadStyle,
  BorderStyle,
  DiamondStyle,
  EraserSize,
  FreehandGlyph,
  LineStyle,
  ToolKind
} from "./types";

export const COLS = 200;
export const ROWS = 80;
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 3.0;
export const ZOOM_STEP = 0.05;
export const HISTORY_LIMIT = 100;
export const MONO_FONT_SIZE = 16;
export const MONO_LINE_HEIGHT = 1.25;
export const STATUS_HINT = "Space+Drag to pan · Scroll to zoom";
export const DEFAULT_DOCUMENT_NAME = "Untitled diagram";
export const LOCAL_STORAGE_DOCUMENT_KEY = "ascii-diagram-editor.document.v1";

export const TOOLS: ToolKind[] = [
  "select",
  "rect",
  "diamond",
  "line",
  "arrow",
  "text",
  "freehand",
  "eraser"
];

export const TOOL_LABELS: Record<ToolKind, string> = {
  select: "Select",
  rect: "Rectangle",
  diamond: "Diamond",
  line: "Line",
  arrow: "Arrow",
  text: "Text",
  freehand: "Freehand",
  eraser: "Eraser"
};

export const TOOL_SHORTCUTS: Record<ToolKind, string> = {
  select: "V",
  rect: "R",
  diamond: "D",
  line: "L",
  arrow: "A",
  text: "T",
  freehand: "F",
  eraser: "E"
};

export const BORDER_STYLES: BorderStyle[] = [
  "simple",
  "double",
  "rounded",
  "heavy",
  "light"
];

export const LINE_STYLES: LineStyle[] = [
  "ascii",
  "light",
  "heavy",
  "dashed",
  "dotted"
];

export const ARROW_HEAD_STYLES: ArrowHeadStyle[] = ["ascii", "triangle"];

export const FREEHAND_GLYPHS: FreehandGlyph[] = [
  "*",
  "#",
  "@",
  "~",
  ".",
  "x",
  "o",
  "·"
];

export const ERASER_SIZES: EraserSize[] = [1, 3, 5];

export const DIAMOND_STYLES: DiamondStyle[] = ["simple", "unicode"];
