import { clampZoom } from "./camera";
import { COLS, DEFAULT_DOCUMENT_NAME, ROWS } from "./constants";
import { createEmptyGrid, setCell } from "./grid";
import { gridToText, serializeGridForClipboard } from "./serialize";
import { createDefaultCameraState, createDocumentMetadata } from "./state";
import type {
  CameraState,
  DocumentMetadata,
  EditorState,
  GridState
} from "./types";

export const ASCII_DIAGRAM_DOCUMENT_KIND = "ascii-diagram-document";
export const ASCII_DIAGRAM_DOCUMENT_VERSION = 1;

export interface AsciiDiagramDocumentV1 {
  version: 1;
  kind: "ascii-diagram-document";
  grid: string[][];
  metadata: DocumentMetadata;
  view: CameraState;
}

export interface DocumentParseSuccess {
  ok: true;
  document: AsciiDiagramDocumentV1;
}

export interface DocumentParseFailure {
  ok: false;
  message: string;
}

export type DocumentParseResult = DocumentParseSuccess | DocumentParseFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function normalizeDocumentName(value: unknown): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : DEFAULT_DOCUMENT_NAME;
}

function normalizeCameraValue(
  view: Record<string, unknown> | null | undefined
): CameraState {
  const fallback = createDefaultCameraState();
  if (!view) {
    return fallback;
  }

  const zoom = typeof view.zoom === "number" && Number.isFinite(view.zoom)
    ? clampZoom(view.zoom)
    : fallback.zoom;
  const panX = typeof view.panX === "number" && Number.isFinite(view.panX)
    ? view.panX
    : fallback.panX;
  const panY = typeof view.panY === "number" && Number.isFinite(view.panY)
    ? view.panY
    : fallback.panY;

  return { zoom, panX, panY };
}

function validateAndCloneGrid(
  value: unknown
): GridState | { ok: false; message: string } {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      message: "Document grid must be an array of rows."
    };
  }

  if (value.length !== ROWS) {
    return {
      ok: false,
      message: `Document grid must have exactly ${ROWS} rows.`
    };
  }

  const normalized = createEmptyGrid();
  for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
    const row = value[rowIndex];
    if (!Array.isArray(row)) {
      return {
        ok: false,
        message: `Document row ${rowIndex} must be an array.`
      };
    }

    if (row.length !== COLS) {
      return {
        ok: false,
        message: `Document row ${rowIndex} must have exactly ${COLS} columns.`
      };
    }

    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      const cell = row[colIndex];
      if (typeof cell !== "string") {
        return {
          ok: false,
          message: `Document cell ${rowIndex},${colIndex} must be a string.`
        };
      }
      setCell(normalized, rowIndex, colIndex, cell);
    }
  }

  return normalized;
}

export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/gu, "\n");
}

export function gridFromText(text: string): GridState {
  const normalized = createEmptyGrid();
  const lines = normalizeLineEndings(text).split("\n");

  lines.slice(0, ROWS).forEach((line, rowIndex) => {
    Array.from(line)
      .slice(0, COLS)
      .forEach((char, colIndex) => {
        setCell(normalized, rowIndex, colIndex, char);
      });
  });

  return normalized;
}

export function textFromGridForExport(grid: GridState): string {
  return serializeGridForClipboard(grid) ?? "";
}

export function createEmptyDocument(
  name = DEFAULT_DOCUMENT_NAME,
  timestamp?: string
): AsciiDiagramDocumentV1 {
  const metadata = createDocumentMetadata(name, timestamp);
  return {
    version: ASCII_DIAGRAM_DOCUMENT_VERSION,
    kind: ASCII_DIAGRAM_DOCUMENT_KIND,
    grid: createEmptyGrid(),
    metadata,
    view: createDefaultCameraState()
  };
}

export function createDocumentFromEditorState(
  state: Pick<EditorState, "grid" | "camera" | "document">
): AsciiDiagramDocumentV1 {
  return {
    version: ASCII_DIAGRAM_DOCUMENT_VERSION,
    kind: ASCII_DIAGRAM_DOCUMENT_KIND,
    grid: state.grid.map((row) => [...row]),
    metadata: {
      ...state.document.metadata
    },
    view: {
      ...state.camera
    }
  };
}

export function serializeAsciiDocument(
  document: AsciiDiagramDocumentV1
): string {
  return JSON.stringify(document, null, 2);
}

export function parseAsciiDocument(
  jsonText: string,
  fallbackName?: string,
  fallbackTimestamp?: string
): DocumentParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch {
    return {
      ok: false,
      message: "Could not parse JSON."
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      message: "Document JSON must be an object."
    };
  }

  if (parsed.kind !== ASCII_DIAGRAM_DOCUMENT_KIND) {
    return {
      ok: false,
      message: "Unsupported document kind."
    };
  }

  if (parsed.version !== ASCII_DIAGRAM_DOCUMENT_VERSION) {
    return {
      ok: false,
      message: "Unsupported document version."
    };
  }

  const normalizedGrid = validateAndCloneGrid(parsed.grid);
  if (!Array.isArray(normalizedGrid)) {
    return normalizedGrid;
  }

  const now = fallbackTimestamp ?? new Date().toISOString();
  const metadataValue = isRecord(parsed.metadata) ? parsed.metadata : null;
  const documentName = normalizeDocumentName(
    metadataValue?.name ?? fallbackName ?? DEFAULT_DOCUMENT_NAME
  );
  const createdAt = isIsoTimestamp(metadataValue?.createdAt)
    ? metadataValue.createdAt
    : now;
  const updatedAt = isIsoTimestamp(metadataValue?.updatedAt)
    ? metadataValue.updatedAt
    : createdAt;

  const viewValue = isRecord(parsed.view) ? parsed.view : null;

  return {
    ok: true,
    document: {
      version: ASCII_DIAGRAM_DOCUMENT_VERSION,
      kind: ASCII_DIAGRAM_DOCUMENT_KIND,
      grid: normalizedGrid,
      metadata: {
        name: documentName,
        createdAt,
        updatedAt
      },
      view: normalizeCameraValue(viewValue)
    }
  };
}

export function documentFromImportedText(
  text: string,
  name = DEFAULT_DOCUMENT_NAME,
  timestamp?: string
): AsciiDiagramDocumentV1 {
  const metadata = createDocumentMetadata(name, timestamp);
  return {
    version: ASCII_DIAGRAM_DOCUMENT_VERSION,
    kind: ASCII_DIAGRAM_DOCUMENT_KIND,
    grid: gridFromText(text),
    metadata,
    view: createDefaultCameraState()
  };
}

export function gridTextFromDocument(
  document: Pick<AsciiDiagramDocumentV1, "grid">
): string {
  return gridToText(document.grid);
}
