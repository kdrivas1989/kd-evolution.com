/**
 * Gestures — pointer drag, touch pinch-to-zoom, touch rotation on canvas.
 * Port of gesture handling in GridOverlayView.swift.
 */
export class Gestures {
  /** @type {HTMLCanvasElement} */
  #canvas;
  /** @type {import('./grid-config.js').GridConfiguration} */
  #config;

  // Drag state
  #dragging = false;
  #dragStartX = 0;
  #dragStartY = 0;
  #configStartX = 0;
  #configStartY = 0;

  // Touch pinch/rotate state
  #touchIds = [];
  #initialPinchDist = 0;
  #initialCellSize = 0;
  #initialAngle = 0;
  #initialRotation = 0;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('./grid-config.js').GridConfiguration} config
   */
  constructor(canvas, config) {
    this.#canvas = canvas;
    this.#config = config;

    // Pointer (mouse) drag
    canvas.addEventListener('pointerdown', this.#onPointerDown);
    window.addEventListener('pointermove', this.#onPointerMove);
    window.addEventListener('pointerup', this.#onPointerUp);

    // Touch pinch & rotate
    canvas.addEventListener('touchstart', this.#onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.#onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.#onTouchEnd);

    // Trackpad pinch (ctrl+wheel) and scroll-wheel scale
    canvas.addEventListener('wheel', this.#onWheel, { passive: false });
  }

  /* ── Pointer Drag ── */

  #onPointerDown = (e) => {
    if (e.pointerType === 'touch') return; // handled by touch events
    this.#dragging = true;
    this.#dragStartX = e.clientX;
    this.#dragStartY = e.clientY;
    this.#configStartX = this.#config.positionX;
    this.#configStartY = this.#config.positionY;
    this.#canvas.setPointerCapture(e.pointerId);
  };

  #onPointerMove = (e) => {
    if (!this.#dragging) return;
    const dx = e.clientX - this.#dragStartX;
    const dy = e.clientY - this.#dragStartY;
    this.#config.positionX = this.#configStartX + dx;
    this.#config.positionY = this.#configStartY + dy;
  };

  #onPointerUp = (e) => {
    if (!this.#dragging) return;
    this.#dragging = false;
  };

  /* ── Touch Pinch & Rotate ── */

  #onTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      this.#touchIds = [e.touches[0].identifier, e.touches[1].identifier];
      const [t0, t1] = [e.touches[0], e.touches[1]];
      this.#initialPinchDist = this.#dist(t0, t1);
      this.#initialCellSize = this.#config.cellSize;
      this.#initialAngle = this.#angle(t0, t1);
      this.#initialRotation = this.#config.rotation;
    }
  };

  #onTouchMove = (e) => {
    if (e.touches.length !== 2) return;
    const t0 = this.#findTouch(e.touches, this.#touchIds[0]);
    const t1 = this.#findTouch(e.touches, this.#touchIds[1]);
    if (!t0 || !t1) return;
    e.preventDefault();

    // Pinch → cell size
    const dist = this.#dist(t0, t1);
    if (this.#initialPinchDist > 0) {
      const scale = dist / this.#initialPinchDist;
      this.#config.cellSize = this.#initialCellSize * scale; // setter clamps
    }

    // Rotation
    const angle = this.#angle(t0, t1);
    const deltaDeg = (angle - this.#initialAngle) * (180 / Math.PI);
    this.#config.rotation = this.#initialRotation + deltaDeg; // setter clamps
  };

  #onTouchEnd = () => {
    this.#touchIds = [];
  };

  /* ── Trackpad / Wheel ── */

  #onWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey) {
      // Trackpad pinch gesture: adjust cell size
      const delta = -e.deltaY * 0.5;
      this.#config.cellSize = this.#config.cellSize + delta;
    }
  };

  /* ── Helpers ── */

  /** @param {Touch} a @param {Touch} b */
  #dist(a, b) {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** @param {Touch} a @param {Touch} b */
  #angle(a, b) {
    return Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX);
  }

  /** @param {TouchList} list @param {number} id */
  #findTouch(list, id) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].identifier === id) return list[i];
    }
    return null;
  }

  destroy() {
    this.#canvas.removeEventListener('pointerdown', this.#onPointerDown);
    window.removeEventListener('pointermove', this.#onPointerMove);
    window.removeEventListener('pointerup', this.#onPointerUp);
    this.#canvas.removeEventListener('touchstart', this.#onTouchStart);
    this.#canvas.removeEventListener('touchmove', this.#onTouchMove);
    this.#canvas.removeEventListener('touchend', this.#onTouchEnd);
    this.#canvas.removeEventListener('wheel', this.#onWheel);
  }
}
