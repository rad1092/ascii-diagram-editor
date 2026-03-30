import type { EditorDom } from "../dom";
import type { EditorState, ToolKind } from "../types";

interface ToolbarHandlers {
  onNewDocument: () => void;
  onImport: () => void;
  onExportTxt: () => void;
  onExportJson: () => void;
  onToolSelect: (tool: ToolKind) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onCopy: () => void;
}

export function bindToolbar(dom: EditorDom, handlers: ToolbarHandlers): void {
  dom.toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onToolSelect(button.dataset.tool as ToolKind);
    });
  });

  dom.newDocumentButton.addEventListener("click", handlers.onNewDocument);
  dom.importButton.addEventListener("click", handlers.onImport);
  dom.exportTxtButton.addEventListener("click", handlers.onExportTxt);
  dom.exportJsonButton.addEventListener("click", handlers.onExportJson);
  dom.undoButton.addEventListener("click", handlers.onUndo);
  dom.redoButton.addEventListener("click", handlers.onRedo);
  dom.clearButton.addEventListener("click", handlers.onClear);
  dom.copyButton.addEventListener("click", handlers.onCopy);
}

export function renderToolbar(dom: EditorDom, state: EditorState): void {
  dom.documentName.textContent = state.document.metadata.name;

  dom.toolButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === state.tool);
  });

  dom.undoButton.disabled = state.history.undo.length === 0;
  dom.redoButton.disabled = state.history.redo.length === 0;
}
