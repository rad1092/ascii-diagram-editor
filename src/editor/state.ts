import { STATUS_HINT } from "./constants";
import { createEmptyGrid } from "./grid";
import { createHistoryState } from "./history";
import { createFallbackMetrics } from "./metrics";
import type { EditorState, ToolOptions } from "./types";

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

export function createInitialEditorState(): EditorState {
  return {
    grid: createEmptyGrid(),
    previewGrid: null,
    tool: "select",
    toolOptions: createDefaultToolOptions(),
    camera: {
      zoom: 1,
      panX: 0,
      panY: 0
    },
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
    }
  };
}
