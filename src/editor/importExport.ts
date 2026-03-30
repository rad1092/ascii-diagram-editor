const TXT_ACCEPT = ".txt,text/plain";
const JSON_ACCEPT = ".ascii.json,.json,application/json";

export interface ImportedFile {
  name: string;
  text: string;
}

export type ImportedFileKind = "json" | "text";

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface OpenFilePickerOptionsLike {
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
  types?: FilePickerAcceptType[];
}

interface SaveFilePickerOptionsLike {
  excludeAcceptAllOption?: boolean;
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

interface FileSystemWritableFileStreamLike {
  write(data: Blob | BufferSource | string): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemFileHandleLike {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStreamLike>;
}

interface PickerWindow extends Window {
  showOpenFilePicker?: (
    options?: OpenFilePickerOptionsLike
  ) => Promise<FileSystemFileHandleLike[]>;
  showSaveFilePicker?: (
    options?: SaveFilePickerOptionsLike
  ) => Promise<FileSystemFileHandleLike>;
}

function supportsFileSystemAccess(windowRef: Window = window): windowRef is PickerWindow {
  const pickerWindow = windowRef as PickerWindow;
  return (
    windowRef.isSecureContext &&
    typeof pickerWindow.showOpenFilePicker === "function" &&
    typeof pickerWindow.showSaveFilePicker === "function"
  );
}

function inferFileKind(fileName: string, text: string): ImportedFileKind {
  const loweredName = fileName.toLowerCase();
  if (loweredName.endsWith(".ascii.json") || loweredName.endsWith(".json")) {
    return "json";
  }

  const trimmed = text.trimStart();
  return trimmed.startsWith("{") ? "json" : "text";
}

function stripKnownExtension(fileName: string): string {
  return fileName
    .replace(/\.ascii\.json$/iu, "")
    .replace(/\.json$/iu, "")
    .replace(/\.txt$/iu, "")
    .trim();
}

function sanitizeFileBaseName(name: string): string {
  const base = stripKnownExtension(name)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return base.length > 0 ? base : "ascii-diagram";
}

export function deriveDocumentNameFromFile(fileName: string): string {
  return sanitizeFileBaseName(fileName);
}

export function suggestTextExportFilename(documentName: string): string {
  return `${sanitizeFileBaseName(documentName)}.txt`;
}

export function suggestJsonExportFilename(documentName: string): string {
  return `${sanitizeFileBaseName(documentName)}.ascii.json`;
}

function openFileViaInput(input: HTMLInputElement): Promise<ImportedFile | null> {
  input.value = "";

  return new Promise((resolve) => {
    const handleChange = async (): Promise<void> => {
      input.removeEventListener("change", handleChange);
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const text = await file.text();
      resolve({
        name: file.name,
        text
      });
    };

    input.addEventListener("change", handleChange, { once: true });
    input.click();
  });
}

async function openFileViaPicker(
  windowRef: PickerWindow
): Promise<ImportedFile | null> {
  try {
    const handles = await windowRef.showOpenFilePicker?.({
      excludeAcceptAllOption: false,
      multiple: false,
      types: [
        {
          description: "ASCII diagram files",
          accept: {
            "application/json": [".ascii.json", ".json"],
            "text/plain": [".txt"]
          }
        }
      ]
    });
    const handle = handles?.[0];
    if (!handle) {
      return null;
    }

    const file = await handle.getFile();
    return {
      name: file.name,
      text: await file.text()
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    throw error;
  }
}

function downloadTextFile(
  content: string,
  suggestedName: string,
  mimeType: string,
  documentRef: Document = document
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = documentRef.createElement("a");
  link.href = url;
  link.download = suggestedName;
  link.style.display = "none";
  documentRef.body.appendChild(link);
  link.click();
  documentRef.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function saveTextViaPicker(
  content: string,
  suggestedName: string,
  mimeType: string,
  windowRef: PickerWindow
): Promise<boolean> {
  try {
    const handle = await windowRef.showSaveFilePicker?.({
      excludeAcceptAllOption: false,
      suggestedName,
      types: [
        {
          description: mimeType === "application/json" ? "JSON document" : "Text document",
          accept: {
            [mimeType]:
              mimeType === "application/json"
                ? [".ascii.json", ".json"]
                : [".txt"]
          }
        }
      ]
    });
    if (!handle) {
      return false;
    }

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }
    throw error;
  }
}

export async function openImportedFile(
  input: HTMLInputElement,
  windowRef: Window = window
): Promise<ImportedFile | null> {
  if (supportsFileSystemAccess(windowRef)) {
    try {
      const imported = await openFileViaPicker(windowRef);
      if (imported) {
        return imported;
      }
    } catch {
      // Fall back to the input path below.
    }
  }

  return openFileViaInput(input);
}

export async function saveExportedFile(
  content: string,
  suggestedName: string,
  mimeType: string,
  windowRef: Window = window,
  documentRef: Document = document
): Promise<void> {
  if (supportsFileSystemAccess(windowRef)) {
    try {
      const saved = await saveTextViaPicker(
        content,
        suggestedName,
        mimeType,
        windowRef
      );
      if (saved) {
        return;
      }
    } catch {
      // Fall back to download below.
    }
  }

  downloadTextFile(content, suggestedName, mimeType, documentRef);
}

export function getImportInputAccept(): string {
  return `${TXT_ACCEPT},${JSON_ACCEPT}`;
}

export function detectImportedFileKind(file: ImportedFile): ImportedFileKind {
  return inferFileKind(file.name, file.text);
}
