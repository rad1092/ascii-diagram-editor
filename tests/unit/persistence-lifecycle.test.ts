import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDocumentFromEditorState, serializeAsciiDocument } from "../../src/editor/document";
import {
  createPersistenceController,
  type StorageLike
} from "../../src/editor/persistence";
import { createEmptyGrid, setCell } from "../../src/editor/grid";
import { createInitialEditorState, replaceDocumentState } from "../../src/editor/state";
import { pushHistorySnapshot } from "../../src/editor/history";

describe("persistence lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("stores a single serialized document blob and excludes transient fields", () => {
    const state = createInitialEditorState();
    state.document.metadata.name = "Saved doc";
    setCell(state.grid, 1, 1, "A");

    const serialized = serializeAsciiDocument(createDocumentFromEditorState(state));
    const parsed = JSON.parse(serialized) as Record<string, unknown>;

    expect(Object.keys(parsed).sort()).toEqual([
      "grid",
      "kind",
      "metadata",
      "version",
      "view"
    ]);
    expect(parsed).not.toHaveProperty("history");
    expect(parsed).not.toHaveProperty("selection");
    expect(parsed).not.toHaveProperty("previewGrid");
  });

  it("tracks dirty state and debounces saves", () => {
    const storage = createStorageSpy();
    const controller = createPersistenceController({
      storage,
      getSerializedDocument: () => '{"kind":"ascii-diagram-document"}'
    });

    controller.markDirty();
    expect(controller.isDirty()).toBe(true);
    controller.scheduleAutosave();

    vi.advanceTimersByTime(200);
    expect(storage.setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(controller.isDirty()).toBe(false);
  });

  it("flushes only when visibility changes to hidden", () => {
    const storage = createStorageSpy();
    const controller = createPersistenceController({
      storage,
      getSerializedDocument: () => '{"doc":1}'
    });

    controller.bindLifecycle();
    controller.markDirty();

    setVisibilityState("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(storage.setItem).not.toHaveBeenCalled();

    setVisibilityState("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it("flushes on pagehide and remains idempotent across repeated lifecycle events", () => {
    const storage = createStorageSpy();
    const controller = createPersistenceController({
      storage,
      getSerializedDocument: () => '{"doc":2}'
    });

    controller.bindLifecycle();
    controller.markDirty();
    window.dispatchEvent(new Event("pagehide"));
    expect(storage.setItem).toHaveBeenCalledTimes(1);

    setVisibilityState("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it("does not crash when storage writes fail", () => {
    const failingStorage: StorageLike = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("no storage");
      }),
      removeItem: vi.fn()
    };
    const onSaveError = vi.fn();
    const controller = createPersistenceController({
      storage: failingStorage,
      getSerializedDocument: () => '{"doc":3}',
      onSaveError
    });

    controller.markDirty();
    expect(() => controller.flushNow()).not.toThrow();
    expect(onSaveError).toHaveBeenCalledTimes(1);
    expect(controller.isDirty()).toBe(true);
  });

  it("resets history and transient state when replacing the current document", () => {
    const state = createInitialEditorState();
    pushHistorySnapshot(state.history, state.grid);
    state.selection.marquee = { left: 0, right: 1, top: 0, bottom: 1 };
    state.previewGrid = createEmptyGrid();
    state.interaction.mode = "drawing";
    state.textInput.active = true;
    state.tool = "rect";
    state.document.isDirty = true;

    const nextGrid = createEmptyGrid();
    setCell(nextGrid, 4, 5, "Z");

    replaceDocumentState(state, {
      grid: nextGrid,
      metadata: {
        name: "Imported",
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z"
      },
      view: {
        zoom: 1.5,
        panX: 10,
        panY: 20
      }
    });

    expect(state.history.undo).toHaveLength(0);
    expect(state.history.redo).toHaveLength(0);
    expect(state.selection.marquee).toBeNull();
    expect(state.previewGrid).toBeNull();
    expect(state.textInput.active).toBe(false);
    expect(state.tool).toBe("select");
    expect(state.document.isDirty).toBe(false);
    expect(state.grid[4]?.[5]).toBe("Z");
  });
});

function createStorageSpy(): StorageLike & {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
} {
  const backingStore = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => backingStore.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      backingStore.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      backingStore.delete(key);
    })
  };
}

function setVisibilityState(value: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value
  });
}
