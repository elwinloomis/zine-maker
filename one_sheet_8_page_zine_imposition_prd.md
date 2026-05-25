# PRD: One-Sheet 8-Page Zine Image Imposition Tool

## 1. Purpose

Build a program that takes 8 user-provided page images in normal reading orientation and automatically lays them out onto one US Letter sheet so the printed sheet can be folded/cut into a standard 8-page one-sheet mini-zine.

The program handles:

- US Letter landscape page setup: 11 in wide x 8.5 in tall.
- 4 columns x 2 rows of equal panels.
- Correct zine page order.
- Correct 180-degree rotation for the top row.
- Proportional image scaling to fit each panel.
- Optional margins/safe areas inside each panel.
- Export to PDF and/or high-resolution raster image.

This is an imposition tool, not an editor. The user supplies page art already facing the correct way for reading. The program rotates and positions the art for printing.

---

## 2. Verified zine format

This PRD describes the common one-sheet / mini-zine format:

- Start with one sheet of paper.
- Fold it into 8 equal sections.
- Cut a slit in the center fold.
- Refold the sheet into an 8-page booklet.

Sources checked:

- ICA Boston: describes letter-sized paper, folding into 8 equal sections, cutting halfway across the middle, then folding into an 8-page booklet.
- Tahoe Trail Guide: describes an 8-page zine from a single sheet of copy paper, with a template showing the page layout.
- CYOO / Zine Lab: describes the eight-page mini-zine / one-page zine as requiring one sheet of paper and one cut, and provides a letter-size template.
- Sedgwick Museum PDF: describes folding a sheet into eight boxes and cutting halfway down the center crease.

This PRD assumes US Letter paper, not A4.

---

## 3. Page geometry

### 3.1 Physical sheet

Use landscape orientation.

```text
Sheet width:  11.0 inches
Sheet height:  8.5 inches
```

### 3.2 Grid

The sheet is divided into 4 columns and 2 rows.

```text
Columns: 4
Rows:    2
```

Each panel/page cell is therefore:

```text
Panel width:  11.0 / 4 = 2.75 inches
Panel height:  8.5 / 2 = 4.25 inches
```

Each finished zine page is portrait-oriented:

```text
Finished page size: 2.75 in wide x 4.25 in tall
```

### 3.3 PDF point dimensions

If exporting PDF, use 72 points per inch.

```text
Sheet width:   11.0 * 72 = 792 pt
Sheet height:   8.5 * 72 = 612 pt
Panel width:    2.75 * 72 = 198 pt
Panel height:   4.25 * 72 = 306 pt
```

### 3.4 Raster dimensions by DPI

If exporting a raster image, compute dimensions from DPI.

At 300 DPI:

```text
Sheet width:   11.0 * 300 = 3300 px
Sheet height:   8.5 * 300 = 2550 px
Panel width:    2.75 * 300 = 825 px
Panel height:   4.25 * 300 = 1275 px
```

Formula:

```text
sheet_px_w = 11.0 * dpi
sheet_px_h = 8.5 * dpi
panel_px_w = 2.75 * dpi
panel_px_h = 4.25 * dpi
```

---

## 4. Coordinate system

Use a top-left origin for layout logic.

```text
x increases left to right
y increases top to bottom
```

The sheet is landscape:

```text
(0,0) is the top-left corner of the 11 x 8.5 sheet.
```

Columns:

```text
col 0: x = 0.00 in
col 1: x = 2.75 in
col 2: x = 5.50 in
col 3: x = 8.25 in
```

Rows:

```text
row 0: y = 0.00 in
row 1: y = 4.25 in
```

---

## 5. Required page map

The printed sheet should be laid out as follows when viewed in landscape orientation.

Top row art is rotated 180 degrees.
Bottom row art is upright.

```text
+----------+----------+----------+----------+
| Page 4   | Page 3   | Page 2   | Page 1   |   top row, rotated 180 degrees
+----------+----------+----------+----------+
| Page 5   | Page 6   | Back     | Front    |   bottom row, upright
+----------+----------+----------+----------+
```

### 5.1 Canonical content slots

The input should accept these 8 logical page slots:

```text
front
page_1
page_2
page_3
page_4
page_5
page_6
back
```

Equivalent numeric interpretation:

```text
front = cover / page 0 / page 1 depending on naming convention
page_1 = first interior page
page_2 = second interior page
page_3 = third interior page
page_4 = fourth interior page
page_5 = fifth interior page
page_6 = sixth interior page
back = back cover
```

