import "./app.css";

import { TOOL_LABELS } from "./editor/constants";
import { copyTextToClipboard } from "./editor/clipboard";
import { createEditorDom } from "./editor/dom";
import { getCell, writeMultilineText } from "./editor/grid";
import { pushHistorySnapshot, redoGrid, undoGrid } from "./editor/history";
import { attachKeyboardController } from "./editor/input/keyboardController";
import { attachPointerController } from "./editor/input/pointerController";
import { createTextOverlayController } from "./editor/input/textOverlay";
import { measureCellMetrics } from "./editor/metrics";
import { renderGridLayer } from "./editor/render/gridLayer";
import { renderOverlayLayer } from "./editor/render/overlayLayer";
import { renderTextLayer } from "./editor/render/textLayer";
import { serializeGridForClipboard } from "./editor/serialize";
import { createInitialEditorState } from "./editor/state";
import { eraseMarqueeSelection } from "./editor/tools/selectMove";
import { bindSidebar, renderSidebar } from "./editor/ui/sidebar";
import { renderStatusbar } from "./editor/ui/statusbar";
import { bindToolbar, renderToolbar } from "./editor/ui/toolbar";
import { createToastController } from "./editor/ui/toast";
import type { GridPoint, ToolKind } from "./editor/types";

declare global {
  interface Window {
    __ASCII_EDITOR_DEBUG__?: {
      getSerializedGrid: () => string;
      getMetrics: () => { width: number; height: number };
      getState: () => {
        tool: ToolKind;
        zoom: number;
        panX: number;
        panY: number;
      };
      cellToClientPoint: (col: number, row: number) => { x: number; y: number };
    };
  }
}

const appRoot = document.querySelector<HTMLElement>("#app");

if (!appRoot) {
  throw new Error("Expected #app root");
}

const dom = createEditorDom(appRoot);
const maybeGridContext = dom.gridCanvas.getContext("2d");
const maybeOverlayContext = dom.overlayCanvas.getContext("2d");

if (!maybeGridContext || !maybeOverlayContext) {
  throw new Error("Could not acquire canvas contexts");
}

const gridContext = maybeGridContext;
const overlayContext = maybeOverlayContext;

const state = createInitialEditorState();
const toast = createToastController(dom.toast);

function clearSelection(): void {
  state.selection.marquee = null;
  state.ui.overlay.selectionRect = null;
}

function clearTransientVisuals(): void {
  state.previewGrid = null;
  state.ui.overlay.previewRect = null;
  state.ui.overlay.moveRect = null;
}

function syncMeasurements(): void {
  state.cellMetrics = measureCellMetrics(document);
}

function computeInteractionCursor(): string {
  if (state.textInput.active) {
    return "text";
  }

  if (state.interaction.mode === "panning") {
    return "grabbing";
  }

  if (state.interaction.isSpacePressed) {
    return "grab";
  }

  if (state.interaction.mode === "moving") {
    return "move";
  }

  if (state.tool === "select") {
    return getCell(state.grid, state.cursorCell.row, state.cursorCell.col) !== " "
      ? "move"
      : "default";
  }

  if (state.tool === "text") {
    return "text";
  }

  if (state.tool === "eraser") {
    return "cell";
  }

  return "crosshair";
}

function renderApp(): void {
  renderTextLayer(
    dom.asciiCanvas,
    state.previewGrid ?? state.grid,
    state.camera,
    state.cellMetrics
  );
  renderGridLayer(dom.gridCanvas, gridContext, state.camera, state.cellMetrics);
  renderOverlayLayer(
    dom.overlayCanvas,
    overlayContext,
    state.ui.overlay,
    state.camera,
    state.cellMetrics
  );
  renderToolbar(dom, state);
  renderSidebar(dom, state);
  renderStatusbar(dom, state);
  textOverlay.syncPosition(state.camera, state.cellMetrics);
  dom.interactionLayer.style.cursor = computeInteractionCursor();
}

function setTool(tool: ToolKind): void {
  state.tool = tool;
  clearSelection();
  clearTransientVisuals();
  state.ui.overlay.cursorRect = null;
  renderApp();
}

function applyUndo(): void {
  const nextGrid = undoGrid(state.history, state.grid);
  if (!nextGrid) {
    return;
  }

  textOverlay.closeWithoutCommit();
  state.grid = nextGrid;
  clearSelection();
  clearTransientVisuals();
  renderApp();
}

