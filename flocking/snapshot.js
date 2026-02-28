/**
 * Snapshot — composites media + grid onto offscreen canvas, triggers PNG download.
 * Port of takeSnapshot + drawGrid from VideoGridViewModel.swift.
 */

/**
 * @param {{
 *   mediaLoader: import('./media-loader.js').MediaLoader,
 *   gridRenderer: import('./grid-renderer.js').GridRenderer,
 *   mediaArea: HTMLElement
 * }} deps
 */
export function captureSnapshot({ mediaLoader, gridRenderer, mediaArea }) {
  if (!mediaLoader.hasMedia) return;

  const video = mediaLoader.videoElement;
  const image = mediaLoader.imageElement;
  const mediaType = mediaLoader.mediaType;

  // Determine source dimensions (natural media size)
  let srcW, srcH;
  if (mediaType === 'video') {
    srcW = video.videoWidth;
    srcH = video.videoHeight;
  } else {
    srcW = image.naturalWidth;
    srcH = image.naturalHeight;
  }

  if (!srcW || !srcH) return;

  // Use the container's CSS size as the composite size (matches what the user sees)
  const containerW = mediaArea.clientWidth;
  const containerH = mediaArea.clientHeight;

  // Create offscreen canvas at container size
  const offscreen = document.createElement('canvas');
  offscreen.width = containerW;
  offscreen.height = containerH;
  const ctx = offscreen.getContext('2d');

  // Draw media centered with object-fit: contain logic
  const scale = Math.min(containerW / srcW, containerH / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const drawX = (containerW - drawW) / 2;
  const drawY = (containerH - drawH) / 2;

  // Black background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, containerW, containerH);

  if (mediaType === 'video') {
    ctx.drawImage(video, drawX, drawY, drawW, drawH);
  } else {
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
  }

  // Draw grid overlay
  gridRenderer.drawTo(ctx, containerW, containerH);

  // Trigger download
  offscreen.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = (mediaLoader.fileName || 'snapshot').replace(/\.[^.]+$/, '');
    a.download = `${baseName}_grid.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
