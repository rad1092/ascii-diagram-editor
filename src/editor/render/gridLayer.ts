import type { CameraState, CellMetrics } from "../types";
import { ensureCanvasResolution } from "../dom";

export function renderGridLayer(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  camera: CameraState,
  metrics: CellMetrics
): void {
  const viewport = ensureCanvasResolution(canvas, context);
  context.clearRect(0, 0, viewport.width, viewport.height);

  if (camera.zoom < 0.5) {
    return;
  }

  const cellWidth = metrics.width * camera.zoom;
  const cellHeight = metrics.height * camera.zoom;
  const startCol = Math.floor(-camera.panX / cellWidth);
  const endCol = Math.ceil((viewport.width - camera.panX) / cellWidth);
  const startRow = Math.floor(-camera.panY / cellHeight);
  const endRow = Math.ceil((viewport.height - camera.panY) / cellHeight);

  context.beginPath();
  context.strokeStyle = "rgba(255, 255, 255, 0.045)";
  context.lineWidth = 0.5;

  for (let col = startCol; col <= endCol; col += 1) {
    const x = camera.panX + col * cellWidth;
    if (x >= 0 && x <= viewport.width) {
      context.moveTo(Math.round(x) + 0.5, 0);
      context.lineTo(Math.round(x) + 0.5, viewport.height);
    }
  }

  for (let row = startRow; row <= endRow; row += 1) {
    const y = camera.panY + row * cellHeight;
    if (y >= 0 && y <= viewport.height) {
      context.moveTo(0, Math.round(y) + 0.5);
      context.lineTo(viewport.width, Math.round(y) + 0.5);
    }
  }

  context.stroke();
}
