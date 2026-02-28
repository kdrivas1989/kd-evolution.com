/**
 * GridRenderer — draws the N×N grid on a <canvas>.
 * Port of the Canvas drawing in GridOverlayView.swift.
 */
export class GridRenderer {
  /** @type {HTMLCanvasElement} */
  #canvas;
  /** @type {CanvasRenderingContext2D} */
  #ctx;
  /** @type {import('./grid-config.js').GridConfiguration} */
  #config;
  /** @type {number} */
  #rafId = 0;
  /** @type {ResizeObserver} */
  #resizeObserver;
  #needsDraw = true;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('./grid-config.js').GridConfiguration} config
   */
  constructor(canvas, config) {
    this.#canvas = canvas;
    this.#ctx = canvas.getContext('2d');
    this.#config = config;

    // Redraw on config change
    config.onChange(() => { this.#needsDraw = true; });

    // Handle resize
    this.#resizeObserver = new ResizeObserver(() => {
      this.#syncSize();
      this.#needsDraw = true;
    });
    this.#resizeObserver.observe(canvas);

    this.#syncSize();
    this.#loop();
  }

  /** Sync canvas backing size to CSS size × devicePixelRatio. */
  #syncSize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.#canvas.clientWidth;
    const h = this.#canvas.clientHeight;
    this.#canvas.width = w * dpr;
    this.#canvas.height = h * dpr;
    this.#ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** requestAnimationFrame loop — only redraws when needed. */
  #loop() {
    this.#rafId = requestAnimationFrame(() => this.#loop());
    if (!this.#needsDraw) return;
    this.#needsDraw = false;
    this.#draw();
  }

  #draw() {
    const ctx = this.#ctx;
    const w = this.#canvas.clientWidth;
    const h = this.#canvas.clientHeight;
    const cfg = this.#config;

    ctx.clearRect(0, 0, w, h);

    const n = cfg.effectiveN;
    const cell = cfg.cellSize;
    const total = n * cell;
    const rot = cfg.rotation * Math.PI / 180;

    ctx.save();

    // Translate to center + user offset
    ctx.translate(w / 2 + cfg.positionX, h / 2 + cfg.positionY);
    // Rotate
    ctx.rotate(rot);
    // Translate so grid is centered
    ctx.translate(-total / 2, -total / 2);

    // Parse color
    ctx.strokeStyle = cfg.lineColor;
    ctx.lineWidth = cfg.lineWidth;
    ctx.globalAlpha = cfg.lineOpacity;

    ctx.beginPath();

    // Vertical lines (N+1)
    for (let i = 0; i <= n; i++) {
      const x = i * cell;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, total);
    }

    // Horizontal lines (N+1)
    for (let i = 0; i <= n; i++) {
      const y = i * cell;
      ctx.moveTo(0, y);
      ctx.lineTo(total, y);
    }

    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw the grid onto an arbitrary canvas context at given dimensions.
   * Used by snapshot compositing.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   */
  drawTo(ctx, width, height) {
    const cfg = this.#config;
    const n = cfg.effectiveN;
    const cell = cfg.cellSize;
    const total = n * cell;
    const rot = cfg.rotation * Math.PI / 180;

    ctx.save();
    ctx.translate(width / 2 + cfg.positionX, height / 2 + cfg.positionY);
    ctx.rotate(rot);
    ctx.translate(-total / 2, -total / 2);

    ctx.strokeStyle = cfg.lineColor;
    ctx.lineWidth = cfg.lineWidth;
    ctx.globalAlpha = cfg.lineOpacity;

    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const x = i * cell;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, total);
    }
    for (let i = 0; i <= n; i++) {
      const y = i * cell;
      ctx.moveTo(0, y);
      ctx.lineTo(total, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Force a redraw on next frame. */
  invalidate() {
    this.#needsDraw = true;
  }

  destroy() {
    cancelAnimationFrame(this.#rafId);
    this.#resizeObserver.disconnect();
  }
}
