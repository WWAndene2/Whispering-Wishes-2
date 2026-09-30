// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/routeImageRenderer.js
// Saves the map's search routes as a PNG: the map tiles under the routes'
// bounding box, each route in its colour and line style, numbered stops, the
// warp rings of teleporter-aware legs, and a legend. Rendered from the tile
// pyramid directly rather than from the on-screen map, so the image is north-up
// and framed on the routes whatever the view's zoom or rotation.
// ═══════════════════════════════════════════════════════════════════════════════

import { TILE_SIZE, NATIVE_ZOOM } from './tileMath.js';

const MAX_SIDE = 1536;      // longest side of the map area, in output px
const MIN_SIDE = 768;       // small routes are drawn larger, up to 2× the tile scale
const PAD = 64;             // map px kept around the routes
const MARGIN = 32;          // canvas edge to panels
const GAP = 16;             // between panels
const HEADER = 96;
const CHIP = 48;            // legend chip height
const FOOTER = 48;
const RADIUS = 16;
const DASH = { solid: [], dashed: [12, 8], dotted: [2, 6], dashdot: [12, 6, 2, 6] };
// Same look as the tile pane on screen (MapTab's tile-pane filter).
const TILE_FILTER = 'contrast(1.06) brightness(1.04) saturate(1.05)';
const APP_ICON = './app-title-icon/Abby_app_home_icon.png';
// The app's palette and type (styles/kuro.css).
const GOLD = '#edaf18';
const BG = '#080810';
const PANEL = 'rgba(15, 23, 42, 0.92)';
const TEXT = '#f1f5f9';
const MUTED = '#9ca3af';
const DISPLAY = "'Rajdhani', ui-sans-serif, system-ui, sans-serif";
const ACCENT = "'Cinzel', 'Rajdhani', ui-serif, Georgia, serif";
const DATA = "'JetBrains Mono', ui-monospace, monospace";

const loadImage = (src) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

// A panel in the app's card style: dark fill, faint top sheen, thin gold edge.
const panel = (ctx, x, y, w, h, r = RADIUS) => {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = PANEL;
  ctx.fill();
  const sheen = ctx.createLinearGradient(0, y, 0, y + 24);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fill();
  ctx.strokeStyle = 'rgba(237, 175, 24, 0.32)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
};

/**
 * routes: [{ label, points: [{x, y, isStart?}], color, line, legs?, warps? }] in native map px.
 * Returns a PNG Blob, or null when there is nothing to draw.
 */
