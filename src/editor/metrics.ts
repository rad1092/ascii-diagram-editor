import { MONO_FONT_SIZE, MONO_LINE_HEIGHT } from "./constants";
import type { CellMetrics } from "./types";

export function createFallbackMetrics(): CellMetrics {
  return {
    width: 9.6,
    height: MONO_FONT_SIZE * MONO_LINE_HEIGHT,
    fontSize: MONO_FONT_SIZE,
    lineHeight: MONO_LINE_HEIGHT
  };
}

export function measureCellMetrics(documentRef: Document): CellMetrics {
  const sample = documentRef.createElement("span");
  sample.textContent = "M";
  sample.className = "ascii-measure";
  documentRef.body.appendChild(sample);
  const rect = sample.getBoundingClientRect();
  sample.remove();

  return {
    width: rect.width || createFallbackMetrics().width,
    height: rect.height || createFallbackMetrics().height,
    fontSize: MONO_FONT_SIZE,
    lineHeight: MONO_LINE_HEIGHT
  };
}
