import type { ToastTone } from "../types";

export interface ToastController {
  show: (message: string, tone?: ToastTone) => void;
}

export function createToastController(element: HTMLDivElement): ToastController {
  let timer: number | null = null;

  return {
    show(message, tone = "info") {
      element.textContent = message;
      element.className = "show";
      if (tone !== "info") {
        element.classList.add(tone);
      }

      if (timer !== null) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
        element.className = "";
      }, 2200);
    }
  };
}