export async function renderRouteImage({ routes, tileBase, title, stopsLabel, footer }) {
  const all = routes.flatMap(r => [...r.points, ...(r.warps || []).filter(Boolean)]);
  if (!all.length) return null;
  const minX = Math.min(...all.map(p => p.x)) - PAD;
  const minY = Math.min(...all.map(p => p.y)) - PAD;
  const maxX = Math.max(...all.map(p => p.x)) + PAD;
  const maxY = Math.max(...all.map(p => p.y)) + PAD;
  const side = Math.max(maxX - minX, maxY - minY);
  // Deepest tile level whose scale keeps the longest side within MAX_SIDE.
  let z = NATIVE_ZOOM;
  while (z > 0 && side * 2 ** (z - NATIVE_ZOOM) > MAX_SIDE) z--;
  const tileScale = 2 ** (z - NATIVE_ZOOM);
  const up = Math.min(2, Math.max(1, MIN_SIDE / (side * tileScale)));
  const k = tileScale * up; // output px per native map px
  const w = Math.max(MIN_SIDE, Math.round((maxX - minX) * k));
  const h = Math.round((maxY - minY) * k);
  // Map area centred in its panel when the route is narrower than MIN_SIDE.
  const offX = (w - (maxX - minX) * k) / 2;

  await Promise.all(['700 32px Rajdhani', '600 16px Rajdhani', '700 24px Cinzel', '700 12px "JetBrains Mono"']
    .map(f => document.fonts?.load(f).catch(() => null)));
  const [appIco, ...tileImgs] = await (async () => {
    const tx0 = Math.max(0, Math.floor((minX * tileScale) / TILE_SIZE));
    const ty0 = Math.max(0, Math.floor((minY * tileScale) / TILE_SIZE));
    const tx1 = Math.floor((maxX * tileScale) / TILE_SIZE);
    const ty1 = Math.floor((maxY * tileScale) / TILE_SIZE);
    const jobs = [loadImage(APP_ICON)];
    for (let x = tx0; x <= tx1; x++) {
      for (let y = ty0; y <= ty1; y++) {
        jobs.push(loadImage(`${tileBase}map-tiles/Solaris_3/${z}/${y}/${x}.webp`).then(img => ({ img, x, y })));
      }
    }
    return Promise.all(jobs);
  })();

  // Legend chips, laid out in rows before the canvas height is known.
  const measure = document.createElement('canvas').getContext('2d');
  const chips = [];
  let cx = 0;
  let rows = 1;
  for (const r of routes) {
    const stops = stopsLabel(r.points.filter(p => !p.isStart).length);
    measure.font = `600 16px ${DISPLAY}`;
    const lw = measure.measureText(r.label).width;
    measure.font = `12px ${DATA}`;
    const sw = measure.measureText(stops).width;
    const cw = Math.min(w, 16 + 32 + 12 + lw + 12 + sw + 16);
    if (cx > 0 && cx + cw > w) { cx = 0; rows++; }
    chips.push({ r, stops, x: cx, row: rows - 1, w: cw });
    cx += cw + 12;
  }

  const W = w + MARGIN * 2;
  const mapY = MARGIN + HEADER + GAP;
  const legendY = mapY + h + GAP;
  const footY = legendY + rows * CHIP + (rows - 1) * 12 + GAP;
  const H = footY + FOOTER + MARGIN - GAP;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Backdrop: the app's near-black with a soft gold glow up top
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.8);
  glow.addColorStop(0, 'rgba(237, 175, 24, 0.10)');
  glow.addColorStop(1, 'rgba(237, 175, 24, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Header: brand on the left (as in the app bar), title on the right
  panel(ctx, MARGIN, MARGIN, w, HEADER);
  const hy = MARGIN + HEADER / 2;
  let bx = MARGIN + 24;
  if (appIco) { ctx.drawImage(appIco, bx, hy - 24, 48, 48); bx += 48 + 16; }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = TEXT;
  ctx.font = `700 32px ${DISPLAY}`;
  ctx.fillText('Whispering Wishes', bx, hy + 2);
  ctx.fillStyle = GOLD;
  ctx.font = `700 12px ${DISPLAY}`;
  ctx.letterSpacing = '3px';
  ctx.fillText('WUTHERING WAVES · COMPANION', bx, hy + 24);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.font = `700 24px ${ACCENT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(title, MARGIN + w - 24, hy);

  // ── Map panel
  const mx = MARGIN;
  ctx.save();
  roundRect(ctx, mx, mapY, w, h, RADIUS);
  ctx.fillStyle = '#0b1220';
  ctx.fill();
  ctx.clip();
  const toOut = (p) => ({ x: mx + offX + (p.x - minX) * k, y: mapY + (p.y - minY) * k });
  ctx.filter = TILE_FILTER;
  const tileOut = TILE_SIZE * up;
  for (const t of tileImgs) {
    if (!t.img) continue;
    ctx.drawImage(t.img, mx + offX + t.x * tileOut - minX * k, mapY + t.y * tileOut - minY * k, tileOut, tileOut);
  }
  ctx.filter = 'none';
  // Edge vignette so the tiles sink into the frame.
  const vig = ctx.createRadialGradient(mx + w / 2, mapY + h / 2, Math.min(w, h) * 0.4, mx + w / 2, mapY + h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(8, 8, 16, 0)');
  vig.addColorStop(1, 'rgba(8, 8, 16, 0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(mx, mapY, w, h);

  // Routes: a dark casing under each coloured line keeps it readable on any tile.
  ctx.lineJoin = 'round';
  const stroke = (a, b, color, line) => {
    ctx.setLineDash(DASH[line] || []);
    ctx.lineCap = line === 'dotted' ? 'round' : 'butt';
    ctx.strokeStyle = 'rgba(8, 8, 16, 0.7)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
  };
  for (const r of routes) {
    const pts = r.points.map(toOut);
    for (let i = 1; i < pts.length; i++) {
      const style = r.legs ? r.legs[i - 1] : r;
      const via = r.warps && r.warps[i - 1];
      const from = via ? toOut(via) : pts[i - 1];
      stroke(from, pts[i], style.color, style.line);
      if (via) {
        ctx.fillStyle = 'rgba(8, 8, 16, 0.6)';
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(from.x, from.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(from.x, from.y, 4, 0, Math.PI * 2); ctx.fillStyle = style.color; ctx.fill();
      }
    }
    // Stops: dark discs ringed in the route colour, numbered in the app's data font.
    let n = 0;
    r.points.forEach((p, i) => {
      const o = pts[i];
      const color = r.legs ? r.legs[Math.max(0, i - 1)].color : r.color;
      if (p.isStart) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(o.x, o.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
        return;
      }
      n++;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = 'rgba(11, 18, 32, 0.92)';
      ctx.beginPath(); ctx.arc(o.x, o.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = TEXT;
      ctx.font = `700 ${n > 99 ? 8 : 12}px ${DATA}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(n), o.x, o.y + 1);
    });
  }
  ctx.restore();
  roundRect(ctx, mx, mapY, w, h, RADIUS);
  ctx.strokeStyle = 'rgba(237, 175, 24, 0.32)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Legend chips
  for (const c of chips) {
    const x = MARGIN + c.x;
    const y = legendY + c.row * (CHIP + 12);
    panel(ctx, x, y, c.w, CHIP, 12);
    const my = y + CHIP / 2;
    ctx.save();
    roundRect(ctx, x, y, c.w, CHIP, 12);
    ctx.clip();
    stroke({ x: x + 16, y: my }, { x: x + 48, y: my }, c.r.color, c.r.line);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = TEXT;
    ctx.font = `600 16px ${DISPLAY}`;
    ctx.fillText(c.r.label, x + 60, my + 1);
    ctx.textAlign = 'right';
    ctx.fillStyle = MUTED;
    ctx.font = `12px ${DATA}`;
    ctx.fillText(c.stops, x + c.w - 16, my + 1);
    ctx.restore();
  }

  // ── Footer: gold hairline, date, site
  const fy = footY + 16;
  const line = ctx.createLinearGradient(MARGIN, 0, MARGIN + w, 0);
  line.addColorStop(0, 'rgba(237, 175, 24, 0)');
  line.addColorStop(0.5, 'rgba(237, 175, 24, 0.5)');
  line.addColorStop(1, 'rgba(237, 175, 24, 0)');
  ctx.fillStyle = line;
  ctx.fillRect(MARGIN, footY, w, 1);
  ctx.textBaseline = 'middle';
  ctx.font = `12px ${DATA}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'left';
  ctx.fillText(new Date().toLocaleDateString(), MARGIN, fy);
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.fillText(footer, MARGIN + w, fy);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/**
 * Saves `blob` as `filename`: into Documents on native builds, as a download on the web.
 */
export async function saveRouteImage(blob, filename) {
  if (window.Capacitor?.isNativePlatform?.()) {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Documents });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
