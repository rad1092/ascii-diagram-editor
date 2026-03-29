# ASCII Diagram Editor

Browser-based ASCII diagram editor rebuilt from the frozen [`ASCII Canvas.html`](./ASCII%20Canvas.html) prototype.

## Stack

- TypeScript
- Vite
- Plain HTML/CSS
- Fully client-side

## Commands

```bash
npm install
npm run dev
npm run test
npm run build
npm run test:e2e
```

## Notes

- The source of truth is always a fixed `200 x 80` character grid.
- Final ASCII output renders into a real `<pre>` node.
- Background grid lines, overlays, and pointer input all live on separate layers.
- The original single-file prototype remains in the repo as a parity reference.
