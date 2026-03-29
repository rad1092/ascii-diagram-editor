import { COLS, MAX_ZOOM, MIN_ZOOM, ROWS, ZOOM_STEP } from "./constants";
import type { CameraState, CellMetrics, GridPoint, GridRect } from "./types";

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function zoomCameraAtPoint(
  camera: CameraState,
  deltaY: number,
  anchorX: number,
  anchorY: number
): CameraState {
  const nextZoom = clampZoom(
    camera.zoom + (deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
  );

  if (nextZoom === camera.zoom) {
    return camera;
  }

  const ratio = nextZoom / camera.zoom;
  return {
    zoom: nextZoom,
    panX: anchorX - ratio * (anchorX - camera.panX),
    panY: anchorY - ratio * (anchorY - camera.panY)
  };
}

export function screenToCell(
  containerRect: DOMRect,
  clientX: number,
  clientY: number,
  camera: CameraState,
  metrics: CellMetrics
): GridPoint {
  const localX = clientX - containerRect.left;
  const localY = clientY - containerRect.top;
  const scaledWidth = metrics.width * camera.zoom;
  const scaledHeight = metrics.height * camera.zoom;
  const col = Math.floor((localX - camera.panX) / scaledWidth);
  const row = Math.floor((localY - camera.panY) / scaledHeight);

  return {
    col: Math.min(COLS - 1, Math.max(0, col)),
    row: Math.min(ROWS - 1, Math.max(0, row))
  };
}

export function cellToScreen(
  point: GridPoint,
  camera: CameraState,
  metrics: CellMetrics
): { x: number; y: number } {
  return {
    x: camera.panX + point.col * metrics.width * camera.zoom,
    y: camera.panY + point.row * metrics.height * camera.zoom
  };
}

export function rectToScreenBox(
  rect: GridRect,
  camera: CameraState,
  metrics: CellMetrics
): { x: number; y: number; width: number; height: number } {
  return {
    x: camera.panX + rect.left * metrics.width * camera.zoom,
    y: camera.panY + rect.top * metrics.height * camera.zoom,
    width: (rect.right - rect.left + 1) * metrics.width * camera.zoom,
    height: (rect.bottom - rect.top + 1) * metrics.height * camera.zoom
  };
}
