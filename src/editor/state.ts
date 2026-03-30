import { DEFAULT_DOCUMENT_NAME, STATUS_HINT } from "./constants";
import { cloneGrid, createEmptyGrid } from "./grid";
import { createHistoryState } from "./history";
import { createFallbackMetrics } from "./metrics";
import type {
  CameraState,
  DocumentMetadata,
  EditorState,
  GridState,
  ToolOptions
} from "./types";

export interface ReplaceDocumentStateInput {
  grid: GridState;
  metadata: DocumentMetadata;
  view: CameraState;
}

export function createTimestamp(): string {
  return new Date().toISOString();
}

export function createDocumentMetadata(
  name = DEFAULT_DOCUMENT_NAME,
  timestamp = createTimestamp()
): DocumentMetadata {
  return {
    name,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createDefaultToolOptions(): ToolOptions {
  return {
    borderStyle: "simple",
    lineStyle: "ascii",
    arrowHead: "ascii",
    diamondStyle: "simple",
    freehandGlyph: "*",
    eraserSize: 1
  };
}

export function createDefaultCameraState(): CameraState {
  return {
    zoom: 1,
    panX: 0,
    panY: 0
  };
}

export function clearTransientEditorState(state: EditorState): void {
  state.previewGrid = null;
  state.selection.marquee = null;
  state.selection.movingCells = null;
  state.selection.movingOrigin = null;
  state.interaction.mode = "idle";
  state.interaction.pointerId = null;
  state.interaction.lastClientX = 0;
  state.interaction.lastClientY = 0;
  state.interaction.dragStartCell = null;
  state.interaction.currentCell = null;
  state.interaction.lastStrokeCell = null;
  state.interaction.isSpacePressed = false;
  state.textInput.active = false;
  state.textInput.anchor = null;
  state.textInput.isComposing = false;
  state.ui.overlay.cursorRect = null;
  state.ui.overlay.previewRect = null;
  state.ui.overlay.selectionRect = null;
  state.ui.overlay.moveRect = null;
  state.cursorCell = {
    col: 0,
    row: 0
  };
}

export function replaceDocumentState(
  state: EditorState,
  nextDocument: ReplaceDocumentStateInput
): void {
  state.grid = cloneGrid(nextDocument.grid);
  state.camera = {
    ...nextDocument.view
  };
  state.document.metadata = {
    ...nextDocument.metadata
  };
  state.document.isDirty = false;
  state.tool = "select";
  state.history = createHistoryState();
  clearTransientEditorState(state);
}

export function createInitialEditorState(): EditorState {
  return {
    grid: createEmptyGrid(),
    previewGrid: null,
    tool: "select",
    toolOptions: createDefaultToolOptions(),
    camera: createDefaultCameraState(),
    history: createHistoryState(),
    selection: {
      marquee: null,
      movingCells: null,
      movingOrigin: null
    },
    interaction: {
      mode: "idle",
      pointerId: null,
      lastClientX: 0,
      lastClientY: 0,
      dragStartCell: null,
      currentCell: null,
      lastStrokeCell: null,
      isSpacePressed: false
    },
    textInput: {
      active: false,
      anchor: null,
      isComposing: false
    },
    ui: {
      overlay: {
        cursorRect: null,
        previewRect: null,
        selectionRect: null,
        moveRect: null
      },
      toast: {
        message: STATUS_HINT,
        tone: "info"
      }
    },
    cellMetrics: createFallbackMetrics(),
    cursorCell: {
      col: 0,
      row: 0
    },
    document: {
      metadata: createDocumentMetadata(),
      isDirty: false
    }
  };
}
