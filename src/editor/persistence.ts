import { LOCAL_STORAGE_DOCUMENT_KEY } from "./constants";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoredDocumentReadResult {
  ok: boolean;
  value: string | null;
  error?: string;
}

export interface PersistenceControllerOptions {
  getSerializedDocument: () => string;
  beforeLifecycleFlush?: () => void;
  storage?: StorageLike;
  storageKey?: string;
  document?: Document;
  window?: Window;
  debounceMs?: number;
  onDidSave?: (serializedDocument: string) => void;
  onSaveError?: (error: unknown) => void;
}

export interface PersistenceController {
  bindLifecycle: () => void;
  clearStoredDocument: () => void;
  dispose: () => void;
  flushNow: () => boolean;
  getLastSavedSerialized: () => string | null;
  isDirty: () => boolean;
  markClean: (serializedDocument?: string) => void;
  markDirty: () => void;
  persistSerializedDocument: (serializedDocument: string) => boolean;
  scheduleAutosave: () => void;
}

export function readStoredDocument(
  storage: StorageLike = window.localStorage,
  storageKey = LOCAL_STORAGE_DOCUMENT_KEY
): StoredDocumentReadResult {
  try {
    return {
      ok: true,
      value: storage.getItem(storageKey)
    };
  } catch (error) {
    return {
      ok: false,
      value: null,
      error: error instanceof Error ? error.message : "Could not read local storage."
    };
  }
}

export function clearStoredDocument(
  storage: StorageLike = window.localStorage,
  storageKey = LOCAL_STORAGE_DOCUMENT_KEY
): void {
  try {
    storage.removeItem(storageKey);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function createPersistenceController(
  options: PersistenceControllerOptions
): PersistenceController {
  const storage = options.storage ?? window.localStorage;
  const storageKey = options.storageKey ?? LOCAL_STORAGE_DOCUMENT_KEY;
  const documentRef = options.document ?? document;
  const windowRef = options.window ?? window;
  const debounceMs = options.debounceMs ?? 350;

  let dirty = false;
  let writesDisabled = false;
  let warningShown = false;
  let timeoutId: number | null = null;
  let lifecycleBound = false;
  let lastSavedSerialized: string | null = null;

  function clearPendingSave(): void {
    if (timeoutId !== null) {
      windowRef.clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function markClean(serializedDocument?: string): void {
    clearPendingSave();
    dirty = false;
    if (serializedDocument !== undefined) {
      lastSavedSerialized = serializedDocument;
    }
  }

  function writeSerializedDocument(serializedDocument: string): boolean {
    try {
      storage.setItem(storageKey, serializedDocument);
      lastSavedSerialized = serializedDocument;
      dirty = false;
      options.onDidSave?.(serializedDocument);
      return true;
    } catch (error) {
      clearPendingSave();
      dirty = true;
      writesDisabled = true;
      if (!warningShown) {
        warningShown = true;
        options.onSaveError?.(error);
      }
      return false;
    }
  }

  function flushNow(): boolean {
    clearPendingSave();
    if (writesDisabled || !dirty) {
      return false;
    }

    const serializedDocument = options.getSerializedDocument();
    if (serializedDocument === lastSavedSerialized) {
      dirty = false;
      return true;
    }

    return writeSerializedDocument(serializedDocument);
  }

  function persistSerializedDocument(serializedDocument: string): boolean {
    clearPendingSave();
    if (writesDisabled) {
      return false;
    }
    if (serializedDocument === lastSavedSerialized) {
      dirty = false;
      return true;
    }
    return writeSerializedDocument(serializedDocument);
  }

  function scheduleAutosave(): void {
    if (writesDisabled || !dirty) {
      return;
    }

    clearPendingSave();
    timeoutId = windowRef.setTimeout(() => {
      flushNow();
    }, debounceMs);
  }

  function handleVisibilityChange(): void {
    if (documentRef.visibilityState === "hidden") {
      options.beforeLifecycleFlush?.();
      flushNow();
    }
  }

  function handlePageHide(): void {
    options.beforeLifecycleFlush?.();
    flushNow();
  }

  function bindLifecycle(): void {
    if (lifecycleBound) {
      return;
    }
    lifecycleBound = true;
    documentRef.addEventListener("visibilitychange", handleVisibilityChange);
    windowRef.addEventListener("pagehide", handlePageHide);
  }

  function dispose(): void {
    clearPendingSave();
    if (!lifecycleBound) {
      return;
    }
    lifecycleBound = false;
    documentRef.removeEventListener("visibilitychange", handleVisibilityChange);
    windowRef.removeEventListener("pagehide", handlePageHide);
  }

  return {
    bindLifecycle,
    clearStoredDocument() {
      clearStoredDocument(storage, storageKey);
    },
    dispose,
    flushNow,
    getLastSavedSerialized() {
      return lastSavedSerialized;
    },
    isDirty() {
      return dirty;
    },
    markClean,
    markDirty() {
      if (!writesDisabled) {
        dirty = true;
      }
    },
    persistSerializedDocument,
    scheduleAutosave
  };
}
