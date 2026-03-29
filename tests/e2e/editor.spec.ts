import { expect, test, type Page } from "@playwright/test";

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

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.waitForSelector("#interaction-layer");
});

test("draws a rectangle, commits text, and copies normalized ASCII", async ({
  page
}) => {
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

  const lines = await serializedLines(page);
  expect(lines[2]?.slice(2, 9)).toBe("+-----+");
  expect(lines[3]?.slice(2, 9)).toBe("| Hi  |");
  expect(lines[5]?.slice(2, 9)).toBe("+-----+");

  await page.click("#copy-btn");
  await expect(page.locator("#toast")).toContainText("Copied");
  await expect
    .poll(() =>
      page.evaluate(() => navigator.clipboard.readText()).then((text) =>
        text.replace(/\r\n/g, "\n")
      )
    )
    .toBe("+-----+\n| Hi  |\n|     |\n+-----+");
});

test("moves connected freehand cells and supports undo/redo", async ({
  page
}) => {
  await page.click('[data-tool="freehand"]');

  const first = await pointForCell(page, 2, 2);
  const second = await pointForCell(page, 3, 3);
  await page.mouse.click(first.x, first.y);
  await page.mouse.click(second.x, second.y);

  await page.click('[data-tool="select"]');
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  const moved = await pointForCell(page, 6, 4);
  await page.mouse.move(moved.x, moved.y, { steps: 8 });
  await page.mouse.up();

  let lines = await serializedLines(page);
  expect(lines[2]?.[2]).toBe(" ");
  expect(lines[4]?.[6]).toBe("*");
  expect(lines[5]?.[7]).toBe("*");

  await page.keyboard.press(process.platform === "darwin" ? "Meta+Z" : "Control+Z");
  lines = await serializedLines(page);
  expect(lines[2]?.[2]).toBe("*");
  expect(lines[3]?.[3]).toBe("*");

  await page.keyboard.press(process.platform === "darwin" ? "Meta+Y" : "Control+Y");
  lines = await serializedLines(page);
  expect(lines[4]?.[6]).toBe("*");
  expect(lines[5]?.[7]).toBe("*");
});

test("supports zoom toward pointer, space-pan, line, arrow, and eraser", async ({
  page
}) => {
  const center = await pointForCell(page, 10, 8);
  await page.mouse.move(center.x, center.y);
  await page.mouse.wheel(0, -100);

  let state = await page.evaluate(() => window.__ASCII_EDITOR_DEBUG__!.getState());
  expect(state.zoom).toBeGreaterThan(1);

  await page.keyboard.down("Space");
  await page.mouse.down();
  await page.mouse.move(center.x + 40, center.y + 25, { steps: 4 });
  await page.mouse.up();
  await page.keyboard.up("Space");

  state = await page.evaluate(() => window.__ASCII_EDITOR_DEBUG__!.getState());
  expect(Math.abs(state.panX) + Math.abs(state.panY)).toBeGreaterThan(0);

  await page.click('[data-tool="line"]');
  const lineStart = await pointForCell(page, 1, 1);
  const lineEnd = await pointForCell(page, 5, 4);
  await page.mouse.move(lineStart.x, lineStart.y);
  await page.mouse.down();
  await page.mouse.move(lineEnd.x, lineEnd.y, { steps: 5 });
  await page.mouse.up();

  await page.click('[data-tool="arrow"]');
  const arrowStart = await pointForCell(page, 9, 1);
  const arrowEnd = await pointForCell(page, 13, 4);
  await page.mouse.move(arrowStart.x, arrowStart.y);
  await page.mouse.down();
  await page.mouse.move(arrowEnd.x, arrowEnd.y, { steps: 5 });
  await page.mouse.up();

  await page.click('[data-tool="eraser"]');
  await page.click('[data-erasersize="3"]');
  const erasePoint = await pointForCell(page, 13, 4);
  await page.mouse.click(erasePoint.x, erasePoint.y);

  const lines = await serializedLines(page);
  expect(lines[1]?.includes("-")).toBeTruthy();
  expect(lines[4]?.[13]).toBe(" ");
});
