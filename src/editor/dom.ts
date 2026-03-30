import { COLS, DEFAULT_DOCUMENT_NAME, ROWS } from "./constants";

export interface EditorDom {
  root: HTMLElement;
  shell: HTMLElement;
  canvasContainer: HTMLDivElement;
  gridCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  asciiCanvas: HTMLPreElement;
  interactionLayer: HTMLDivElement;
  textOverlay: HTMLDivElement;
  textArea: HTMLTextAreaElement;
  toast: HTMLDivElement;
  importFileInput: HTMLInputElement;
  documentName: HTMLSpanElement;
  toolButtons: HTMLButtonElement[];
  borderButtons: HTMLButtonElement[];
  lineButtons: HTMLButtonElement[];
  arrowHeadButtons: HTMLButtonElement[];
  freehandButtons: HTMLButtonElement[];
  eraserButtons: HTMLButtonElement[];
  diamondButtons: HTMLButtonElement[];
  newDocumentButton: HTMLButtonElement;
  importButton: HTMLButtonElement;
  exportTxtButton: HTMLButtonElement;
  exportJsonButton: HTMLButtonElement;
  undoButton: HTMLButtonElement;
  redoButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  copyButton: HTMLButtonElement;
  borderPanel: HTMLDivElement;
  linePanel: HTMLDivElement;
  arrowPanel: HTMLDivElement;
  freehandPanel: HTMLDivElement;
  eraserPanel: HTMLDivElement;
  diamondPanel: HTMLDivElement;
  statusCursor: HTMLSpanElement;
  statusCanvas: HTMLSpanElement;
  statusZoom: HTMLSpanElement;
  statusTool: HTMLSpanElement;
  statusDirty: HTMLSpanElement;
  statusHint: HTMLSpanElement;
}

