import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "ascii-diagram-editor.document.v1";

async function pointForCell(
  page: Page,
  col: number,
  row: number
): Promise<{ x: number; y: number }> {
  return page.evaluate(
    ({ col: targetCol, row: targetRow }) =>
      window.__ASCII_EDITOR_DEBUG__!.cellToClientPoint(targetCol, targetRow),
    { col, row }
  );
}

async function serializedLines(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    (window.__ASCII_EDITOR_DEBUG__?.getSerializedGrid() ?? "").split("\n")
  );
}

async function drawSampleDiagram(page: Page): Promise<void> {
  await page.click('[data-tool="rect"]');

  const rectStart = await pointForCell(page, 2, 2);
  const rectEnd = await pointForCell(page, 8, 5);
  await page.mouse.move(rectStart.x, rectStart.y);
  await page.mouse.down();
  await page.mouse.move(rectEnd.x, rectEnd.y, { steps: 8 });
  await page.mouse.up();

  await page.click('[data-tool="text"]');
  const textPoint = await pointForCell(page, 4, 3);
  await page.mouse.click(textPoint.x, textPoint.y);
  await page.locator("#text-input-overlay textarea").fill("Hi");
  await page.locator("#text-input-overlay textarea").press("Enter");
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const pickerWindow = window as Window & {
      showOpenFilePicker?: unknown;
      showSaveFilePicker?: unknown;
    };
    delete pickerWindow.showOpenFilePicker;
    delete pickerWindow.showSaveFilePicker;
  });
  await page.goto("/");
  await page.waitForSelector("#interaction-layer");
});

test("restores the last autosaved document after visibilitychange flush", async ({
  page
}) => {
  await drawSampleDiagram(page);

  await page.evaluate((storageKey) => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden"
    });
    document.dispatchEvent(new Event("visibilitychange"));
    return localStorage.getItem(storageKey);
  }, STORAGE_KEY);

  await expect
    .poll(() =>
      page.evaluate((storageKey) => localStorage.getItem(storageKey), STORAGE_KEY)
    )
    .not.toBeNull();

  await page.reload();
  await page.waitForSelector("#interaction-layer");
  await expect(page.locator("#toast")).toContainText("Recovered previous session");

  const lines = await serializedLines(page);
  expect(lines[2]?.slice(2, 9)).toBe("+-----+");
  expect(lines[3]?.slice(2, 9)).toBe("| Hi  |");
  await expect(page.locator("#status-dirty")).toHaveText("Saved");
});

test("exports JSON, imports it back, and resets transient document state", async ({
  page
}) => {
  await drawSampleDiagram(page);

  await page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
  });

  const downloadPromise = page.waitForEvent("download");
  await page.click("#export-json-btn");
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  await page.click("#new-document-btn");
  await expect(page.locator("#document-name")).toHaveText("Untitled diagram");
  await expect(page.locator("#status-dirty")).toHaveText("Saved");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.click("#import-btn");
  const chooser = await fileChooserPromise;
  await chooser.setFiles(downloadPath!);

  await expect(page.locator("#toast")).toContainText("Imported diagram");
  await expect(page.locator("#undo-btn")).toBeDisabled();
  await expect(page.locator("#text-input-overlay")).toHaveCSS("display", "none");

  const history = await page.evaluate(
    () => window.__ASCII_EDITOR_DEBUG__?.getHistoryDepth() ?? { undo: -1, redo: -1 }
  );
  expect(history).toEqual({ undo: 0, redo: 0 });

  const lines = await serializedLines(page);
  expect(lines[2]?.slice(2, 9)).toBe("+-----+");
  expect(lines[3]?.slice(2, 9)).toBe("| Hi  |");
});
