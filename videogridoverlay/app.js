/**
 * App — entry point. Wires DOM elements to modules, binds sidebar controls.
 * Port of ContentView.swift + ControlPanelView.swift wiring.
 */

import { GridConfiguration } from './grid-config.js';
import { GridRenderer } from './grid-renderer.js';
import { MediaLoader } from './media-loader.js';
import { Gestures } from './gestures.js';
import { captureSnapshot } from './snapshot.js';
import { renderFormation } from './formation.js';

/* ── DOM refs ── */
const $ = (sel) => document.querySelector(sel);

const mediaArea   = $('#mediaArea');
const gridCanvas  = $('#gridCanvas');
const videoEl     = $('#videoEl');
const imageEl     = $('#imageEl');
const fileInput   = $('#fileInput');
const placeholder = $('#placeholder');

// Sidebar controls
const btnOpen       = $('#btnOpen');
const btnPlayPause  = $('#btnPlayPause');
const fileName      = $('#fileName');
const gridNInput    = $('#gridN');
const gridNHint     = $('#gridNHint');
const cellSizeInput = $('#cellSize');
const cellSizeValue = $('#cellSizeValue');
const rotationInput = $('#rotation');
const rotationValue = $('#rotationValue');
const lineColorInput  = $('#lineColor');
const lineWidthInput  = $('#lineWidth');
const lineWidthValue  = $('#lineWidthValue');
const lineOpacityInput = $('#lineOpacity');
const lineOpacityValue = $('#lineOpacityValue');
const btnCenter     = $('#btnCenter');
const positionHint  = $('#positionHint');
const btnSnapshot   = $('#btnSnapshot');

/* ── Core modules ── */
const config = new GridConfiguration();
const renderer = new GridRenderer(gridCanvas, config);
const mediaLoader = new MediaLoader({
  video: videoEl,
  image: imageEl,
  fileInput,
  dropZone: mediaArea,
  placeholder,
});
const gestures = new Gestures(gridCanvas, config);

/* ── Sidebar → Config (input events) ── */

btnOpen.addEventListener('click', () => mediaLoader.openPicker());

btnPlayPause.addEventListener('click', () => mediaLoader.togglePlayPause());

gridNInput.addEventListener('input', () => {
  config.gridN = parseInt(gridNInput.value, 10) || 1;
});

cellSizeInput.addEventListener('input', () => {
  config.cellSize = parseFloat(cellSizeInput.value);
});

rotationInput.addEventListener('input', () => {
  config.rotation = parseFloat(rotationInput.value);
});

// Rotation preset buttons
document.querySelectorAll('[data-rotation]').forEach((btn) => {
  btn.addEventListener('click', () => {
    config.rotation = parseFloat(btn.dataset.rotation);
  });
});

lineColorInput.addEventListener('input', () => {
  config.lineColor = lineColorInput.value;
});

lineWidthInput.addEventListener('input', () => {
  config.lineWidth = parseFloat(lineWidthInput.value);
});

lineOpacityInput.addEventListener('input', () => {
  config.lineOpacity = parseFloat(lineOpacityInput.value);
});

btnCenter.addEventListener('click', () => {
  config.centerGrid();
});

btnSnapshot.addEventListener('click', () => {
  captureSnapshot({ mediaLoader, gridRenderer: renderer, mediaArea });
});

/* ── Config → Sidebar (sync display values) ── */

function syncUI() {
  gridNInput.value = config.gridN;
  gridNHint.textContent = `Effective: ${config.effectiveN}\u00d7${config.effectiveN}`;

  cellSizeInput.value = config.cellSize;
  cellSizeValue.textContent = `${Math.round(config.cellSize)} px`;

  rotationInput.value = config.rotation;
  rotationValue.textContent = `${Math.round(config.rotation)}\u00b0`;

  lineColorInput.value = config.lineColor;

  lineWidthInput.value = config.lineWidth;
  lineWidthValue.textContent = config.lineWidth.toFixed(1);

  lineOpacityInput.value = config.lineOpacity;
  lineOpacityValue.textContent = `${Math.round(config.lineOpacity * 100)}%`;

  positionHint.textContent = `x: ${Math.round(config.positionX)}, y: ${Math.round(config.positionY)}`;
}

config.onChange(syncUI);
syncUI();

/* ── MediaLoader state → sidebar buttons ── */

mediaLoader.onChange((ml) => {
  fileName.textContent = ml.fileName || '';
  btnPlayPause.disabled = ml.mediaType !== 'video';
  btnPlayPause.textContent = ml.isPlaying ? 'Pause' : 'Play';
  btnSnapshot.disabled = !ml.hasMedia;
});

/* ── Keyboard shortcuts ── */

document.addEventListener('keydown', (e) => {
  // Guard: don't fire when typing in inputs
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  if (e.code === 'Space') {
    e.preventDefault();
    mediaLoader.togglePlayPause();
  }
});

/* ── Flocking ── */

const formationRowsEl = $('#formationRows');
const btnAddRow = $('#btnAddRow');
const btnDownloadFormation = $('#btnDownloadFormation');

let formationRows = [1];

function buildFormationUI() {
  formationRowsEl.innerHTML = '';
  formationRows.forEach((count, i) => {
    const row = document.createElement('div');
    row.className = 'formation-row';

    const label = document.createElement('span');
    label.textContent = `Row ${i + 1}:`;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = 1;
    input.max = 20;
    input.value = count;
    input.addEventListener('input', () => {
      formationRows[i] = Math.max(1, Math.min(20, parseInt(input.value, 10) || 1));
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = '\u00d7';
    removeBtn.addEventListener('click', () => {
      formationRows.splice(i, 1);
      if (formationRows.length === 0) formationRows.push(1);
      buildFormationUI();
    });

    row.append(label, input, removeBtn);
    formationRowsEl.appendChild(row);
  });
}

btnAddRow.addEventListener('click', () => {
  formationRows.push(1);
  buildFormationUI();
});

btnDownloadFormation.addEventListener('click', () => {
  renderFormation(formationRows);
});

buildFormationUI();
