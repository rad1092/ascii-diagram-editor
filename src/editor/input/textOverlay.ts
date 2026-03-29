import { cellToScreen } from "../camera";
import { COLS } from "../constants";
import type { EditorDom } from "../dom";
import type { CameraState, CellMetrics, EditorState, GridPoint } from "../types";

interface TextOverlayOptions {
  dom: EditorDom;
  state: EditorState;
  onCommit: (text: string, anchor: GridPoint) => void;
  onClose: () => void;
}

export interface TextOverlayController {
  open: (anchor: GridPoint) => void;
  closeWithoutCommit: () => void;
  commit: () => void;
  syncPosition: (camera: CameraState, metrics: CellMetrics) => void;
  isActive: () => boolean;
}

export function createTextOverlayController(
  options: TextOverlayOptions
): TextOverlayController {
  const { dom, state, onCommit, onClose } = options;
  const { textOverlay, textArea } = dom;

  const updateHeight = (): void => {
    textArea.style.height = "auto";
    textArea.style.height = `${Math.max(textArea.scrollHeight, 24)}px`;
  };

  const hide = (): void => {
    state.textInput.active = false;
    state.textInput.anchor = null;
    state.textInput.isComposing = false;
    textOverlay.style.display = "none";
    textArea.value = "";
    textArea.style.height = "auto";
    onClose();
  };

  const commit = (): void => {
    const anchor = state.textInput.anchor;
    const value = textArea.value;
    hide();
    if (anchor) {
      onCommit(value, anchor);
    }
  };

  textArea.addEventListener("input", updateHeight);
  textArea.addEventListener("blur", () => {
    if (state.textInput.active) {
      commit();
    }
  });
  textArea.addEventListener("compositionstart", () => {
    state.textInput.isComposing = true;
  });
  textArea.addEventListener("compositionend", () => {
    state.textInput.isComposing = false;
  });
  textArea.addEventListener("keydown", (event) => {
    if (state.textInput.isComposing) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      commit();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      commit();
    }
  });

  return {
    open(anchor) {
      state.textInput.active = true;
      state.textInput.anchor = anchor;
      state.textInput.isComposing = false;
      textArea.value = "";
      textOverlay.style.display = "block";
      textArea.focus();
      updateHeight();
    },
    closeWithoutCommit() {
      hide();
    },
    commit,
    syncPosition(camera, metrics) {
      if (!state.textInput.active || !state.textInput.anchor) {
        return;
      }

      const anchor = state.textInput.anchor;
      const { x, y } = cellToScreen(anchor, camera, metrics);
      const scaledWidth = metrics.width * camera.zoom;
      const scaledHeight = metrics.height * camera.zoom;
      textOverlay.style.left = `${x}px`;
      textOverlay.style.top = `${y}px`;
      textArea.style.fontSize = `${metrics.fontSize * camera.zoom}px`;
      textArea.style.lineHeight = String(metrics.lineHeight);
      textArea.style.width = `${Math.max(140, (COLS - anchor.col) * scaledWidth)}px`;
      textArea.style.minHeight = `${scaledHeight}px`;
      updateHeight();
    },
    isActive() {
      return state.textInput.active;
    }
  };
}
