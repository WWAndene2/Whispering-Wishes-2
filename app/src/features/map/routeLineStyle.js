// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/routeLineStyle.js
// Line styles of search routes, shared by the live map overlay and the route
// image: the canvas dash pattern of each style, and the arrowheads the
// "arrow" style draws along each leg to show the direction of travel.
// ═══════════════════════════════════════════════════════════════════════════════

export const ROUTE_LINE_DASH = { solid: [], dashed: [12, 8], dotted: [2, 6], dashdot: [12, 6, 2, 6], arrow: [] };

const ARROW_SPACING = 96; // px between arrowheads on a long leg
const ARROW_LEN = 12;

/** Filled triangles along a→b pointing toward b: one per ARROW_SPACING, at least one mid-leg. */
export function drawArrowheads(ctx, a, b, color) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < ARROW_LEN * 2) return;
  const ux = dx / len;
  const uy = dy / len;
  const count = Math.max(1, Math.floor(len / ARROW_SPACING));
  ctx.save();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  for (let i = 1; i <= count; i++) {
    const t = (i / (count + 1)) * len;
    const tipX = a.x + ux * (t + ARROW_LEN / 2);
    const tipY = a.y + uy * (t + ARROW_LEN / 2);
    const baseX = tipX - ux * ARROW_LEN;
    const baseY = tipY - uy * ARROW_LEN;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseX - uy * (ARROW_LEN / 2), baseY + ux * (ARROW_LEN / 2));
    ctx.lineTo(baseX + uy * (ARROW_LEN / 2), baseY - ux * (ARROW_LEN / 2));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
