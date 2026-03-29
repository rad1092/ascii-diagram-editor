import type { GridState } from "./types";

export function gridToLines(grid: GridState): string[] {
  return grid.map((row) => row.join(""));
}

export function gridToText(grid: GridState): string {
  return gridToLines(grid).join("\n");
}

export function serializeGridForClipboard(grid: GridState): string | null {
  let lines = gridToLines(grid).map((line) => line.replace(/\s+$/u, ""));

  while (lines.length > 0 && lines[0] === "") {
    lines = lines.slice(1);
  }

  while (lines.length > 0 && lines.at(-1) === "") {
    lines = lines.slice(0, -1);
  }

  if (lines.length === 0) {
    return null;
  }

  let minIndent = Number.POSITIVE_INFINITY;
  for (const line of lines) {
    if (line.length === 0) {
      continue;
    }
    const match = line.match(/^\s*/u);
    const indent = match?.[0].length ?? 0;
    minIndent = Math.min(minIndent, indent);
  }

  if (!Number.isFinite(minIndent)) {
    minIndent = 0;
  }

  return lines.map((line) => line.slice(minIndent)).join("\n");
}
