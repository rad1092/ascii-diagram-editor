import { screenToCell, zoomCameraAtPoint } from "../camera";
import { cloneGrid, computeCellsBounds, getCell, normalizeRect } from "../grid";
import { pushHistorySnapshot } from "../history";
import { drawArrow } from "../tools/arrow";
import { drawDiamond } from "../tools/diamond";
import { eraseArea } from "../tools/eraser";
import { drawFreehandCell } from "../tools/freehand";
import { drawLine } from "../tools/line";
import { drawRectangle } from "../tools/rectangle";
import {
  getMovedSelectionBounds,
  liftConnectedSelection,
  stampMovedSelection
} from "../tools/selectMove";
import type { EditorDom } from "../dom";
import type {
  EditorState,
  GridPoint,
  InteractionMode
} from "../types";

interface PointerActions {
  render: () => void;
  openTextInput: (point: GridPoint) => void;
  clearSelection: () => void;
}

function setInteractionMode(
  state: EditorState,
  mode: InteractionMode,
  pointerId: number | null
): void {
  state.interaction.mode = mode;
  state.interaction.pointerId = pointerId;
}

function clearPreviewState(state: EditorState): void {
  state.previewGrid = null;
  state.ui.overlay.previewRect = null;
  state.ui.overlay.moveRect = null;
}

function setCursorHighlight(state: EditorState, size: number): void {
  const half = Math.floor(size / 2);
  state.ui.overlay.cursorRect = {
    left: state.cursorCell.col - half,
    right: state.cursorCell.col + half,
    top: state.cursorCell.row - half,
    bottom: state.cursorCell.row + half
  };
}

