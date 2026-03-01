/**
 * MediaLoader — file input + drag-and-drop + video/image toggling.
 * Port of media-loading portions of VideoGridViewModel.swift.
 */

const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'
]);

export class MediaLoader {
  /** @type {HTMLVideoElement} */
  #video;
  /** @type {HTMLImageElement} */
  #image;
  /** @type {HTMLInputElement} */
  #fileInput;
  /** @type {HTMLElement} */
  #dropZone;
  /** @type {HTMLElement} */
  #placeholder;
  /** @type {'none'|'video'|'image'} */
  #mediaType = 'none';
  /** @type {string|null} */
  #fileName = null;
  /** @type {boolean} */
  #isPlaying = false;
  /** @type {Set<Function>} */
  #listeners = new Set();

  /**
   * @param {{video: HTMLVideoElement, image: HTMLImageElement, fileInput: HTMLInputElement, dropZone: HTMLElement, placeholder: HTMLElement}} els
   */
  constructor(els) {
    this.#video = els.video;
    this.#image = els.image;
    this.#fileInput = els.fileInput;
    this.#dropZone = els.dropZone;
    this.#placeholder = els.placeholder;

    this.#fileInput.addEventListener('change', () => {
      const file = this.#fileInput.files[0];
      if (file) this.#loadFile(file);
      this.#fileInput.value = '';
    });

    // Drag-and-drop
    this.#dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.#dropZone.classList.add('drag-over');
    });
    this.#dropZone.addEventListener('dragleave', () => {
      this.#dropZone.classList.remove('drag-over');
    });
    this.#dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.#dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this.#loadFile(file);
    });
  }

  get mediaType() { return this.#mediaType; }
  get fileName() { return this.#fileName; }
  get isPlaying() { return this.#isPlaying; }
  get hasMedia() { return this.#mediaType !== 'none'; }
  get videoElement() { return this.#video; }
  get imageElement() { return this.#image; }

  /** Open file picker */
  openPicker() {
    this.#fileInput.click();
  }

  /** Toggle video play/pause */
  togglePlayPause() {
    if (this.#mediaType !== 'video') return;
    if (this.#isPlaying) {
      this.#video.pause();
      this.#isPlaying = false;
    } else {
      this.#video.play();
      this.#isPlaying = true;
    }
    this.#notify();
  }

  /** Register a state-change listener */
  onChange(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  /** @param {File} file */
  #loadFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const url = URL.createObjectURL(file);

    if (IMAGE_EXTENSIONS.has(ext) || file.type.startsWith('image/')) {
      this.#loadImage(url, file.name);
    } else {
      this.#loadVideo(url, file.name);
    }
  }

  /** @param {string} url @param {string} name */
  #loadImage(url, name) {
    // Clear video
    this.#video.pause();
    this.#video.removeAttribute('src');
    this.#video.classList.remove('active');

    // Show image
    this.#image.src = url;
    this.#image.classList.add('active');
    this.#placeholder.classList.add('hidden');

    this.#mediaType = 'image';
    this.#fileName = name;
    this.#isPlaying = false;
    this.#notify();
  }

  /** @param {string} url @param {string} name */
  #loadVideo(url, name) {
    // Clear image
    this.#image.removeAttribute('src');
    this.#image.classList.remove('active');

    // Show video
    this.#video.src = url;
    this.#video.classList.add('active');
    this.#placeholder.classList.add('hidden');

    this.#video.play();
    this.#mediaType = 'video';
    this.#fileName = name;
    this.#isPlaying = true;
    this.#notify();
  }

  #notify() {
    for (const fn of this.#listeners) fn(this);
  }
}
