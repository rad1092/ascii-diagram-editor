import type { EditorDom } from "../dom";
import type { EditorState, ToolKind } from "../types";

interface KeyboardActions {
  setTool: (tool: ToolKind) => void;
  undo: () => void;
  redo: () => void;
  copy: () => Promise<void> | void;
  deleteSelection: () => void;
  escapeToSelect: () => void;
  render: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function attachKeyboardController(
  dom: EditorDom,
  state: EditorState,
  actions: KeyboardActions
): void {
  const toolMap: Record<string, ToolKind> = {
    v: "select",
    r: "rect",
    d: "diamond",
    l: "line",
    a: "arrow",
    t: "text",
    f: "freehand",
    e: "eraser"
  };

  document.addEventListener("keydown", (event) => {
    if (state.textInput.active || isEditableTarget(event.target)) {
      return;
    }

    if (event.code === "Space" && !state.interaction.isSpacePressed) {
      event.preventDefault();
      state.interaction.isSpacePressed = true;
      actions.render();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          actions.redo();
        } else {
          actions.undo();
        }
        return;
      }

      if (key === "y") {
        event.preventDefault();
        actions.redo();
        return;
      }

      if (event.shiftKey && key === "c") {
        event.preventDefault();
        void actions.copy();
        return;
      }
    }

    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      state.selection.marquee
    ) {
      event.preventDefault();
      actions.deleteSelection();
      return;
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      const tool = toolMap[event.key.toLowerCase()];
      if (tool) {
        event.preventDefault();
        actions.setTool(tool);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        actions.escapeToSelect();
      }
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.code !== "Space") {
      return;
    }

    state.interaction.isSpacePressed = false;
    actions.render();
  });

  dom.interactionLayer.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
    }
  });
}
