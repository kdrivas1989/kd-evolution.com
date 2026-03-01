/**
 * Formation — renders a skydiving formation diagram as a downloadable PNG.
 */

/**
 * Draw a single parachute+person icon centered at (cx, cy).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx  center x
 * @param {number} cy  center y
 * @param {number} size total icon height (~70)
 */
export function drawParachutePerson(ctx, cx, cy, size) {
  const canopyH = size * 0.32;
  const canopyW = size * 0.5;
  const canopyTop = cy - size / 2;
  const canopyMid = canopyTop + canopyH;

  // — Parachute canopy (half-ellipse) —
  ctx.beginPath();
  ctx.ellipse(cx, canopyMid, canopyW, canopyH, 0, Math.PI, 0);
  ctx.fillStyle = '#3b82f6';
  ctx.fill();
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // — Suspension lines —
  const personTop = canopyMid + size * 0.18;
  const lineOffsets = [-canopyW * 0.85, -canopyW * 0.3, canopyW * 0.3, canopyW * 0.85];
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  for (const dx of lineOffsets) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, canopyMid);
    ctx.lineTo(cx, personTop);
    ctx.stroke();
  }

  // — Person (stick figure) —
  const headR = size * 0.06;
  const headCy = personTop + headR;
  const bodyTop = headCy + headR;
  const bodyLen = size * 0.2;
  const bodyBottom = bodyTop + bodyLen;
  const legLen = size * 0.16;
  const armLen = size * 0.14;
  const armY = bodyTop + bodyLen * 0.3;

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#333';

  // Head
  ctx.beginPath();
  ctx.arc(cx, headCy, headR, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop);
  ctx.lineTo(cx, bodyBottom);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(cx - armLen, armY - armLen * 0.3);
  ctx.lineTo(cx, armY);
  ctx.lineTo(cx + armLen, armY - armLen * 0.3);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(cx - legLen * 0.7, bodyBottom + legLen);
  ctx.lineTo(cx, bodyBottom);
  ctx.lineTo(cx + legLen * 0.7, bodyBottom + legLen);
  ctx.stroke();
}

/**
 * Render a formation diagram and trigger a PNG download.
 * @param {number[]} rows  e.g. [1, 2, 3, 2, 1]
 */
export function renderFormation(rows) {
  if (!rows || rows.length === 0) return;

  const iconSize = 70;
  const hSpacing = 80;
  const vSpacing = 100;
  const padding = 40;
  const titleH = 40;

  const maxInRow = Math.max(...rows);
  const spacing = 100;
  const personSize = 55;
  const boxSize = 88; // square around each person — bigger than icon, no touching

  // Layout people in straight rows, centered horizontally
  const formationW = maxInRow * spacing;
  const formationH = rows.length * spacing;
  const canvasW = Math.max(formationW + padding * 2, 200);
  const canvasH = formationH + padding * 2 + titleH;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Title
  ctx.fillStyle = '#222';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Formation', canvasW / 2, padding + 20);

  // Compute person positions (straight rows, centered)
  const startY = padding + titleH + spacing / 2;
  const centerX = canvasW / 2;
  const positions = [];
  for (let r = 0; r < rows.length; r++) {
    const count = rows[r];
    const rowWidth = count * spacing;
    const startX = centerX - rowWidth / 2 + spacing / 2;
    const cy = startY + r * spacing;
    for (let c = 0; c < count; c++) {
      positions.push({ x: startX + c * spacing, y: cy });
    }
  }

  // Draw a square around each person
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.8;
  const half = boxSize / 2;
  for (const pos of positions) {
    ctx.strokeRect(pos.x - half, pos.y - half, boxSize, boxSize);
  }
  ctx.globalAlpha = 1;

  // Draw people on top
  for (const pos of positions) {
    drawParachutePerson(ctx, pos.x, pos.y, personSize);
  }

  // Export as PNG download
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formation.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
