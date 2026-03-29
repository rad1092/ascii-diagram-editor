import type { EditorDom } from "../dom";
import type {
  ArrowHeadStyle,
  BorderStyle,
  DiamondStyle,
  EditorState,
  EraserSize,
  FreehandGlyph,
  LineStyle
} from "../types";

interface SidebarHandlers {
  onBorderStyleChange: (style: BorderStyle) => void;
  onLineStyleChange: (style: LineStyle) => void;
  onArrowHeadChange: (style: ArrowHeadStyle) => void;
  onFreehandGlyphChange: (glyph: FreehandGlyph) => void;
  onEraserSizeChange: (size: EraserSize) => void;
  onDiamondStyleChange: (style: DiamondStyle) => void;
}

export function bindSidebar(dom: EditorDom, handlers: SidebarHandlers): void {
  dom.borderButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onBorderStyleChange(button.dataset.border as BorderStyle);
    });
  });

  dom.lineButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onLineStyleChange(button.dataset.linestyle as LineStyle);
    });
  });

  dom.arrowHeadButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onArrowHeadChange(button.dataset.arrowhead as ArrowHeadStyle);
    });
  });

  dom.freehandButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onFreehandGlyphChange(button.dataset.char as FreehandGlyph);
    });
  });

  dom.eraserButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onEraserSizeChange(Number(button.dataset.erasersize) as EraserSize);
    });
  });

  dom.diamondButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handlers.onDiamondStyleChange(button.dataset.diamondstyle as DiamondStyle);
    });
  });
}

export function renderSidebar(dom: EditorDom, state: EditorState): void {
  dom.borderPanel.hidden = state.tool !== "rect";
  dom.linePanel.hidden = state.tool !== "line" && state.tool !== "arrow";
  dom.arrowPanel.hidden = state.tool !== "arrow";
  dom.freehandPanel.hidden = state.tool !== "freehand";
  dom.eraserPanel.hidden = state.tool !== "eraser";
  dom.diamondPanel.hidden = state.tool !== "diamond";

  dom.borderButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.border === state.toolOptions.borderStyle
    );
  });

  dom.lineButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.linestyle === state.toolOptions.lineStyle
    );
  });

  dom.arrowHeadButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.arrowhead === state.toolOptions.arrowHead
    );
  });

  dom.freehandButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.char === state.toolOptions.freehandGlyph
    );
  });

  dom.eraserButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      Number(button.dataset.erasersize) === state.toolOptions.eraserSize
    );
  });

  dom.diamondButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.diamondstyle === state.toolOptions.diamondStyle
    );
  });
}