For user-facing UI, prefer the labels:

```text
Front, Page 1, Page 2, Page 3, Page 4, Page 5, Page 6, Back
```

### 5.2 Placement table in inches

| Slot | Row | Col | x in | y in | w in | h in | Rotation |
|---|---:|---:|---:|---:|---:|---:|---:|
| page_4 | 0 | 0 | 0.00 | 0.00 | 2.75 | 4.25 | 180 |
| page_3 | 0 | 1 | 2.75 | 0.00 | 2.75 | 4.25 | 180 |
| page_2 | 0 | 2 | 5.50 | 0.00 | 2.75 | 4.25 | 180 |
| page_1 | 0 | 3 | 8.25 | 0.00 | 2.75 | 4.25 | 180 |
| page_5 | 1 | 0 | 0.00 | 4.25 | 2.75 | 4.25 | 0 |
| page_6 | 1 | 1 | 2.75 | 4.25 | 2.75 | 4.25 | 0 |
| back | 1 | 2 | 5.50 | 4.25 | 2.75 | 4.25 | 0 |
| front | 1 | 3 | 8.25 | 4.25 | 2.75 | 4.25 | 0 |

### 5.3 Placement table in PDF points

| Slot | Row | Col | x pt | y pt | w pt | h pt | Rotation |
|---|---:|---:|---:|---:|---:|---:|---:|
| page_4 | 0 | 0 | 0 | 0 | 198 | 306 | 180 |
| page_3 | 0 | 1 | 198 | 0 | 198 | 306 | 180 |
| page_2 | 0 | 2 | 396 | 0 | 198 | 306 | 180 |
| page_1 | 0 | 3 | 594 | 0 | 198 | 306 | 180 |
| page_5 | 1 | 0 | 0 | 306 | 198 | 306 | 0 |
| page_6 | 1 | 1 | 198 | 306 | 198 | 306 | 0 |
| back | 1 | 2 | 396 | 306 | 198 | 306 | 0 |
| front | 1 | 3 | 594 | 306 | 198 | 306 | 0 |

### 5.4 Placement table in pixels at 300 DPI

| Slot | Row | Col | x px | y px | w px | h px | Rotation |
|---|---:|---:|---:|---:|---:|---:|---:|
| page_4 | 0 | 0 | 0 | 0 | 825 | 1275 | 180 |
| page_3 | 0 | 1 | 825 | 0 | 825 | 1275 | 180 |
| page_2 | 0 | 2 | 1650 | 0 | 825 | 1275 | 180 |
| page_1 | 0 | 3 | 2475 | 0 | 825 | 1275 | 180 |
| page_5 | 1 | 0 | 0 | 1275 | 825 | 1275 | 0 |
| page_6 | 1 | 1 | 825 | 1275 | 825 | 1275 | 0 |
| back | 1 | 2 | 1650 | 1275 | 825 | 1275 | 0 |
| front | 1 | 3 | 2475 | 1275 | 825 | 1275 | 0 |

---

## 6. Margin / safe-area behavior

The program should support an optional margin inside each panel.

Default margin:

```text
0.125 in recommended default
0.0 in allowed
```

The content box inside a panel is:

```text
content_x = panel_x + margin
content_y = panel_y + margin
content_w = panel_w - (2 * margin)
content_h = panel_h - (2 * margin)
```

At 0.125 in margin:

```text
content_w = 2.75 - 0.25 = 2.50 in
content_h = 4.25 - 0.25 = 4.00 in
```

At 300 DPI:

```text
margin_px = 0.125 * 300 = 37.5 px
content_w = 825 - 75 = 750 px
content_h = 1275 - 75 = 1200 px
```

Implementation should allow fractional pixels internally but should round final raster placement consistently.

Recommended raster rounding:

```text
x = round(x)
y = round(y)
w = round(w)
h = round(h)
```

---

## 7. Image sizing modes

The user provides each page image in normal reading orientation.

The program should support these sizing modes.

### 7.1 Default: contain

This is the required default.

Scale the image proportionally so the entire image fits within the content box. No cropping. Center it in the content box.

```text
scale = min(content_w / image_w, content_h / image_h)
placed_w = image_w * scale
placed_h = image_h * scale
placed_x = content_x + (content_w - placed_w) / 2
placed_y = content_y + (content_h - placed_h) / 2
```

This satisfies the practical requirement that the image is scaled proportionally and no edge exceeds the bounds. For normal portrait zine pages, the longest edge will usually fit to the height of the content box.

### 7.2 Optional: cover / crop-to-fill

