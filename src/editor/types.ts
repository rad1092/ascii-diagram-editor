export type ToolKind =
  | "select"
  | "rect"
  | "diamond"
  | "line"
  | "arrow"
  | "text"
  | "freehand"
  | "eraser";

export type BorderStyle =
  | "simple"
  | "double"
  | "rounded"
  | "heavy"
  | "light";

export type LineStyle = "ascii" | "light" | "heavy" | "dashed" | "dotted";
export type ArrowHeadStyle = "ascii" | "triangle";
export type DiamondStyle = "simple" | "unicode";
export type FreehandGlyph = "*" | "#" | "@" | "~" | "." | "x" | "o" | "·";
export type EraserSize = 1 | 3 | 5;
export type Direction = "up" | "down" | "left" | "right";
export type ToastTone = "info" | "success" | "error";
export type InteractionMode = "idle" | "drawing" | "panning" | "moving";
export type GridState = string[][];

export interface GridPoint {
  col: number;
  row: number;
}

export interface GridRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ConnectedCell {
  col: number;
  row: number;
  char: string;
}

export interface CameraState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ToolOptions {
  borderStyle: BorderStyle;
  lineStyle: LineStyle;
  arrowHead: ArrowHeadStyle;
  diamondStyle: DiamondStyle;
  freehandGlyph: FreehandGlyph;
  eraserSize: EraserSize;
}

export interface HistoryState {
  undo: GridState[];
  redo: GridState[];
  limit: number;
}

export interface OverlayVisualState {
  cursorRect: GridRect | null;
  previewRect: GridRect | null;
  selectionRect: GridRect | null;
  moveRect: GridRect | null;
}

export interface ToastState {
  message: string;
  tone: ToastTone;
}

export interface SelectionState {
  marquee: GridRect | null;
  movingCells: ConnectedCell[] | null;
  movingOrigin: GridPoint | null;
}

export interface InteractionState {
  mode: InteractionMode;
  pointerId: number | null;
  lastClientX: number;
  lastClientY: number;
  dragStartCell: GridPoint | null;
  currentCell: GridPoint | null;
  lastStrokeCell: GridPoint | null;
  isSpacePressed: boolean;
}

export interface TextInputState {
  active: boolean;
  anchor: GridPoint | null;
  isComposing: boolean;
}

export interface UIState {
  overlay: OverlayVisualState;
  toast: ToastState | null;
}

export interface CellMetrics {
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
}

export interface DocumentMetadata {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSessionState {
  metadata: DocumentMetadata;
  isDirty: boolean;
}

export interface EditorState {
  grid: GridState;
  previewGrid: GridState | null;
  tool: ToolKind;
  toolOptions: ToolOptions;
  camera: CameraState;
  history: HistoryState;
  selection: SelectionState;
  interaction: InteractionState;
  textInput: TextInputState;
  ui: UIState;
  cellMetrics: CellMetrics;
  cursorCell: GridPoint;
  document: DocumentSessionState;
}

export interface LineDrawResult {
  bounds: GridRect;
  bend: GridPoint | null;
  endDirection: Direction;
}
