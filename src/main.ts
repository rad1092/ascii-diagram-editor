import "./app.css";

import { TOOL_LABELS } from "./editor/constants";
import { copyTextToClipboard } from "./editor/clipboard";
import {
  createDocumentFromEditorState,
  createEmptyDocument,
  documentFromImportedText,
  parseAsciiDocument,
  serializeAsciiDocument,
  textFromGridForExport,
  type AsciiDiagramDocumentV1
} from "./editor/document";
import { createEditorDom } from "./editor/dom";
import { getCell, writeMultilineText } from "./editor/grid";
import { pushHistorySnapshot, redoGrid, undoGrid } from "./editor/history";
import {
  detectImportedFileKind,
  deriveDocumentNameFromFile,
  getImportInputAccept,
  openImportedFile,
  saveExportedFile,
  suggestJsonExportFilename,
  suggestTextExportFilename
} from "./editor/importExport";
import { attachKeyboardController } from "./editor/input/keyboardController";
import { attachPointerController } from "./editor/input/pointerController";
import {
  createTextOverlayController,
  type TextOverlayController
} from "./editor/input/textOverlay";
import { measureCellMetrics } from "./editor/metrics";
import {
  clearStoredDocument,
  createPersistenceController,
  readStoredDocument
} from "./editor/persistence";
import { renderGridLayer } from "./editor/render/gridLayer";
import { renderOverlayLayer } from "./editor/render/overlayLayer";
import { renderTextLayer } from "./editor/render/textLayer";
import {
  createInitialEditorState,
  createTimestamp,
  replaceDocumentState
} from "./editor/state";
import { eraseMarqueeSelection, stampMovedSelection } from "./editor/tools/selectMove";
import { bindSidebar, renderSidebar } from "./editor/ui/sidebar";
import { renderStatusbar } from "./editor/ui/statusbar";
import { bindToolbar, renderToolbar } from "./editor/ui/toolbar";
import { createToastController } from "./editor/ui/toast";
import type { GridPoint, GridState, ToolKind } from "./editor/types";

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
        documentName: string;
        isDirty: boolean;
      };
      getHistoryDepth: () => { undo: number; redo: number };
      cellToClientPoint: (col: number, row: number) => { x: number; y: number };
    };
  }
}

const appRoot = document.querySelector<HTMLElement>("#app");

if (!appRoot) {
  throw new Error("Expected #app root");
}

const dom = createEditorDom(appRoot);
dom.importFileInput.accept = getImportInputAccept();

const maybeGridContext = dom.gridCanvas.getContext("2d");
const maybeOverlayContext = dom.overlayCanvas.getContext("2d");

if (!maybeGridContext || !maybeOverlayContext) {
  throw new Error("Could not acquire canvas contexts");
}

const gridContext = maybeGridContext;
const overlayContext = maybeOverlayContext;
const state = createInitialEditorState();
const toast = createToastController(dom.toast);

let startupToast:
  | { message: string; tone?: "success" | "error" }
  | null = null;
let restoredSerializedDocument: string | null = null;

const storedDocument = readStoredDocument();
if (storedDocument.ok && storedDocument.value) {
  const parsedDocument = parseAsciiDocument(storedDocument.value);
  if (parsedDocument.ok) {
    replaceDocumentState(state, {
      grid: parsedDocument.document.grid,
      metadata: parsedDocument.document.metadata,
      view: parsedDocument.document.view
    });
    restoredSerializedDocument = storedDocument.value;
    startupToast = {
      message: "Recovered previous session",
      tone: "success"
    };
  } else {
    clearStoredDocument();
    startupToast = {
      message: "Could not restore previous session",
      tone: "error"
    };
  }
} else if (!storedDocument.ok) {
  startupToast = {
    message: "Could not restore previous session",
    tone: "error"
  };
}

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

function getPersistableGrid(): GridState {
  if (
    state.interaction.mode === "moving" &&
    state.selection.movingCells &&
    state.selection.movingOrigin
  ) {
    const restoredGrid = state.grid.map((row) => [...row]);
    stampMovedSelection(restoredGrid, state.selection.movingCells, 0, 0);
    return restoredGrid;
  }

  return state.grid.map((row) => [...row]);
}

function createPersistableDocument(): AsciiDiagramDocumentV1 {
  return createDocumentFromEditorState({
    grid: getPersistableGrid(),
    camera: state.camera,
    document: state.document
  });
}

let textOverlay!: TextOverlayController;

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

const persistence = createPersistenceController({
  getSerializedDocument() {
    return serializeAsciiDocument(createPersistableDocument());
  },
  beforeLifecycleFlush() {
    if (state.textInput.active && !state.textInput.isComposing) {
      textOverlay.commit();
    }
  },
  onDidSave() {
    state.document.isDirty = false;
    renderApp();
  },
  onSaveError() {
    toast.show("Autosave unavailable in this browser context", "error");
    renderApp();
  }
});

