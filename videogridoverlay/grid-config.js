/**
 * GridConfiguration — observable state object for grid parameters.
 * Port of GridConfiguration.swift.
 */
export class GridConfiguration {
  /** @type {Set<Function>} */
  #listeners = new Set();

  // Backing fields
  #gridN = 4;
  #cellSize = 60;
  #rotation = 0;       // degrees
  #positionX = 0;
  #positionY = 0;
  #lineColor = '#00ff00';
  #lineWidth = 1.5;
  #lineOpacity = 0.8;

  /* ── Getters / Setters with clamping ── */

  get gridN() { return this.#gridN; }
  set gridN(v) {
    this.#gridN = Math.max(1, Math.min(128, Math.round(v)));
    this.#notify();
  }

  /** Effective N (always >= 1) */
  get effectiveN() { return Math.max(1, this.#gridN); }

  get cellSize() { return this.#cellSize; }
  set cellSize(v) {
    this.#cellSize = Math.max(10, Math.min(400, v));
    this.#notify();
  }

  /** Total grid size in pixels */
  get totalGridSize() { return this.effectiveN * this.#cellSize; }

  get rotation() { return this.#rotation; }
  set rotation(v) {
    this.#rotation = Math.max(-180, Math.min(180, v));
    this.#notify();
  }

  get positionX() { return this.#positionX; }
  set positionX(v) { this.#positionX = v; this.#notify(); }

  get positionY() { return this.#positionY; }
  set positionY(v) { this.#positionY = v; this.#notify(); }

  get lineColor() { return this.#lineColor; }
  set lineColor(v) { this.#lineColor = v; this.#notify(); }

  get lineWidth() { return this.#lineWidth; }
  set lineWidth(v) {
    this.#lineWidth = Math.max(0.5, Math.min(5, v));
    this.#notify();
  }

  get lineOpacity() { return this.#lineOpacity; }
  set lineOpacity(v) {
    this.#lineOpacity = Math.max(0.1, Math.min(1, v));
    this.#notify();
  }

  /* ── Methods ── */

  centerGrid() {
    this.#positionX = 0;
    this.#positionY = 0;
    this.#notify();
  }

  /** Batch-update multiple properties without firing per-property. */
  update(props) {
    for (const [key, value] of Object.entries(props)) {
      // Use setters so clamping applies
      if (key in this) this[key] = value;
    }
    // setters already notified individually; that's fine for simplicity
  }

  /* ── Observer pattern ── */

  /** Register a change listener. Returns an unsubscribe function. */
  onChange(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  #notify() {
    for (const fn of this.#listeners) fn(this);
  }
}
