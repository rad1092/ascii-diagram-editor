import { describe, expect, it } from "vitest";

import {
  ASCII_DIAGRAM_DOCUMENT_KIND,
  ASCII_DIAGRAM_DOCUMENT_VERSION,
  createDocumentFromEditorState,
  gridFromText,
  parseAsciiDocument,
  serializeAsciiDocument
} from "../../src/editor/document";
import { COLS, ROWS } from "../../src/editor/constants";
import { createEmptyGrid, setCell } from "../../src/editor/grid";

describe("document IO", () => {
  it("roundtrips a serialized document", () => {
    const grid = createEmptyGrid();
    setCell(grid, 2, 4, "A");
    setCell(grid, 79, 199, "Z");

    const document = createDocumentFromEditorState({
      grid,
      camera: { zoom: 1.4, panX: 12, panY: -8 },
      document: {
        metadata: {
          name: "Flow chart",
          createdAt: "2026-03-30T00:00:00.000Z",
          updatedAt: "2026-03-30T01:00:00.000Z"
        },
        isDirty: true
      }
    });

    const parsed = parseAsciiDocument(serializeAsciiDocument(document));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.document).toEqual({
      version: ASCII_DIAGRAM_DOCUMENT_VERSION,
      kind: ASCII_DIAGRAM_DOCUMENT_KIND,
      grid: document.grid,
      metadata: {
        name: "Flow chart",
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T01:00:00.000Z"
      },
      view: {
        zoom: 1.4,
        panX: 12,
        panY: -8
      }
    });
  });

  it("rejects invalid JSON documents", () => {
    expect(parseAsciiDocument("{").ok).toBe(false);
    expect(
      parseAsciiDocument(
        JSON.stringify({
          version: 1,
          kind: "wrong-kind",
          grid: createEmptyGrid()
        })
      ).ok
    ).toBe(false);
  });

  it("rejects JSON documents with invalid dimensions", () => {
    const grid = createEmptyGrid().slice(0, ROWS - 1);
    const parsed = parseAsciiDocument(
      JSON.stringify({
        version: 1,
        kind: ASCII_DIAGRAM_DOCUMENT_KIND,
        grid,
        metadata: {
          name: "Bad",
          createdAt: "2026-03-30T00:00:00.000Z",
          updatedAt: "2026-03-30T00:00:00.000Z"
        },
        view: {
          zoom: 1,
          panX: 0,
          panY: 0
        }
      })
    );

    expect(parsed.ok).toBe(false);
  });

  it("clips imported text into the fixed grid", () => {
    const oversizedLine = "X".repeat(COLS + 20);
    const oversizedText = Array.from({ length: ROWS + 5 }, () => oversizedLine).join(
      "\n"
    );

    const grid = gridFromText(oversizedText);

    expect(grid).toHaveLength(ROWS);
    expect(grid[0]).toHaveLength(COLS);
    expect(grid[ROWS - 1]?.[COLS - 1]).toBe("X");
    expect(grid[0]?.[0]).toBe("X");
  });

  it("normalizes malformed camera values while keeping valid content", () => {
    const parsed = parseAsciiDocument(
      JSON.stringify({
        version: 1,
        kind: ASCII_DIAGRAM_DOCUMENT_KIND,
        grid: createEmptyGrid(),
        metadata: {
          name: "Camera test",
          createdAt: "2026-03-30T00:00:00.000Z",
          updatedAt: "2026-03-30T00:00:00.000Z"
        },
        view: {
          zoom: 999,
          panX: "bad",
          panY: Number.NaN
        }
      })
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.document.view).toEqual({
      zoom: 3,
      panX: 0,
      panY: 0
    });
  });
});
