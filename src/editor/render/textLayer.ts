import type { CameraState, CellMetrics, GridState } from "../types";
import { gridToText } from "../serialize";

export function renderTextLayer(
  element: HTMLPreElement,
  grid: GridState,
  camera: CameraState,
  metrics: CellMetrics
): void {
  element.textContent = gridToText(grid);
  element.style.fontSize = `${metrics.fontSize}px`;
  element.style.lineHeight = String(metrics.lineHeight);
  element.style.transform = `translate(${camera.panX}px, ${camera.panY}px) scale(${camera.zoom})`;
}
