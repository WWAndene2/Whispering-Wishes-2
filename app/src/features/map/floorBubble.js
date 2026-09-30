// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/floorBubble.js
// The bubble a route draws where it leaves the floor in view: a short dashed
// stub from the last stop on this floor, then a pill with an arrow and the name
// of the map the next stop is on. Tapping it (MapTab) goes to that stop.
// ═══════════════════════════════════════════════════════════════════════════════

const OFFSET = 32;  // px from the stop to the bubble's near edge
const HEIGHT = 24;
const PAD = 8;
const ARROW = 12;
const RADIUS = 6;   // 0.24 × height

/**
 * Draws a bubble for { at, toward, color, label, target } (container px) and returns its box
 * { x, y, w, h, target } for hit-testing.
 */
export function drawFloorBubble(ctx, { at, toward, color, label, target }) {
  const dx = toward.x - at.x;
  const dy = toward.y - at.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  ctx.save();
  ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
  const w = PAD + ARROW + PAD / 2 + Math.ceil(ctx.measureText(label).width) + PAD;
  // Centre the pill OFFSET px beyond the stop, toward where the route goes next.
  const cx = at.x + ux * (OFFSET + w / 2 * Math.abs(ux) + HEIGHT / 2 * Math.abs(uy));
  const cy = at.y + uy * (OFFSET + w / 2 * Math.abs(ux) + HEIGHT / 2 * Math.abs(uy));
  const x = cx - w / 2;
  const y = cy - HEIGHT / 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(at.x, at.y);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, HEIGHT, RADIUS);
  ctx.fillStyle = 'rgba(11, 18, 32, 0.92)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  // Arrow: a triangle pointing the way the route continues.
  const ax = x + PAD + ARROW / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ax + ARROW / 2, cy);
  ctx.lineTo(ax - ARROW / 2, cy - ARROW / 2);
  ctx.lineTo(ax - ARROW / 2, cy + ARROW / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + PAD + ARROW + PAD / 2, cy + 1);
  ctx.restore();
  return { x, y, w, h: HEIGHT, target };
}
