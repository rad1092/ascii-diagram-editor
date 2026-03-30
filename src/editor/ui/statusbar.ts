import { COLS, ROWS, STATUS_HINT, TOOL_LABELS } from "../constants";
import type { EditorDom } from "../dom";
import type { EditorState } from "../types";

export function renderStatusbar(dom: EditorDom, state: EditorState): void {
  dom.statusCursor.textContent = `${state.cursorCell.col}, ${state.cursorCell.row}`;
  dom.statusCanvas.textContent = `${COLS} x ${ROWS}`;
  dom.statusZoom.textContent = `${Math.round(state.camera.zoom * 100)}%`;
  dom.statusTool.textContent = TOOL_LABELS[state.tool];
  dom.statusDirty.textContent = state.document.isDirty ? "Edited" : "Saved";
  dom.statusDirty.dataset.dirty = String(state.document.isDirty);
  dom.statusHint.textContent = STATUS_HINT;
}
