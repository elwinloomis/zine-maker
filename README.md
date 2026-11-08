# Mini-Zine Imposition Tool (Standalone Local App)

This project is a self-contained browser app for imposing 8 zine pages onto one US Letter sheet (11 x 8.5 in, landscape) for one-sheet 8-page mini-zines. It also makes French fold cards: 4 panels on one sheet, folded twice, no cutting.

No backend, no uploads, no network calls, and no CDN dependencies.

## Live App

- GitHub Pages: https://elwinloomis.github.io/zine-maker/
- Source repository: https://github.com/elwinloomis/zine-maker

## Hosting It Yourself

The app is four static files (`index.html`, `app.js`, `styles.css`, `how_to_fold.jpg`). Put them on any static host, or open `index.html` locally. The public copy above is served by GitHub Pages from `main`.

When you change `app.js` or `styles.css`, bump the `?v=` date on both references in `index.html` so browsers don't keep serving a cached copy.

## Recent Updates (2026-11-08)

- Added a French fold card format (4 panels, no cutting) alongside the 8-page zine:
  - Card orientation: portrait (4.25 x 5.5 in, portrait sheet) or landscape (5.5 x 4.25 in, landscape sheet).
  - Fold: side fold (opens like a book) or top fold (flips up).
  - Print one side only, fold in half twice; fold steps are shown under the preview.
- Click any panel in the preview (or its Choose button) to pick the image for that spot; × empties it.
- Card mode hides the zine-only tools (folder picker, Auto-assign, alternate covers, cut guide, page numbers).
- Fixed Open Print View showing a blank tab (the popup was opened with `noopener`, which hides it from the app).

## Recent Updates (2026-05-25)

- Added optional alternate cover placement mode:
  - Standard order: image 1 = Front Cover, image 8 = Back Cover.
  - Alternate order: image 7 = Front Cover, image 6 = Back Cover, image 8 = Page 1.
  - Panel labels and optional number overlays follow the active image order.

## Recent Updates (2026-05-18)

- Added drag-and-swap panel reassignment directly in preview (drop one panel on another to swap).
- Added optional page numbers with folded-reading placement (odd lower-left, even lower-right; no covers).
- Improved folder load reporting to explicitly ignore hidden/system files like `.DS_Store`.
- Added fold-reference image (`how_to_fold.jpg`) below the preview.
- Added page/image notes in the UI (panel size and pixel equivalents).
- Added printer-margin compensation with targeted outer-column gutter expansion for better folded centering on non-borderless printers.

## Quickstart

1. Open `index.html` directly from the project folder.
2. If your browser blocks folder picking on `file://`, run a local server:

```bash
cd /path/to/zine-maker
python3 -m http.server 8000
```

3. Open `http://localhost:8000` in your browser.
4. In the app: pick your image folder, review assignments, then export PNG or open Print View.

## Files

- `index.html` - UI shell
- `styles.css` - app styling
- `app.js` - image loading, imposition logic, preview, export
- `one_sheet_8_page_zine_imposition_prd.md` - product spec (8-page zine)

## How to Run

1. Open `index.html` directly in a modern browser, or serve the folder locally.
2. Choose a format. For a zine, select a folder of images. For a card, click each panel to pick its image.
3. Review/adjust slot assignments.
4. Set margin, scaling, and guide options.
5. Export PNG (recommended: 300 DPI) or open Print View.

## Supported Input

- `.png`
- `.jpg` / `.jpeg`
- `.webp` (browser support dependent)

Unsupported files are ignored.
When selecting folders, browsers can include hidden/system files (for example `.DS_Store` on macOS); those are now explicitly reported and ignored.

## Imposition Layout (Required Map)

Top row (rotated 180 degrees):

- col1: Page 4
- col2: Page 3
- col3: Page 2
- col4: Page 1

Bottom row (upright):

- col1: Page 5
- col2: Page 6
- col3: Back Cover
- col4: Front Cover

## Geometry

- Sheet: `11 x 8.5 in` (landscape)
- Grid: `4 x 2`
- Panel: `2.75 x 4.25 in`
- 300 DPI export: `3300 x 2550 px`

## Options Included

- Manual page/image slot reassignment
- Drag-and-swap directly on preview panels (drag one panel to another to swap assignments)
- Assignment order: Front Cover, Page 1, Page 2, Page 3, Page 4, Page 5, Page 6, Back Cover
- Optional alternate cover placement auto-assignment mode:
  - image 7 -> Front Cover
  - image 8 -> Page 1
  - image 1 -> Page 2
  - image 2 -> Page 3
  - image 3 -> Page 4
  - image 4 -> Page 5
  - image 5 -> Page 6
  - image 6 -> Back Cover
  - Preview panel labels and optional number overlays use the alternate source-image order.
- Margin in inches (preset + custom input)
- Optional printer-margin compensation mode:
  - Printer non-printable edge input (for example `0.25 in`)
  - Inner gutter input between panels/cards
  - Reduces outer insets and selectively expands inner gutter only on outer columns (`Page 4/5` right side, `Page 1/Front` left side) to better center folded output without over-shrinking middle pages
- Scale mode:
  - `contain` (default, no crop)
  - `cover` (fills panel, crops overflow)
- Toggle fold/grid guides (panel borders are part of this guide layer)
- Toggle center cut guide
- Toggle panel labels
- Optional page numbers:
  - No numbers on Front Cover or Back Cover
  - Page 1/3/5 lower-left, Page 2/4/6 lower-right (in folded reading orientation)
  - Style: numbers only (`1`) or `Page 1`
- Configurable export DPI for PNG

## Printing Notes

- Print landscape.
- Print at 100% / Actual Size.
- Do not use "Fit to page" if it changes scaling.
- Fold on guide lines.
- Cut center slit.
- Fold into mini-zine booklet.

## Notes

- All processing stays local in the browser.
- Source images are treated as upright; the app applies required panel rotations during imposition.
- The layout map is centralized in `app.js` (`IMPOSITION_LAYOUT`) for easy modification.