export function attachPointerController(
  dom: EditorDom,
  state: EditorState,
  actions: PointerActions
): void {
  const interaction = dom.interactionLayer;

  function updateCursorCell(clientX: number, clientY: number): GridPoint {
    const nextCell = screenToCell(
      dom.canvasContainer.getBoundingClientRect(),
      clientX,
      clientY,
      state.camera,
      state.cellMetrics
    );
    state.cursorCell = nextCell;
    return nextCell;
  }

  function capturePointer(event: PointerEvent): void {
    if (!interaction.hasPointerCapture(event.pointerId)) {
      interaction.setPointerCapture(event.pointerId);
    }
  }

  function beginPan(event: PointerEvent): void {
    setInteractionMode(state, "panning", event.pointerId);
    state.interaction.lastClientX = event.clientX;
    state.interaction.lastClientY = event.clientY;
    capturePointer(event);
  }

  function beginMove(event: PointerEvent, point: GridPoint): void {
    pushHistorySnapshot(state.history, state.grid);
    const lifted = liftConnectedSelection(state.grid, point);
    if (lifted.length === 0) {
      return;
    }

    state.selection.marquee = null;
    state.ui.overlay.selectionRect = null;
    state.selection.movingCells = lifted;
    state.selection.movingOrigin = point;
    state.interaction.dragStartCell = point;
    state.interaction.currentCell = point;
    clearPreviewState(state);
    setInteractionMode(state, "moving", event.pointerId);
    capturePointer(event);

    state.previewGrid = cloneGrid(state.grid);
    stampMovedSelection(state.previewGrid, lifted, 0, 0);
    state.ui.overlay.moveRect = computeCellsBounds(lifted);
  }

  function beginDraw(event: PointerEvent, point: GridPoint): void {
    state.interaction.dragStartCell = point;
    state.interaction.currentCell = point;
    state.interaction.lastStrokeCell = point;
    setInteractionMode(state, "drawing", event.pointerId);
    capturePointer(event);

    if (state.tool === "freehand") {
      pushHistorySnapshot(state.history, state.grid);
      drawFreehandCell(state.grid, point, state.toolOptions.freehandGlyph);
      setCursorHighlight(state, 1);
      return;
    }

    if (state.tool === "eraser") {
      pushHistorySnapshot(state.history, state.grid);
      eraseArea(state.grid, point, state.toolOptions.eraserSize);
      setCursorHighlight(state, state.toolOptions.eraserSize);
      return;
    }

    if (state.tool === "select") {
      state.selection.marquee = null;
      state.ui.overlay.selectionRect = normalizeRect(point, point);
      return;
    }

    state.ui.overlay.previewRect = normalizeRect(point, point);
  }

  function updateShapePreview(start: GridPoint, current: GridPoint): void {
    state.previewGrid = cloneGrid(state.grid);
    state.ui.overlay.previewRect = normalizeRect(start, current);

    if (state.tool === "rect") {
      drawRectangle(
        state.previewGrid,
        start,
        current,
        state.toolOptions.borderStyle
      );
      return;
    }

    if (state.tool === "diamond") {
      drawDiamond(
        state.previewGrid,
        start,
        current,
        state.toolOptions.diamondStyle
      );
      return;
    }

    if (state.tool === "line") {
      drawLine(state.previewGrid, start, current, state.toolOptions.lineStyle);
      return;
    }

    if (state.tool === "arrow") {
      drawArrow(
        state.previewGrid,
        start,
        current,
        state.toolOptions.lineStyle,
        state.toolOptions.arrowHead
      );
    }
  }

  function endInteraction(cancelled: boolean): void {
    if (
      state.interaction.pointerId !== null &&
      interaction.hasPointerCapture(state.interaction.pointerId)
    ) {
      interaction.releasePointerCapture(state.interaction.pointerId);
    }

    if (cancelled && state.interaction.mode === "moving") {
      const movingCells = state.selection.movingCells;
      if (movingCells) {
        stampMovedSelection(state.grid, movingCells, 0, 0);
      }
    }

    setInteractionMode(state, "idle", null);
    state.interaction.dragStartCell = null;
    state.interaction.currentCell = null;
    state.interaction.lastStrokeCell = null;
    state.selection.movingCells = null;
    state.selection.movingOrigin = null;
    state.ui.overlay.moveRect = null;
    clearPreviewState(state);
  }

  interaction.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    interaction.focus();

    const point = updateCursorCell(event.clientX, event.clientY);
    actions.clearSelection();

    if (state.interaction.isSpacePressed || event.button === 1) {
      beginPan(event);
      actions.render();
      return;
    }

    if (event.button !== 0) {
      actions.render();
      return;
    }

    if (state.tool === "text") {
      actions.openTextInput(point);
      actions.render();
      return;
    }

    if (state.tool === "select" && getCell(state.grid, point.row, point.col) !== " ") {
      beginMove(event, point);
      actions.render();
      return;
    }

    beginDraw(event, point);
    actions.render();
  });

  interaction.addEventListener("pointermove", (event) => {
    const point = updateCursorCell(event.clientX, event.clientY);

    if (
      state.interaction.mode === "panning" &&
      state.interaction.pointerId === event.pointerId
    ) {
      state.camera.panX += event.clientX - state.interaction.lastClientX;
      state.camera.panY += event.clientY - state.interaction.lastClientY;
      state.interaction.lastClientX = event.clientX;
      state.interaction.lastClientY = event.clientY;
      actions.render();
      return;
    }

    if (
      state.interaction.mode === "moving" &&
      state.interaction.pointerId === event.pointerId
    ) {
      const movingOrigin = state.selection.movingOrigin;
      const movingCells = state.selection.movingCells;
      if (!movingOrigin || !movingCells) {
        return;
      }

      const deltaCol = point.col - movingOrigin.col;
      const deltaRow = point.row - movingOrigin.row;
      state.previewGrid = cloneGrid(state.grid);
      stampMovedSelection(state.previewGrid, movingCells, deltaCol, deltaRow);
      state.ui.overlay.moveRect =
        getMovedSelectionBounds(movingCells, deltaCol, deltaRow);
      actions.render();
      return;
    }

    if (
      state.interaction.mode === "drawing" &&
      state.interaction.pointerId === event.pointerId
    ) {
      const start = state.interaction.dragStartCell;
      if (!start) {
        return;
      }

      state.interaction.currentCell = point;

      if (state.tool === "freehand") {
        const lastCell = state.interaction.lastStrokeCell;
        if (!lastCell || lastCell.col !== point.col || lastCell.row !== point.row) {
          drawFreehandCell(state.grid, point, state.toolOptions.freehandGlyph);
          state.interaction.lastStrokeCell = point;
        }
        setCursorHighlight(state, 1);
        actions.render();
        return;
      }

      if (state.tool === "eraser") {
        const lastCell = state.interaction.lastStrokeCell;
        if (!lastCell || lastCell.col !== point.col || lastCell.row !== point.row) {
          eraseArea(state.grid, point, state.toolOptions.eraserSize);
          state.interaction.lastStrokeCell = point;
        }
        setCursorHighlight(state, state.toolOptions.eraserSize);
        actions.render();
        return;
      }

      if (state.tool === "select") {
        state.ui.overlay.selectionRect = normalizeRect(start, point);
        actions.render();
        return;
      }

      updateShapePreview(start, point);
      actions.render();
      return;
    }

    clearPreviewState(state);

    if (state.tool === "eraser") {
      setCursorHighlight(state, state.toolOptions.eraserSize);
    } else if (state.tool === "freehand") {
      setCursorHighlight(state, 1);
    } else {
      state.ui.overlay.cursorRect = null;
    }

    actions.render();
  });

  function finalizeShape(): void {
    const start = state.interaction.dragStartCell;
    const current = state.interaction.currentCell ?? start;
    if (!start || !current) {
      return;
    }

    if (state.tool === "rect") {
      const rect = normalizeRect(start, current);
      if (rect.right - rect.left >= 1 && rect.bottom - rect.top >= 1) {
        pushHistorySnapshot(state.history, state.grid);
        drawRectangle(state.grid, start, current, state.toolOptions.borderStyle);
      }
      return;
    }

    if (state.tool === "diamond") {
      const rect = normalizeRect(start, current);
      if (rect.right - rect.left >= 2 && rect.bottom - rect.top >= 2) {
        pushHistorySnapshot(state.history, state.grid);
        drawDiamond(state.grid, start, current, state.toolOptions.diamondStyle);
      }
      return;
    }

    if (state.tool === "line") {
      pushHistorySnapshot(state.history, state.grid);
      drawLine(state.grid, start, current, state.toolOptions.lineStyle);
      return;
    }

    if (state.tool === "arrow") {
      pushHistorySnapshot(state.history, state.grid);
      drawArrow(
        state.grid,
        start,
        current,
        state.toolOptions.lineStyle,
        state.toolOptions.arrowHead
      );
      return;
    }

    if (state.tool === "select") {
      const rect = normalizeRect(start, current);
      state.selection.marquee = rect;
      state.ui.overlay.selectionRect = rect;
    }
  }

  interaction.addEventListener("pointerup", (event) => {
    if (state.interaction.pointerId !== event.pointerId) {
      return;
    }

    const point = updateCursorCell(event.clientX, event.clientY);

    if (state.interaction.mode === "moving") {
      const movingOrigin = state.selection.movingOrigin;
      const movingCells = state.selection.movingCells;
      if (movingOrigin && movingCells) {
        stampMovedSelection(
          state.grid,
          movingCells,
          point.col - movingOrigin.col,
          point.row - movingOrigin.row
        );
      }
      endInteraction(false);
      actions.render();
      return;
    }

    if (state.interaction.mode === "drawing") {
      state.interaction.currentCell = point;
      finalizeShape();
      endInteraction(false);
      actions.render();
      return;
    }

    endInteraction(false);
    actions.render();
  });

  const cancelPointer = (event: PointerEvent): void => {
    if (state.interaction.pointerId !== event.pointerId) {
      return;
    }

    endInteraction(true);
    actions.render();
  };

  interaction.addEventListener("pointercancel", cancelPointer);
  interaction.addEventListener("lostpointercapture", () => {
    if (state.interaction.mode !== "idle") {
      endInteraction(true);
      actions.render();
    }
  });

  dom.canvasContainer.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const rect = dom.canvasContainer.getBoundingClientRect();
      const anchorX = event.clientX - rect.left;
      const anchorY = event.clientY - rect.top;
      state.camera = zoomCameraAtPoint(state.camera, event.deltaY, anchorX, anchorY);
      actions.render();
    },
    { passive: false }
  );

  interaction.addEventListener("contextmenu", (event) => event.preventDefault());
  interaction.addEventListener("dragstart", (event) => event.preventDefault());
  interaction.addEventListener("selectstart", (event) => event.preventDefault());
}