if (restoredSerializedDocument) {
  persistence.markClean(restoredSerializedDocument);
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

function commitDocumentChange(): void {
  state.document.metadata.updatedAt = createTimestamp();
  state.document.isDirty = true;
  persistence.markDirty();
  persistence.scheduleAutosave();
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
  commitDocumentChange();
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
  commitDocumentChange();
  renderApp();
}

async function copyAscii(): Promise<void> {
  const text = textFromGridForExport(getPersistableGrid());
  if (!text) {
    toast.show("Canvas is empty", "error");
    return;
  }

  const copied = await copyTextToClipboard(text);
  toast.show(
    copied ? "Copied to clipboard" : "Copy failed - try Ctrl/Cmd+C",
    copied ? "success" : "error"
  );
}

function clearCanvas(): void {
  pushHistorySnapshot(state.history, state.grid);
  state.grid = state.grid.map((row) => row.map(() => " "));
  clearSelection();
  clearTransientVisuals();
  commitDocumentChange();
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
  commitDocumentChange();
  renderApp();
}

function escapeToSelect(): void {
  textOverlay.closeWithoutCommit();
  clearSelection();
  clearTransientVisuals();
  setTool("select");
}

function confirmReplaceCurrentDocument(): boolean {
  if (!state.document.isDirty) {
    return true;
  }

  return window.confirm("Discard unsaved changes and replace the current document?");
}

function applyDocument(
  nextDocument: AsciiDiagramDocumentV1,
  options: {
    persistToStorage: boolean;
    toastMessage?: string;
    toastTone?: "success" | "error";
  }
): void {
  textOverlay.closeWithoutCommit();
  replaceDocumentState(state, {
    grid: nextDocument.grid,
    metadata: nextDocument.metadata,
    view: nextDocument.view
  });

  const serializedDocument = serializeAsciiDocument(nextDocument);
  persistence.markClean(serializedDocument);
  if (options.persistToStorage) {
    persistence.persistSerializedDocument(serializedDocument);
  }

  renderApp();
  if (options.toastMessage) {
    toast.show(options.toastMessage, options.toastTone);
  }
}

async function exportTxt(): Promise<void> {
  if (state.textInput.active && !state.textInput.isComposing) {
    textOverlay.commit();
  }

  const text = textFromGridForExport(getPersistableGrid());
  await saveExportedFile(
    text,
    suggestTextExportFilename(state.document.metadata.name),
    "text/plain"
  );
  toast.show("Exported TXT", "success");
}

async function exportJson(): Promise<void> {
  if (state.textInput.active && !state.textInput.isComposing) {
    textOverlay.commit();
  }

  const serializedDocument = serializeAsciiDocument(createPersistableDocument());
  await saveExportedFile(
    serializedDocument,
    suggestJsonExportFilename(state.document.metadata.name),
    "application/json"
  );
  toast.show("Exported JSON", "success");
}

async function importDocument(): Promise<void> {
  if (!confirmReplaceCurrentDocument()) {
    return;
  }

  const importedFile = await openImportedFile(dom.importFileInput);
  if (!importedFile) {
    return;
  }

  const fileKind = detectImportedFileKind(importedFile);
  const importedName = deriveDocumentNameFromFile(importedFile.name);

  if (fileKind === "json") {
    const parsedDocument = parseAsciiDocument(
      importedFile.text,
      importedName,
      createTimestamp()
    );
    if (!parsedDocument.ok) {
      toast.show("Invalid ASCII document", "error");
      return;
    }

    applyDocument(parsedDocument.document, {
      persistToStorage: true,
      toastMessage: "Imported diagram",
      toastTone: "success"
    });
    return;
  }

  applyDocument(documentFromImportedText(importedFile.text, importedName), {
    persistToStorage: true,
    toastMessage: "Imported diagram",
    toastTone: "success"
  });
}

function createNewDocument(): void {
  if (!confirmReplaceCurrentDocument()) {
    return;
  }

  applyDocument(createEmptyDocument(), {
    persistToStorage: true,
    toastMessage: "Started new canvas"
  });
}

textOverlay = createTextOverlayController({
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
    commitDocumentChange();
    renderApp();
  },
  onClose() {
    renderApp();
  }
});

bindToolbar(dom, {
  onNewDocument: createNewDocument,
  onImport: () => {
    void importDocument();
  },
  onExportTxt: () => {
    void exportTxt();
  },
  onExportJson: () => {
    void exportJson();
  },
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
  commitDocumentChange,
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
persistence.bindLifecycle();

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
    panY: state.camera.panY,
    documentName: state.document.metadata.name,
    isDirty: state.document.isDirty
  }),
  getHistoryDepth: () => ({
    undo: state.history.undo.length,
    redo: state.history.redo.length
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

if (startupToast) {
  toast.show(startupToast.message, startupToast.tone);
} else {
  toast.show(`${TOOL_LABELS[state.tool]} ready`);
}
