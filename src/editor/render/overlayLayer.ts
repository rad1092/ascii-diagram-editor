import { rectToScreenBox } from "../camera";
import { ensureCanvasResolution } from "../dom";
import type {
  CameraState,
  CellMetrics,
  GridRect,
  OverlayVisualState
} from "../types";

function drawFilledRect(
  context: CanvasRenderingContext2D,
  rect: GridRect,
  camera: CameraState,
  metrics: CellMetrics,
  fill: string,
  stroke?: string
): void {
  const box = rectToScreenBox(rect, camera, metrics);
  context.fillStyle = fill;
  context.fillRect(box.x, box.y, box.width, box.height);

  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = 1;
    context.strokeRect(box.x, box.y, box.width, box.height);
  }
}

function drawDashedRect(
  context: CanvasRenderingContext2D,
  rect: GridRect,
  camera: CameraState,
  metrics: CellMetrics,
  stroke: string
): void {
  const box = rectToScreenBox(rect, camera, metrics);
  context.strokeStyle = stroke;
  context.lineWidth = 1;
  context.setLineDash([6, 4]);
  context.strokeRect(box.x, box.y, box.width, box.height);
  context.setLineDash([]);
}

export function renderOverlayLayer(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  overlay: OverlayVisualState,
  camera: CameraState,
  metrics: CellMetrics
): void {
  const viewport = ensureCanvasResolution(canvas, context);
  context.clearRect(0, 0, viewport.width, viewport.height);

  if (overlay.cursorRect) {
    drawFilledRect(
      context,
      overlay.cursorRect,
      camera,
      metrics,
      "rgba(106, 177, 181, 0.14)"
    );
  }

  if (overlay.previewRect) {
    drawFilledRect(
      context,
      overlay.previewRect,
      camera,
      metrics,
      "rgba(106, 177, 181, 0.08)",
      "rgba(106, 177, 181, 0.28)"
    );
  }

  if (overlay.moveRect) {
    drawDashedRect(
      context,
      overlay.moveRect,
      camera,
      metrics,
      "rgba(255, 231, 156, 0.8)"
    );
  }

  if (overlay.selectionRect) {
    drawDashedRect(
      context,
      overlay.selectionRect,
      camera,
      metrics,
      "rgba(106, 177, 181, 0.82)"
    );
  }
}
