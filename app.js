"use strict";

(() => {
  const SHEET_IN = { width: 11, height: 8.5 };
  const GRID = { cols: 4, rows: 2 };
  const PANEL_IN = {
    width: SHEET_IN.width / GRID.cols,
    height: SHEET_IN.height / GRID.rows
  };

  const PREVIEW_PPI = 100;
  const PRESET_MARGINS = [0, 0.0625, 0.125, 0.1875, 0.25];
  const SLOT_ORDER = ["front", "page_1", "page_2", "page_3", "page_4", "page_5", "page_6", "back"];
  const SLOT_LABELS = {
    front: "Front Cover",
    page_1: "Page 1",
    page_2: "Page 2",
    page_3: "Page 3",
    page_4: "Page 4",
    page_5: "Page 5",
    page_6: "Page 6",
    back: "Back Cover"
  };

  // Central imposition map, easy to edit if layout rules change later.
  const IMPOSITION_LAYOUT = [
    { slot: "page_4", row: 0, col: 0, rotation: 180 },
    { slot: "page_3", row: 0, col: 1, rotation: 180 },
    { slot: "page_2", row: 0, col: 2, rotation: 180 },
    { slot: "page_1", row: 0, col: 3, rotation: 180 },
    { slot: "page_5", row: 1, col: 0, rotation: 0 },
    { slot: "page_6", row: 1, col: 1, rotation: 0 },
    { slot: "back", row: 1, col: 2, rotation: 0 },
    { slot: "front", row: 1, col: 3, rotation: 0 }
  ];

  const state = {
    images: [],
    imageById: new Map(),
    assignment: createEmptyAssignment(),
    marginIn: 0.125,
    useGutterLayout: false,
    printerMarginIn: 0.25,
    innerGutterIn: 0.125,
    scaleMode: "contain",
    showFoldGuides: true,
    showCutGuide: true,
    showLabels: true,
    showPageNumbers: false,
    pageNumberStyle: "number",
    exportDpi: 300,
    // Drag state is purely UI/preview interaction state (no export impact).
    dragState: {
      active: false,
      sourceSlot: null,
      targetSlot: null
    }
  };

  const ui = {
    imagePicker: document.getElementById("imagePicker"),
    autoAssignBtn: document.getElementById("autoAssignBtn"),
    clearBtn: document.getElementById("clearBtn"),
    loadStatus: document.getElementById("loadStatus"),
    assignmentList: document.getElementById("assignmentList"),
    imageCatalog: document.getElementById("imageCatalog"),
    previewCanvas: document.getElementById("previewCanvas"),
    marginPreset: document.getElementById("marginPreset"),
    marginInput: document.getElementById("marginInput"),
    useGutterLayout: document.getElementById("useGutterLayout"),
    printerMarginIn: document.getElementById("printerMarginIn"),
    innerGutterIn: document.getElementById("innerGutterIn"),
    scaleMode: document.getElementById("scaleMode"),
    showFoldGuides: document.getElementById("showFoldGuides"),
    showCutGuide: document.getElementById("showCutGuide"),
    showLabels: document.getElementById("showLabels"),
    showPageNumbers: document.getElementById("showPageNumbers"),
    pageNumberStyle: document.getElementById("pageNumberStyle"),
    exportDpi: document.getElementById("exportDpi"),
    exportPngBtn: document.getElementById("exportPngBtn"),
    printViewBtn: document.getElementById("printViewBtn"),
    exportStatus: document.getElementById("exportStatus")
  };

  init();

  function init() {
    bindEvents();
    syncGutterControlsEnabled();
    renderAssignmentList();
    renderCatalog();
    renderPreview();
  }

  function bindEvents() {
    ui.imagePicker.addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      await loadFiles(files);
    });

    ui.autoAssignBtn.addEventListener("click", () => {
      autoAssign();
      renderAssignmentList();
      renderPreview();
      setLoadStatus("Auto-assigned images alphabetically (with filename slot matching when possible).");
    });

    ui.clearBtn.addEventListener("click", () => {
      clearAllImages();
      state.assignment = createEmptyAssignment();
      cancelDrag();
      renderAssignmentList();
      renderCatalog();
      renderPreview();
      setLoadStatus("Cleared all images and assignments.");
      setExportStatus("");
      ui.imagePicker.value = "";
    });

    ui.marginPreset.addEventListener("change", () => {
      const value = Number.parseFloat(ui.marginPreset.value);
      if (Number.isFinite(value)) {
        state.marginIn = sanitizeMargin(value);
        ui.marginInput.value = formatNumber(state.marginIn, 4);
        renderPreview();
      }
    });

    ui.marginInput.addEventListener("input", () => {
      const value = Number.parseFloat(ui.marginInput.value);
      if (!Number.isFinite(value)) {
        return;
      }
      state.marginIn = sanitizeMargin(value);
      syncMarginPreset();
      renderPreview();
    });

    ui.marginInput.addEventListener("change", () => {
      ui.marginInput.value = formatNumber(state.marginIn, 4);
    });

    ui.useGutterLayout.addEventListener("change", () => {
      state.useGutterLayout = ui.useGutterLayout.checked;
      syncGutterControlsEnabled();
      renderPreview();
    });

    ui.printerMarginIn.addEventListener("input", () => {
      const value = Number.parseFloat(ui.printerMarginIn.value);
      if (!Number.isFinite(value)) {
        return;
      }
      state.printerMarginIn = sanitizeInches(value);
      renderPreview();
    });

    ui.printerMarginIn.addEventListener("change", () => {
      ui.printerMarginIn.value = formatNumber(state.printerMarginIn, 3);
    });

    ui.innerGutterIn.addEventListener("input", () => {
      const value = Number.parseFloat(ui.innerGutterIn.value);
      if (!Number.isFinite(value)) {
        return;
      }
      state.innerGutterIn = sanitizeInches(value);
      renderPreview();
    });

    ui.innerGutterIn.addEventListener("change", () => {
      ui.innerGutterIn.value = formatNumber(state.innerGutterIn, 3);
    });

    ui.scaleMode.addEventListener("change", () => {
      state.scaleMode = ui.scaleMode.value === "cover" ? "cover" : "contain";
      renderPreview();
    });

    ui.showFoldGuides.addEventListener("change", () => {
      state.showFoldGuides = ui.showFoldGuides.checked;
      renderPreview();
    });

    ui.showCutGuide.addEventListener("change", () => {
      state.showCutGuide = ui.showCutGuide.checked;
      renderPreview();
    });

    ui.showLabels.addEventListener("change", () => {
      state.showLabels = ui.showLabels.checked;
      renderPreview();
    });

    ui.showPageNumbers.addEventListener("change", () => {
      state.showPageNumbers = ui.showPageNumbers.checked;
      ui.pageNumberStyle.disabled = !state.showPageNumbers;
      renderPreview();
    });

    ui.pageNumberStyle.addEventListener("change", () => {
      state.pageNumberStyle = ui.pageNumberStyle.value === "page" ? "page" : "number";
      renderPreview();
    });

    ui.exportDpi.addEventListener("change", () => {
      const dpi = getExportDpi();
      state.exportDpi = dpi;
      ui.exportDpi.value = String(dpi);
    });

    ui.exportPngBtn.addEventListener("click", () => {
      exportPng();
    });

    ui.printViewBtn.addEventListener("click", () => {
      openPrintView();
    });

    ui.previewCanvas.addEventListener("pointerdown", onPreviewPointerDown);
    ui.previewCanvas.addEventListener("pointermove", onPreviewPointerMove);
    ui.previewCanvas.addEventListener("pointerup", onPreviewPointerUp);
    ui.previewCanvas.addEventListener("pointercancel", onPreviewPointerCancel);
    ui.previewCanvas.addEventListener("pointerleave", onPreviewPointerLeave);
  }

  async function loadFiles(files) {
    clearAllImages();
    state.assignment = createEmptyAssignment();
    cancelDrag();
    setExportStatus("");

    if (!files.length) {
      setLoadStatus("No files selected.");
      renderAssignmentList();
      renderCatalog();
      renderPreview();
      return;
    }

    const hiddenSystemFiles = files.filter(isHiddenOrSystemFile);
    const candidateFiles = files.filter((file) => !isHiddenOrSystemFile(file));
    const supported = candidateFiles.filter(isSupportedImageFile);
    const unsupportedFiles = candidateFiles.filter((file) => !isSupportedImageFile(file));
    const unsupportedCount = unsupportedFiles.length;

    const sortedFiles = [...supported].sort((a, b) =>
      getSortName(a).localeCompare(getSortName(b), undefined, { numeric: true, sensitivity: "base" })
    );

    const loadedAssets = (
      await Promise.all(
        sortedFiles.map((file, index) =>
          loadImageAsset(file, index).catch(() => null)
        )
      )
    ).filter(Boolean);

    state.images = loadedAssets;
    state.imageById = new Map(loadedAssets.map((asset) => [asset.id, asset]));
    autoAssign();

    const dropped = supported.length - loadedAssets.length;
    const statusParts = [`Loaded ${loadedAssets.length} image(s).`];
    if (hiddenSystemFiles.length) {
      statusParts.push(
        `Ignored ${hiddenSystemFiles.length} hidden/system file(s)${formatFileExamples(hiddenSystemFiles)}.`
      );
    }
    if (unsupportedCount) {
      statusParts.push(
        `Ignored ${unsupportedCount} unsupported file(s)${formatFileExamples(unsupportedFiles)}.`
      );
    }
    if (dropped) {
      statusParts.push(`${dropped} image(s) could not be decoded.`);
    }
    setLoadStatus(statusParts.join(" "));

    renderAssignmentList();
    renderCatalog();
    renderPreview();
  }

  function isSupportedImageFile(file) {
    return /\.(png|jpe?g|webp)$/i.test(file.name);
  }

  function isHiddenOrSystemFile(file) {
    const name = file.name || "";
    return (
      name.startsWith(".") ||
      name.startsWith("._") ||
      /^thumbs\.db$/i.test(name) ||
      /^desktop\.ini$/i.test(name)
    );
  }

  function formatFileExamples(files, maxExamples = 2) {
    if (!files.length) {
      return "";
    }
    const names = files
      .slice(0, maxExamples)
      .map((file) => file.name)
      .join(", ");
    const suffix = files.length > maxExamples ? ", ..." : "";
    return ` (${names}${suffix})`;
  }

  function getSortName(file) {
    return file.webkitRelativePath || file.name;
  }

  async function loadImageAsset(file, index) {
    const url = URL.createObjectURL(file);
    const img = await loadImageElement(url);
    return {
      id: `${index}-${file.name}-${file.size}-${file.lastModified}`,
      file,
      url,
      img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      sortName: getSortName(file)
    };
  }

  function loadImageElement(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function clearAllImages() {
    for (const asset of state.images) {
      URL.revokeObjectURL(asset.url);
    }
    state.images = [];
    state.imageById = new Map();
  }

  function createEmptyAssignment() {
    const empty = {};
    for (const slot of SLOT_ORDER) {
      empty[slot] = "";
    }
    return empty;
  }

  function autoAssign() {
    const assignment = createEmptyAssignment();
    const usedIds = new Set();

    // First pass: try to honor semantic filename matches (front, back, page_1, etc.).
    for (const slot of SLOT_ORDER) {
      const matched = state.images.find((asset) => {
        if (usedIds.has(asset.id)) {
          return false;
        }
        return nameLooksLikeSlot(asset.file.name, slot);
      });
      if (matched) {
        assignment[slot] = matched.id;
        usedIds.add(matched.id);
      }
    }

    // Second pass: fill any still-empty slots by alphabetical file order.
    const remaining = state.images.filter((asset) => !usedIds.has(asset.id));
    for (const slot of SLOT_ORDER) {
      if (!assignment[slot] && remaining.length) {
        assignment[slot] = remaining.shift().id;
      }
    }

    state.assignment = assignment;
  }

  function nameLooksLikeSlot(filename, slot) {
    const base = normalizeFilename(filename);
    if (!base) {
      return false;
    }

    if (slot === "front") {
      return /(^|[^a-z0-9])front([^a-z0-9]|$)/.test(base) || /^cover$/.test(base);
    }
    if (slot === "back") {
      return /(^|[^a-z0-9])back([^a-z0-9]|$)/.test(base) || /cover[^a-z0-9]*back/.test(base);
    }

    const pageMatch = slot.match(/^page_(\d)$/);
    if (!pageMatch) {
      return false;
    }
    const pageNum = pageMatch[1];
    const slotRegex = new RegExp(`(^|[^a-z0-9])(?:page|p)[-_ ]*${pageNum}([^a-z0-9]|$)`);
    return slotRegex.test(base);
  }

  function normalizeFilename(filename) {
    return filename
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function renderAssignmentList() {
    const fragment = document.createDocumentFragment();
    ui.assignmentList.innerHTML = "";

    for (const slot of SLOT_ORDER) {
      const row = document.createElement("div");
      row.className = "assignment-row";

      const label = document.createElement("label");
      label.textContent = SLOT_LABELS[slot];
      label.htmlFor = `assign-${slot}`;

      const select = document.createElement("select");
      select.id = `assign-${slot}`;
      select.dataset.slot = slot;

      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "(none)";
      select.appendChild(blank);

      for (const asset of state.images) {
        const option = document.createElement("option");
        option.value = asset.id;
        option.textContent = asset.sortName;
        select.appendChild(option);
      }

      select.value = state.assignment[slot] || "";
      select.addEventListener("change", () => {
        assignImageToSlot(slot, select.value);
      });

      row.append(label, select);
      fragment.appendChild(row);
    }

    ui.assignmentList.appendChild(fragment);
  }

  function assignImageToSlot(slot, imageId) {
    if (!slot) {
      return;
    }

    for (const otherSlot of SLOT_ORDER) {
      if (otherSlot !== slot && state.assignment[otherSlot] === imageId) {
        state.assignment[otherSlot] = "";
      }
    }

    state.assignment[slot] = imageId || "";
    renderAssignmentList();
    renderPreview();
  }

  function renderCatalog() {
    ui.imageCatalog.innerHTML = "";
    if (!state.images.length) {
      const li = document.createElement("li");
      li.textContent = "No images loaded.";
      ui.imageCatalog.appendChild(li);
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const asset of state.images) {
      const li = document.createElement("li");
      li.textContent = `${asset.sortName} (${asset.width} x ${asset.height})`;
      fragment.appendChild(li);
    }
    ui.imageCatalog.appendChild(fragment);
  }

  function renderPreview() {
    renderSheet(ui.previewCanvas, {
      ppi: PREVIEW_PPI,
      marginIn: state.marginIn,
      useGutterLayout: state.useGutterLayout,
      printerMarginIn: state.printerMarginIn,
      innerGutterIn: state.innerGutterIn,
      scaleMode: state.scaleMode,
      showFoldGuides: state.showFoldGuides,
      showCutGuide: state.showCutGuide,
      showLabels: state.showLabels,
      showPageNumbers: state.showPageNumbers,
      pageNumberStyle: state.pageNumberStyle,
      dragState: state.dragState
    });
  }

  function renderSheet(canvas, options) {
    const ppi = options.ppi;
    const pageWidthPx = Math.round(SHEET_IN.width * ppi);
    const pageHeightPx = Math.round(SHEET_IN.height * ppi);

    if (canvas.width !== pageWidthPx || canvas.height !== pageHeightPx) {
      canvas.width = pageWidthPx;
      canvas.height = pageHeightPx;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, pageWidthPx, pageHeightPx);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

    for (const panel of IMPOSITION_LAYOUT) {
      drawPanelContent(ctx, panel, options);
    }

    if (options.showFoldGuides) {
      drawPanelBoundaries(ctx, ppi);
      drawFoldGuides(ctx, ppi);
    }

    if (options.showCutGuide) {
      drawCutGuide(ctx, ppi);
    }

    if (options.showLabels) {
      for (const panel of IMPOSITION_LAYOUT) {
        drawPanelLabel(ctx, panel, ppi);
      }
    }

    if (options.dragState?.active) {
      drawDragOverlay(ctx, options.dragState, ppi);
    }
  }

  function drawPanelContent(ctx, panel, options) {
    const ppi = options.ppi;
    const panelRect = getPanelRectPx(panel, ppi);
    const panelWidthPx = Math.max(1, Math.round(panelRect.w));
    const panelHeightPx = Math.max(1, Math.round(panelRect.h));

    const panelCanvas = document.createElement("canvas");
    panelCanvas.width = panelWidthPx;
    panelCanvas.height = panelHeightPx;
    const panelCtx = panelCanvas.getContext("2d");
    panelCtx.imageSmoothingEnabled = true;
    panelCtx.imageSmoothingQuality = "high";

    const contentRect = getContentRectForPanel(panel, panelCanvas, options);

    const imageId = state.assignment[panel.slot];
    const asset = state.imageById.get(imageId);

    if (asset && contentRect.w > 0 && contentRect.h > 0) {
      drawImageFitted(panelCtx, asset.img, contentRect, options.scaleMode);
    } else {
      drawPlaceholder(panelCtx, contentRect);
    }

    if (options.showPageNumbers) {
      drawPageNumber(panelCtx, panel, contentRect, options);
    }

    // Keep panel drawing in a local canvas first, then rotate the full panel when needed.
    // This avoids complex coordinate math for "top row rotated 180" imposition rules.
    if (panel.rotation === 180) {
      ctx.save();
      ctx.translate(panelRect.x + panelRect.w / 2, panelRect.y + panelRect.h / 2);
      ctx.rotate(Math.PI);
      ctx.drawImage(panelCanvas, -panelRect.w / 2, -panelRect.h / 2, panelRect.w, panelRect.h);
      ctx.restore();
      return;
    }

    ctx.drawImage(panelCanvas, panelRect.x, panelRect.y, panelRect.w, panelRect.h);
  }

  function getContentRectForPanel(panel, panelCanvas, options) {
    const baseMarginPx = Math.max(0, options.marginIn * options.ppi);
    if (!options.useGutterLayout) {
      return {
        x: baseMarginPx,
        y: baseMarginPx,
        w: Math.max(0, panelCanvas.width - baseMarginPx * 2),
        h: Math.max(0, panelCanvas.height - baseMarginPx * 2)
      };
    }

    const printerMarginPx = Math.max(0, options.printerMarginIn * options.ppi);
    const gutterPx = Math.max(0, options.innerGutterIn * options.ppi);

    // Compensated mode:
    // - keeps outer edges as tight as possible (countering printer non-printable edges)
    // - only expands inner gutter on outer columns so middle pages are not over-shrunk
    const outerInsetPx = Math.max(0, baseMarginPx - printerMarginPx);
    const isLeftEdge = panel.col === 0;
    const isRightEdge = panel.col === GRID.cols - 1;
    const isTopEdge = panel.row === 0;
    const isBottomEdge = panel.row === GRID.rows - 1;

    // Insets desired on the final sheet orientation.
    // Horizontal:
    // - Left column (page_4/page_5): expand right side by full gutter
    // - Right column (page_1/front): expand left side by full gutter
    // - Middle columns: keep base margin on both sides
    let sheetLeftInset = baseMarginPx;
    let sheetRightInset = baseMarginPx;
    if (isLeftEdge) {
      sheetLeftInset = outerInsetPx;
      sheetRightInset = baseMarginPx + gutterPx;
    } else if (isRightEdge) {
      sheetLeftInset = baseMarginPx + gutterPx;
      sheetRightInset = outerInsetPx;
    }

    // Vertical: only compensate top/bottom printable edges; keep center fold spacing unchanged.
    const sheetTopInset = isTopEdge ? outerInsetPx : baseMarginPx;
    const sheetBottomInset = isBottomEdge ? outerInsetPx : baseMarginPx;

    // Top-row panels are rendered to a local canvas and then rotated 180 degrees.
    // Map sheet-side insets back into local panel-canvas coordinates before drawing.
    const isRotated = panel.rotation === 180;
    const left = isRotated ? sheetRightInset : sheetLeftInset;
    const right = isRotated ? sheetLeftInset : sheetRightInset;
    const top = isRotated ? sheetBottomInset : sheetTopInset;
    const bottom = isRotated ? sheetTopInset : sheetBottomInset;

    return {
      x: left,
      y: top,
      w: Math.max(0, panelCanvas.width - left - right),
      h: Math.max(0, panelCanvas.height - top - bottom)
    };
  }

  function drawImageFitted(ctx, img, bounds, mode) {
    const imageWidth = img.naturalWidth || img.width;
    const imageHeight = img.naturalHeight || img.height;
    const scale =
      mode === "cover"
        ? Math.max(bounds.w / imageWidth, bounds.h / imageHeight)
        : Math.min(bounds.w / imageWidth, bounds.h / imageHeight);

    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const drawX = bounds.x + (bounds.w - drawWidth) / 2;
    const drawY = bounds.y + (bounds.h - drawHeight) / 2;

    if (mode === "cover") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
      return;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  function drawPlaceholder(ctx, bounds) {
    ctx.save();
    ctx.strokeStyle = "rgba(120, 131, 149, 0.55)";
    ctx.setLineDash([8, 5]);
    ctx.lineWidth = 1;
    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(80, 92, 114, 0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "14px sans-serif";
    ctx.fillText("No image", bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
    ctx.restore();
  }

  function drawPageNumber(ctx, panel, contentRect, options) {
    const pageNumber = getLogicalPageNumber(panel.slot);
    if (pageNumber == null) {
      // Covers intentionally get no page number.
      return;
    }

    // Folded-reading convention requested by user:
    // odd pages on lower-left, even pages on lower-right.
    const isLeft = pageNumber % 2 === 1;
    const text = options.pageNumberStyle === "page" ? `Page ${pageNumber}` : String(pageNumber);
    const ppi = options.ppi;
    const inset = Math.max(6, ppi * 0.07);
    const fontSize = Math.max(10, Math.round(ppi * 0.11));
    const x = isLeft
      ? Math.max(inset, contentRect.x + inset * 0.35)
      : Math.min(ctx.canvas.width - inset, contentRect.x + contentRect.w - inset * 0.35);
    const y = Math.min(ctx.canvas.height - inset, contentRect.y + contentRect.h - inset * 0.15);

    ctx.save();
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.textAlign = isLeft ? "left" : "right";
    ctx.textBaseline = "bottom";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, fontSize * 0.25);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillStyle = "rgba(15, 23, 42, 0.96)";
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function getLogicalPageNumber(slot) {
    const match = slot.match(/^page_(\d+)$/);
    return match ? Number.parseInt(match[1], 10) : null;
  }

  function drawPanelBoundaries(ctx, ppi) {
    ctx.save();
    ctx.strokeStyle = "#5f6d7f";
    ctx.lineWidth = Math.max(1, ppi / 180);
    for (let row = 0; row < GRID.rows; row += 1) {
      for (let col = 0; col < GRID.cols; col += 1) {
        const x = col * PANEL_IN.width * ppi;
        const y = row * PANEL_IN.height * ppi;
        const w = PANEL_IN.width * ppi;
        const h = PANEL_IN.height * ppi;
        ctx.strokeRect(x, y, w, h);
      }
    }
    ctx.restore();
  }

  function drawFoldGuides(ctx, ppi) {
    ctx.save();
    ctx.strokeStyle = "rgba(11, 95, 141, 0.78)";
    ctx.lineWidth = Math.max(1, ppi / 230);
    ctx.setLineDash([6, 6]);

    const foldX = [2.75, 5.5, 8.25];
    for (const xIn of foldX) {
      const x = xIn * ppi;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, SHEET_IN.height * ppi);
      ctx.stroke();
    }

    const y = 4.25 * ppi;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SHEET_IN.width * ppi, y);
    ctx.stroke();

    ctx.restore();
  }

  function drawCutGuide(ctx, ppi) {
    ctx.save();
    ctx.strokeStyle = "rgba(170, 24, 24, 0.95)";
    ctx.lineWidth = Math.max(1.3, ppi / 160);
    ctx.setLineDash([]);

    const y = 4.25 * ppi;
    const x1 = 2.75 * ppi;
    const x2 = 8.25 * ppi;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    ctx.restore();
  }

  function drawPanelLabel(ctx, panel, ppi) {
    const rect = getPanelRectPx(panel, ppi);
    const label = `${SLOT_LABELS[panel.slot]}${panel.rotation ? " (180°)" : ""}`;
    const pad = Math.max(6, ppi * 0.07);
    const fontSize = Math.max(10, Math.round(ppi * 0.12));

    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    if (panel.rotation === 180) {
      ctx.rotate(Math.PI);
    }
    ctx.font = `${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const boxHeight = fontSize + 8;
    const boxWidth = textWidth + 12;
    const boxX = -rect.w / 2 + pad;
    const boxY = -rect.h / 2 + pad;
    ctx.fillStyle = "rgba(24, 36, 52, 0.72)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.fillStyle = "#f8fafc";
    ctx.textBaseline = "top";
    ctx.fillText(label, boxX + 6, boxY + 4);
    ctx.restore();
  }

  function drawDragOverlay(ctx, dragState, ppi) {
    const sourcePanel = dragState.sourceSlot ? getPanelBySlot(dragState.sourceSlot) : null;
    const targetPanel = dragState.targetSlot ? getPanelBySlot(dragState.targetSlot) : null;

    if (sourcePanel) {
      const sourceRect = getPanelRectPx(sourcePanel, ppi);
      ctx.save();
      ctx.fillStyle = "rgba(15, 118, 110, 0.18)";
      ctx.strokeStyle = "rgba(15, 118, 110, 0.9)";
      ctx.lineWidth = Math.max(2, ppi / 90);
      ctx.fillRect(sourceRect.x, sourceRect.y, sourceRect.w, sourceRect.h);
      ctx.strokeRect(sourceRect.x, sourceRect.y, sourceRect.w, sourceRect.h);
      ctx.restore();
    }

    if (targetPanel && dragState.targetSlot !== dragState.sourceSlot) {
      const targetRect = getPanelRectPx(targetPanel, ppi);
      ctx.save();
      ctx.fillStyle = "rgba(190, 24, 93, 0.16)";
      ctx.strokeStyle = "rgba(190, 24, 93, 0.92)";
      ctx.lineWidth = Math.max(2, ppi / 90);
      ctx.fillRect(targetRect.x, targetRect.y, targetRect.w, targetRect.h);
      ctx.strokeRect(targetRect.x, targetRect.y, targetRect.w, targetRect.h);
      ctx.restore();
    }
  }

  function getPanelRectPx(panel, ppi) {
    return {
      x: panel.col * PANEL_IN.width * ppi,
      y: panel.row * PANEL_IN.height * ppi,
      w: PANEL_IN.width * ppi,
      h: PANEL_IN.height * ppi
    };
  }

  function getPanelBySlot(slot) {
    return IMPOSITION_LAYOUT.find((panel) => panel.slot === slot) || null;
  }

  function getPanelAtCanvasPoint(canvasX, canvasY, canvas) {
    if (canvasX < 0 || canvasY < 0 || canvasX > canvas.width || canvasY > canvas.height) {
      return null;
    }
    // Hit-test via logical grid math so it remains stable if preview CSS scales the canvas.
    const col = Math.floor((canvasX / canvas.width) * GRID.cols);
    const row = Math.floor((canvasY / canvas.height) * GRID.rows);
    return IMPOSITION_LAYOUT.find((panel) => panel.row === row && panel.col === col) || null;
  }

  function getCanvasPointFromPointerEvent(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  }

  function onPreviewPointerDown(event) {
    if (event.button !== 0) {
      return;
    }
    const point = getCanvasPointFromPointerEvent(event, ui.previewCanvas);
    if (!point) {
      return;
    }
    const panel = getPanelAtCanvasPoint(point.x, point.y, ui.previewCanvas);
    if (!panel) {
      return;
    }

    state.dragState.active = true;
    state.dragState.sourceSlot = panel.slot;
    state.dragState.targetSlot = panel.slot;
    ui.previewCanvas.classList.add("is-dragging");
    event.preventDefault();
    ui.previewCanvas.setPointerCapture(event.pointerId);
    renderPreview();
  }

  function onPreviewPointerMove(event) {
    if (!state.dragState.active) {
      return;
    }
    const point = getCanvasPointFromPointerEvent(event, ui.previewCanvas);
    if (!point) {
      return;
    }
    const panel = getPanelAtCanvasPoint(point.x, point.y, ui.previewCanvas);
    state.dragState.targetSlot = panel ? panel.slot : null;
    event.preventDefault();
    renderPreview();
  }

  function onPreviewPointerUp(event) {
    if (!state.dragState.active) {
      return;
    }
    const sourceSlot = state.dragState.sourceSlot;
    const targetSlot = state.dragState.targetSlot;

    // Swap assignments only when dropped on a different panel.
    if (sourceSlot && targetSlot && sourceSlot !== targetSlot) {
      swapAssignments(sourceSlot, targetSlot);
    }

    if (ui.previewCanvas.hasPointerCapture(event.pointerId)) {
      ui.previewCanvas.releasePointerCapture(event.pointerId);
    }
    cancelDrag();
    renderPreview();
  }

  function onPreviewPointerCancel(event) {
    if (ui.previewCanvas.hasPointerCapture(event.pointerId)) {
      ui.previewCanvas.releasePointerCapture(event.pointerId);
    }
    cancelDrag();
    renderPreview();
  }

  function onPreviewPointerLeave() {
    if (!state.dragState.active) {
      return;
    }
    state.dragState.targetSlot = null;
    renderPreview();
  }

  function cancelDrag() {
    state.dragState.active = false;
    state.dragState.sourceSlot = null;
    state.dragState.targetSlot = null;
    ui.previewCanvas.classList.remove("is-dragging");
  }

  function swapAssignments(slotA, slotB) {
    const temp = state.assignment[slotA];
    state.assignment[slotA] = state.assignment[slotB];
    state.assignment[slotB] = temp;
    renderAssignmentList();
  }

  function sanitizeMargin(value) {
    const maxMargin = Math.min(PANEL_IN.width, PANEL_IN.height) / 2 - 0.001;
    return clamp(value, 0, maxMargin);
  }

  function sanitizeInches(value) {
    return clamp(value, 0, 1);
  }

  function syncGutterControlsEnabled() {
    ui.useGutterLayout.checked = state.useGutterLayout;
    ui.printerMarginIn.disabled = !state.useGutterLayout;
    ui.innerGutterIn.disabled = !state.useGutterLayout;
    ui.printerMarginIn.value = formatNumber(state.printerMarginIn, 3);
    ui.innerGutterIn.value = formatNumber(state.innerGutterIn, 3);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function syncMarginPreset() {
    const matched = PRESET_MARGINS.find((preset) => Math.abs(preset - state.marginIn) < 0.000001);
    ui.marginPreset.value = matched != null ? String(matched) : "custom";
  }

  function getExportDpi() {
    const raw = Number.parseInt(ui.exportDpi.value, 10);
    return clamp(Number.isFinite(raw) ? raw : 300, 72, 1200);
  }

  function exportPng() {
    const dpi = getExportDpi();
    state.exportDpi = dpi;
    ui.exportDpi.value = String(dpi);

    const canvas = document.createElement("canvas");
    renderSheet(canvas, {
      ppi: dpi,
      marginIn: state.marginIn,
      useGutterLayout: state.useGutterLayout,
      printerMarginIn: state.printerMarginIn,
      innerGutterIn: state.innerGutterIn,
      scaleMode: state.scaleMode,
      showFoldGuides: state.showFoldGuides,
      showCutGuide: state.showCutGuide,
      showLabels: state.showLabels,
      showPageNumbers: state.showPageNumbers,
      pageNumberStyle: state.pageNumberStyle
    });

    canvas.toBlob((blob) => {
      if (!blob) {
        setExportStatus("Failed to create PNG.");
        return;
      }

      const fileName = `mini-zine-imposition-${dpi}dpi.png`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1200);

      setExportStatus(
        `Exported ${fileName} (${Math.round(SHEET_IN.width * dpi)} x ${Math.round(SHEET_IN.height * dpi)} px).`
      );
    }, "image/png");
  }

  function openPrintView() {
    const dpi = getExportDpi();
    const canvas = document.createElement("canvas");
    renderSheet(canvas, {
      ppi: dpi,
      marginIn: state.marginIn,
      useGutterLayout: state.useGutterLayout,
      printerMarginIn: state.printerMarginIn,
      innerGutterIn: state.innerGutterIn,
      scaleMode: state.scaleMode,
      showFoldGuides: state.showFoldGuides,
      showCutGuide: state.showCutGuide,
      showLabels: state.showLabels,
      showPageNumbers: state.showPageNumbers,
      pageNumberStyle: state.pageNumberStyle
    });

    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      setExportStatus("Popup blocked. Allow popups to open print view.");
      return;
    }

    win.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Print Mini-Zine Sheet</title>
  <style>
    @page { size: 11in 8.5in; margin: 0; }
    html, body { margin: 0; padding: 0; background: #f3f5f8; font-family: sans-serif; }
    .wrap { min-height: 100vh; display: grid; place-items: center; }
    img { width: 11in; height: 8.5in; display: block; box-shadow: 0 6px 24px rgba(0,0,0,0.16); background: #fff; }
    .help { margin: 1rem 0; color: #334155; font-size: 14px; text-align: center; }
    @media print {
      body { background: #fff; }
      .help { display: none; }
      .wrap { display: block; min-height: auto; }
      img { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <img alt="Mini-zine imposed sheet" src="${dataUrl}" />
    <p class="help">Print landscape at 100% / Actual Size. Use browser print (Ctrl/Cmd+P).</p>
  </div>
</body>
</html>`);
    win.document.close();
    setExportStatus("Opened print view in a new tab/window.");
  }

  function setLoadStatus(message) {
    ui.loadStatus.textContent = message;
  }

  function setExportStatus(message) {
    ui.exportStatus.textContent = message;
  }

  function formatNumber(value, digits) {
    return Number(value).toFixed(digits).replace(/\.?0+$/, "");
  }
})();