Scale proportionally so the content box is completely filled, then crop overflow from the center.

```text
scale = max(content_w / image_w, content_h / image_h)
placed_w = image_w * scale
placed_h = image_h * scale
crop_center_to_content_box = true
```

Use this only if the user explicitly wants full-bleed / no white space.

### 7.3 Optional: fit-width

Scale proportionally so image width equals content width. Allow vertical letterboxing or overflow handling depending on setting.

```text
scale = content_w / image_w
```

If the resulting height exceeds content height, fall back to `contain` unless `allow_overflow` is true.

### 7.4 Optional: fit-height

Scale proportionally so image height equals content height. Allow horizontal letterboxing or overflow handling depending on setting.

```text
scale = content_h / image_h
```

If the resulting width exceeds content width, fall back to `contain` unless `allow_overflow` is true.

---

## 8. Rotation behavior

Important: the user-supplied images are assumed to be upright and readable before imposition.

The program must:

1. Load each source image in normal reading orientation.
2. Scale it proportionally to fit the panel content box.
3. Center it in the content box.
4. Rotate the final placed content according to the page map.

Top-row panels are rotated 180 degrees.
Bottom-row panels are not rotated.

### 8.1 Recommended transform model

For each panel:

```text
panel_center_x = panel_x + panel_w / 2
panel_center_y = panel_y + panel_h / 2
```

If rotation is 180 degrees:

```text
translate to panel center
rotate 180 degrees
place centered image relative to panel/content box
translate back
```

For raster implementations, it is often simpler to:

1. Create a temporary transparent panel-sized canvas.
2. Place the scaled upright image into the panel canvas using margin and centering.
3. Rotate the entire panel canvas 180 degrees if required.
4. Paste the panel canvas into its sheet position.

This avoids coordinate mistakes.

---

## 9. Fold and cut guide rendering

Optional but useful for testing/debugging.

The program should support guide layers:

```text
guides: none | trim | fold | debug
```

Recommended guide positions in inches:

Vertical fold/grid lines:

```text
x = 2.75
x = 5.50
x = 8.25
```

Horizontal fold/grid line:

```text
y = 4.25
```

Center slit:

```text
The slit lies along the center horizontal fold line, y = 4.25 in,
from x = 2.75 in to x = 8.25 in.
```

This corresponds to the middle two columns only.

Debug mode should label each panel with slot name, row/column, and rotation.

Guides should be off by default for final export.

---

## 10. Input requirements

Minimum input:

```json
{
  "front": "front.png",
  "page_1": "page_1.png",
  "page_2": "page_2.png",
  "page_3": "page_3.png",
  "page_4": "page_4.png",
  "page_5": "page_5.png",
  "page_6": "page_6.png",
  "back": "back.png"
}
```

Optional config:

```json
{
  "paper": "letter",
  "orientation": "landscape",
  "dpi": 300,
  "margin_in": 0.125,
  "sizing_mode": "contain",
  "alternate_cover_placement": false,
  "background": "white",
  "guides": "none",
  "output_format": "pdf"
}
```

### 10.1 Alternate cover placement

The implementation supports an optional auto-assignment mode for source image sets where the front/back covers sit in the middle of the sorted image sequence.

Standard sorted-image assignment:

| Image order | Logical slot |
|---:|---|
| 1 | front |
| 2 | page_1 |
| 3 | page_2 |
| 4 | page_3 |
| 5 | page_4 |
| 6 | page_5 |
| 7 | page_6 |
| 8 | back |

Alternate sorted-image assignment:

| Image order | Logical slot |
|---:|---|
| 1 | page_2 |
| 2 | page_3 |
| 3 | page_4 |
| 4 | page_5 |
| 5 | page_6 |
| 6 | back |
| 7 | front |
| 8 | page_1 |

When enabled, this mode changes auto-assignment from loaded image order. Preview panel labels and optional number overlays also reflect the active source-image order, so the visible imposed sheet can be checked as `3, 2, 1, 8 / 4, 5, 6, 7`. The physical imposition layout remains unchanged.

---

## 11. Output requirements

The program should export one imposed sheet.

Preferred outputs:

```text
PDF: exact 11 x 8.5 inch page size, landscape
PNG: 3300 x 2550 px at 300 DPI if raster output is selected
```

For PDF output:

- Use real page size: 792 pt x 612 pt.
- Do not rely on printer scaling.
- Output should be intended for printing at 100% / Actual Size.

For PNG output:

- Include DPI metadata when possible.
- Canvas should be exactly `11*dpi` by `8.5*dpi` pixels.

---

## 12. Acceptance criteria

The implementation is correct when:

1. The output sheet is landscape US Letter, 11 x 8.5 inches.
2. The sheet has 8 equal panels, each 2.75 x 4.25 inches.
3. Page order is:

```text
Top row:    page_4, page_3, page_2, page_1
Bottom row: page_5, page_6, back, front
```

4. Top-row pages are rotated 180 degrees.
5. Bottom-row pages are upright.
6. Each image is scaled proportionally.
7. In `contain` mode, no image is cropped and no image exceeds its content box.
8. Optional margin is applied equally inside each panel.
9. The center slit guide, if enabled, runs from x=2.75 in to x=8.25 in at y=4.25 in.
10. When printed at 100% and folded/cut, the booklet reads in order:

```text
Front -> Page 1 -> Page 2 -> Page 3 -> Page 4 -> Page 5 -> Page 6 -> Back
```

---

## 13. Pseudocode

```pseudo
SHEET_W_IN = 11.0
SHEET_H_IN = 8.5
COLS = 4
ROWS = 2
PANEL_W_IN = SHEET_W_IN / COLS      # 2.75
PANEL_H_IN = SHEET_H_IN / ROWS      # 4.25

layout = [
  {slot: "page_4", row: 0, col: 0, rotation: 180},
  {slot: "page_3", row: 0, col: 1, rotation: 180},
  {slot: "page_2", row: 0, col: 2, rotation: 180},
  {slot: "page_1", row: 0, col: 3, rotation: 180},
  {slot: "page_5", row: 1, col: 0, rotation: 0},
  {slot: "page_6", row: 1, col: 1, rotation: 0},
  {slot: "back",   row: 1, col: 2, rotation: 0},
  {slot: "front",  row: 1, col: 3, rotation: 0}
]

for item in layout:
  panel_x = item.col * PANEL_W
  panel_y = item.row * PANEL_H
  content_x = panel_x + margin
  content_y = panel_y + margin
  content_w = PANEL_W - 2 * margin
  content_h = PANEL_H - 2 * margin

  image = load(inputs[item.slot])

  if sizing_mode == "contain":
    scale = min(content_w / image.width, content_h / image.height)
  else if sizing_mode == "cover":
    scale = max(content_w / image.width, content_h / image.height)

  placed_w = image.width * scale
  placed_h = image.height * scale
  placed_x = content_x + (content_w - placed_w) / 2
  placed_y = content_y + (content_h - placed_h) / 2

  if raster:
    panel_canvas = blank(PANEL_W, PANEL_H)
    place image on panel_canvas at margin-adjusted centered position
    if item.rotation == 180:
      panel_canvas = rotate(panel_canvas, 180)
    paste panel_canvas onto sheet at panel_x, panel_y

  if pdf/vector:
    save graphics state
    if item.rotation == 180:
      rotate around panel center by 180 degrees
    draw image into placed rectangle
    restore graphics state
```

---

## 14. Notes for implementation agents

- Do not rotate the user's source files permanently.
- Do not assume the source image pixel dimensions match the zine panel aspect ratio.
- Do not stretch images non-proportionally.
- Do not print guides unless requested.
- Do not use printer defaults such as “fit to printable area”; final PDFs should be printed at 100% / Actual Size.
- If the printer cannot print full-bleed, use a margin such as 0.125 in or 0.25 in.
- For home printing, content near fold lines may be slightly distorted by folding. Keep important text away from edges and folds.

---

## 15. Implementation Addendum

Additional implemented features beyond this base PRD:

- Alternate cover placement auto-assignment:
  - image 7 -> Front Cover
  - image 8 -> Page 1
  - image 1 -> Page 2
  - image 2 -> Page 3
  - image 3 -> Page 4
  - image 4 -> Page 5
  - image 5 -> Page 6
  - image 6 -> Back Cover
  - Preview labels and optional number overlays follow source image order in this mode.
- Drag-and-swap reassignment directly on the preview canvas.
- Optional page numbers:
  - Covers omitted
  - Page 1/3/5 lower-left, Page 2/4/6 lower-right
  - Style: numeric only (`1`) or `Page 1`
- Printer compensation mode for non-borderless printers:
  - `printer non-printable edge` input
  - `inner gutter` input
  - Targeted gutter expansion on outer columns only to improve folded centering while minimizing over-shrink in middle columns.
- Fold/grid guides toggle controls both fold lines and panel border lines.