function applyRedo(): void {
  const nextGrid = redoGrid(state.history, state.grid);
  if (!nextGrid) {
    return;
  }

  textOverlay.closeWithoutCommit();
  state.grid = nextGrid;
  clearSelection();
  clearTransientVisuals();
  renderApp();
}

async function copyAscii(): Promise<void> {
  const text = serializeGridForClipboard(state.grid);
  if (!text) {
    toast.show("Canvas is empty", "error");
    return;
  }

  const copied = await copyTextToClipboard(text);
  toast.show(
    copied ? "Copied to clipboard" : "Copy failed — try Ctrl/Cmd+C",
    copied ? "success" : "error"
  );
}

function clearCanvas(): void {
  pushHistorySnapshot(state.history, state.grid);
  state.grid = state.grid.map((row) => row.map(() => " "));
  clearSelection();
  clearTransientVisuals();
  toast.show("Canvas cleared");
  renderApp();
}

function deleteSelection(): void {
  if (!state.selection.marquee) {
    return;
  }

  pushHistorySnapshot(state.history, state.grid);
  eraseMarqueeSelection(state.grid, state.selection.marquee);
  clearSelection();
  clearTransientVisuals();
  renderApp();
}

function escapeToSelect(): void {
  textOverlay.closeWithoutCommit();
  clearSelection();
  clearTransientVisuals();
  setTool("select");
}

const textOverlay = createTextOverlayController({
  dom,
  state,
  onCommit(text, anchor) {
    if (text.length === 0) {
      renderApp();
      return;
    }

    pushHistorySnapshot(state.history, state.grid);
    writeMultilineText(state.grid, anchor, text);
    clearTransientVisuals();
    renderApp();
  },
  onClose() {
    renderApp();
  }
});

bindToolbar(dom, {
  onToolSelect: setTool,
  onUndo: applyUndo,
  onRedo: applyRedo,
  onClear: clearCanvas,
  onCopy: () => {
    void copyAscii();
  }
});

bindSidebar(dom, {
  onBorderStyleChange(style) {
    state.toolOptions.borderStyle = style;
    renderApp();
  },
  onLineStyleChange(style) {
    state.toolOptions.lineStyle = style;
    renderApp();
  },
  onArrowHeadChange(style) {
    state.toolOptions.arrowHead = style;
    renderApp();
  },
  onFreehandGlyphChange(glyph) {
    state.toolOptions.freehandGlyph = glyph;
    renderApp();
  },
  onEraserSizeChange(size) {
    state.toolOptions.eraserSize = size;
    renderApp();
  },
  onDiamondStyleChange(style) {
    state.toolOptions.diamondStyle = style;
    renderApp();
  }
});

attachKeyboardController(dom, state, {
  setTool,
  undo: applyUndo,
  redo: applyRedo,
  copy: copyAscii,
  deleteSelection,
  escapeToSelect,
  render: renderApp
});

attachPointerController(dom, state, {
  render: renderApp,
  openTextInput(point: GridPoint) {
    clearSelection();
    clearTransientVisuals();
    textOverlay.open(point);
  },
  clearSelection
});

syncMeasurements();
setTool("select");
renderApp();

window.addEventListener("resize", () => {
  syncMeasurements();
  renderApp();
});

if ("fonts" in document) {
  void document.fonts.ready.then(() => {
    syncMeasurements();
    renderApp();
  });
}

window.__ASCII_EDITOR_DEBUG__ = {
  getSerializedGrid: () => dom.asciiCanvas.textContent ?? "",
  getMetrics: () => ({
    width: state.cellMetrics.width,
    height: state.cellMetrics.height
  }),
  getState: () => ({
    tool: state.tool,
    zoom: state.camera.zoom,
    panX: state.camera.panX,
    panY: state.camera.panY
  }),
  cellToClientPoint: (col, row) => {
    const rect = dom.canvasContainer.getBoundingClientRect();
    const x =
      rect.left +
      state.camera.panX +
      col * state.cellMetrics.width * state.camera.zoom +
      state.cellMetrics.width * state.camera.zoom * 0.5;
    const y =
      rect.top +
      state.camera.panY +
      row * state.cellMetrics.height * state.camera.zoom +
      state.cellMetrics.height * state.camera.zoom * 0.5;
    return { x, y };
  }
};

toast.show(`${TOOL_LABELS[state.tool]} ready`);