function queryRequired<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing DOM node for selector: ${selector}`);
  }
  return element;
}

export function createEditorDom(root: HTMLElement): EditorDom {
  root.innerHTML = `
    <div class="editor-shell">
      <div class="topbar">
        <div class="logo">
          <span class="logo-mark">ASCII</span>
          <span class="logo-sub">diagram editor</span>
        </div>
        <div class="document-chip">
          <span class="document-chip-label">Document</span>
          <span class="document-chip-name" id="document-name">${DEFAULT_DOCUMENT_NAME}</span>
        </div>
        <div class="toolbar">
          <button class="tool-btn" data-tool="select" data-tooltip="Select / Move (V)" aria-label="Select tool">
            <svg viewBox="0 0 24 24"><path d="M5 3l14 9-7 2-4 7z"></path></svg>
            <span class="shortcut-pill">V</span>
          </button>
          <button class="tool-btn" data-tool="rect" data-tooltip="Rectangle (R)" aria-label="Rectangle tool">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"></rect></svg>
            <span class="shortcut-pill">R</span>
          </button>
          <button class="tool-btn" data-tool="diamond" data-tooltip="Diamond (D)" aria-label="Diamond tool">
            <svg viewBox="0 0 24 24"><path d="M12 2l10 10-10 10L2 12z"></path></svg>
            <span class="shortcut-pill">D</span>
          </button>
          <button class="tool-btn" data-tool="line" data-tooltip="Line (L)" aria-label="Line tool">
            <svg viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5"></line></svg>
            <span class="shortcut-pill">L</span>
          </button>
          <button class="tool-btn" data-tool="arrow" data-tooltip="Arrow (A)" aria-label="Arrow tool">
            <svg viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5"></line><polyline points="12 5 19 5 19 12"></polyline></svg>
            <span class="shortcut-pill">A</span>
          </button>
          <button class="tool-btn" data-tool="text" data-tooltip="Text (T)" aria-label="Text tool">
            <svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="12" y1="4" x2="12" y2="20"></line><line x1="8" y1="20" x2="16" y2="20"></line></svg>
            <span class="shortcut-pill">T</span>
          </button>
          <button class="tool-btn" data-tool="freehand" data-tooltip="Freehand (F)" aria-label="Freehand tool">
            <svg viewBox="0 0 24 24"><path d="M3 17c3-2 5-8 9-8s4 6 9 4"></path></svg>
            <span class="shortcut-pill">F</span>
          </button>
          <button class="tool-btn" data-tool="eraser" data-tooltip="Eraser (E)" aria-label="Eraser tool">
            <svg viewBox="0 0 24 24"><path d="M20 20H7L3 16l10-10 8 8-4 4"></path><line x1="14" y1="6" x2="20" y2="12"></line></svg>
            <span class="shortcut-pill">E</span>
          </button>
        </div>
        <div class="doc-actions">
          <button class="action-btn" id="new-document-btn" aria-label="New document">New</button>
          <button class="action-btn" id="import-btn" aria-label="Import document">Import</button>
          <button class="action-btn" id="export-txt-btn" aria-label="Export TXT">Export TXT</button>
          <button class="action-btn" id="export-json-btn" aria-label="Export JSON">Export JSON</button>
        </div>
        <div class="divider"></div>
        <div class="topbar-actions">
          <button class="action-btn" id="undo-btn" data-tooltip="Undo (Ctrl/Cmd+Z)" aria-label="Undo">
            <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          </button>
          <button class="action-btn" id="redo-btn" data-tooltip="Redo (Ctrl/Cmd+Y)" aria-label="Redo">
            <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"></path></svg>
          </button>
          <button class="action-btn" id="clear-btn" data-tooltip="Clear canvas" aria-label="Clear canvas">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Clear</span>
          </button>
          <button class="action-btn primary" id="copy-btn" data-tooltip="Copy ASCII (Ctrl/Cmd+Shift+C)" aria-label="Copy ASCII">
            <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy ASCII</span>
          </button>
        </div>
      </div>
      <div class="main-layout">
        <aside class="sidebar">
          <div class="panel-section" id="panel-border-styles">
            <div class="panel-label">Border Style</div>
            <div class="stack">
              <button class="option-btn" data-border="simple"><span class="option-preview">+-+</span><span class="option-label">Simple</span></button>
              <button class="option-btn" data-border="double"><span class="option-preview">╔═╗</span><span class="option-label">Double</span></button>
              <button class="option-btn" data-border="rounded"><span class="option-preview">╭─╮</span><span class="option-label">Rounded</span></button>
              <button class="option-btn" data-border="heavy"><span class="option-preview">┏━┓</span><span class="option-label">Heavy</span></button>
              <button class="option-btn" data-border="light"><span class="option-preview">┌─┐</span><span class="option-label">Light</span></button>
            </div>
          </div>
          <div class="panel-section" id="panel-arrow-styles">
            <div class="panel-label">Arrow Head</div>
            <div class="chips">
              <button class="chip-btn" data-arrowhead="ascii">&gt;</button>
              <button class="chip-btn" data-arrowhead="triangle">▶</button>
            </div>
          </div>
          <div class="panel-section" id="panel-line-styles">
            <div class="panel-label">Line Style</div>
            <div class="stack">
              <button class="option-btn" data-linestyle="ascii"><span class="option-preview">---</span><span class="option-label">ASCII</span></button>
              <button class="option-btn" data-linestyle="light"><span class="option-preview">───</span><span class="option-label">Light</span></button>
              <button class="option-btn" data-linestyle="heavy"><span class="option-preview">━━━</span><span class="option-label">Heavy</span></button>
              <button class="option-btn" data-linestyle="dashed"><span class="option-preview">- -</span><span class="option-label">Dashed</span></button>
              <button class="option-btn" data-linestyle="dotted"><span class="option-preview">···</span><span class="option-label">Dotted</span></button>
            </div>
          </div>
          <div class="panel-section" id="panel-freehand">
            <div class="panel-label">Draw Character</div>
            <div class="chips">
              <button class="chip-btn" data-char="*">*</button>
              <button class="chip-btn" data-char="#">#</button>
              <button class="chip-btn" data-char="@">@</button>
              <button class="chip-btn" data-char="~">~</button>
              <button class="chip-btn" data-char=".">.</button>
              <button class="chip-btn" data-char="x">x</button>
              <button class="chip-btn" data-char="o">o</button>
              <button class="chip-btn" data-char="·">·</button>
            </div>
          </div>
          <div class="panel-section" id="panel-eraser">
            <div class="panel-label">Eraser Size</div>
            <div class="chips">
              <button class="chip-btn" data-erasersize="1">1</button>
              <button class="chip-btn" data-erasersize="3">3</button>
              <button class="chip-btn" data-erasersize="5">5</button>
            </div>
          </div>
          <div class="panel-section" id="panel-diamond-styles">
            <div class="panel-label">Diamond Style</div>
            <div class="stack">
              <button class="option-btn" data-diamondstyle="simple"><span class="option-preview">/\\</span><span class="option-label">Simple</span></button>
              <button class="option-btn" data-diamondstyle="unicode"><span class="option-preview">◇</span><span class="option-label">Unicode</span></button>
            </div>
          </div>
          <div class="panel-section" style="flex: 1; min-height: 0;">
            <div class="panel-label">Shortcuts</div>
            <div class="shortcuts-list">
              <div class="shortcut-row"><span class="desc">Select</span><span class="key">V</span></div>
              <div class="shortcut-row"><span class="desc">Rectangle</span><span class="key">R</span></div>
              <div class="shortcut-row"><span class="desc">Diamond</span><span class="key">D</span></div>
              <div class="shortcut-row"><span class="desc">Line</span><span class="key">L</span></div>
              <div class="shortcut-row"><span class="desc">Arrow</span><span class="key">A</span></div>
              <div class="shortcut-row"><span class="desc">Text</span><span class="key">T</span></div>
              <div class="shortcut-row"><span class="desc">Freehand</span><span class="key">F</span></div>
              <div class="shortcut-row"><span class="desc">Eraser</span><span class="key">E</span></div>
              <div class="shortcut-row"><span class="desc">Undo</span><span class="key">Ctrl/Cmd+Z</span></div>
              <div class="shortcut-row"><span class="desc">Redo</span><span class="key">Ctrl/Cmd+Y</span></div>
              <div class="shortcut-row"><span class="desc">Copy</span><span class="key">Ctrl/Cmd+Shift+C</span></div>
              <div class="shortcut-row"><span class="desc">Pan</span><span class="key">Space+Drag</span></div>
              <div class="shortcut-row"><span class="desc">Delete</span><span class="key">Del / Bksp</span></div>
            </div>
          </div>
        </aside>
        <main class="canvas-shell">
          <div id="canvas-container">
            <canvas id="grid-canvas"></canvas>
            <pre id="ascii-canvas"></pre>
            <canvas id="overlay-canvas"></canvas>
            <div id="interaction-layer" tabindex="0" aria-label="ASCII editor interaction layer"></div>
            <div id="text-input-overlay">
              <textarea spellcheck="false"></textarea>
            </div>
          </div>
        </main>
      </div>
      <div class="statusbar">
        <div class="status-item"><span class="label">Cursor</span><span class="value" id="status-cursor">0, 0</span></div>
        <div class="status-item"><span class="label">Canvas</span><span class="value" id="status-canvas">${COLS} x ${ROWS}</span></div>
        <div class="status-item"><span class="label">Zoom</span><span class="value" id="status-zoom">100%</span></div>
        <div class="status-item"><span class="label">Tool</span><span class="value" id="status-tool">Select</span></div>
        <div class="status-item"><span class="label">State</span><span class="value" id="status-dirty">Saved</span></div>
        <div class="status-spacer"></div>
        <div class="status-item"><span class="value" id="status-hint">Space+Drag to pan · Scroll to zoom</span></div>
      </div>
    </div>
    <input id="import-file-input" type="file" hidden />
    <div id="toast"></div>
  `;

  const shell = queryRequired<HTMLElement>(root, ".editor-shell");

  return {
    root,
    shell,
    canvasContainer: queryRequired<HTMLDivElement>(root, "#canvas-container"),
    gridCanvas: queryRequired<HTMLCanvasElement>(root, "#grid-canvas"),
    overlayCanvas: queryRequired<HTMLCanvasElement>(root, "#overlay-canvas"),
    asciiCanvas: queryRequired<HTMLPreElement>(root, "#ascii-canvas"),
    interactionLayer: queryRequired<HTMLDivElement>(root, "#interaction-layer"),
    textOverlay: queryRequired<HTMLDivElement>(root, "#text-input-overlay"),
    textArea: queryRequired<HTMLTextAreaElement>(root, "#text-input-overlay textarea"),
    toast: queryRequired<HTMLDivElement>(root, "#toast"),
    importFileInput: queryRequired<HTMLInputElement>(root, "#import-file-input"),
    documentName: queryRequired<HTMLSpanElement>(root, "#document-name"),
    toolButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-tool]")),
    borderButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-border]")),
    lineButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-linestyle]")),
    arrowHeadButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-arrowhead]")),
    freehandButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-char]")),
    eraserButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-erasersize]")),
    diamondButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-diamondstyle]")),
    newDocumentButton: queryRequired<HTMLButtonElement>(root, "#new-document-btn"),
    importButton: queryRequired<HTMLButtonElement>(root, "#import-btn"),
    exportTxtButton: queryRequired<HTMLButtonElement>(root, "#export-txt-btn"),
    exportJsonButton: queryRequired<HTMLButtonElement>(root, "#export-json-btn"),
    undoButton: queryRequired<HTMLButtonElement>(root, "#undo-btn"),
    redoButton: queryRequired<HTMLButtonElement>(root, "#redo-btn"),
    clearButton: queryRequired<HTMLButtonElement>(root, "#clear-btn"),
    copyButton: queryRequired<HTMLButtonElement>(root, "#copy-btn"),
    borderPanel: queryRequired<HTMLDivElement>(root, "#panel-border-styles"),
    linePanel: queryRequired<HTMLDivElement>(root, "#panel-line-styles"),
    arrowPanel: queryRequired<HTMLDivElement>(root, "#panel-arrow-styles"),
    freehandPanel: queryRequired<HTMLDivElement>(root, "#panel-freehand"),
    eraserPanel: queryRequired<HTMLDivElement>(root, "#panel-eraser"),
    diamondPanel: queryRequired<HTMLDivElement>(root, "#panel-diamond-styles"),
    statusCursor: queryRequired<HTMLSpanElement>(root, "#status-cursor"),
    statusCanvas: queryRequired<HTMLSpanElement>(root, "#status-canvas"),
    statusZoom: queryRequired<HTMLSpanElement>(root, "#status-zoom"),
    statusTool: queryRequired<HTMLSpanElement>(root, "#status-tool"),
    statusDirty: queryRequired<HTMLSpanElement>(root, "#status-dirty"),
    statusHint: queryRequired<HTMLSpanElement>(root, "#status-hint")
  };
}

export function ensureCanvasResolution(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
): { width: number; height: number } {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: rect.width, height: rect.height };
}
