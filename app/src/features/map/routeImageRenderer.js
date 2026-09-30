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
const HEADER = 96;
const FOOTER = 48;
const DASH = { solid: [], dashed: [12, 8], dotted: [2, 6], dashdot: [12, 6, 2, 6] };
// Same look as the tile pane on screen (MapTab's tile-pane filter).
const TILE_FILTER = 'contrast(1.06) brightness(1.04) saturate(1.05)';

const loadImage = (src) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

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
  const w = Math.round((maxX - minX) * k);
  const h = Math.round((maxY - minY) * k);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = HEADER + h + FOOTER;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ── Tiles
  const tx0 = Math.max(0, Math.floor((minX * tileScale) / TILE_SIZE));
  const ty0 = Math.max(0, Math.floor((minY * tileScale) / TILE_SIZE));
  const tx1 = Math.floor((maxX * tileScale) / TILE_SIZE);
  const ty1 = Math.floor((maxY * tileScale) / TILE_SIZE);
  const jobs = [];
  for (let x = tx0; x <= tx1; x++) {
    for (let y = ty0; y <= ty1; y++) {
      jobs.push(loadImage(`${tileBase}map-tiles/Solaris_3/${z}/${y}/${x}.webp`).then(img => ({ img, x, y })));
    }
  }
  const tiles = await Promise.all(jobs);
  const toOut = (p) => ({ x: (p.x - minX) * k, y: HEADER + (p.y - minY) * k });
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, HEADER, w, h);
  ctx.clip();
  ctx.filter = TILE_FILTER;
  const tileOut = TILE_SIZE * up;
  for (const { img, x, y } of tiles) {
    if (!img) continue;
    ctx.drawImage(img, x * tileOut - minX * k, HEADER + y * tileOut - minY * k, tileOut, tileOut);
  }
  ctx.filter = 'none';

  // ── Routes
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 4;
  const stroke = (a, b, color, line) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = line === 'dotted' ? 'round' : 'butt';
    ctx.setLineDash(DASH[line] || []);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
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
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(from.x, from.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Numbered stops; the chosen start is a white-ringed dot without a number.
    let n = 0;
    r.points.forEach((p, i) => {
      const o = pts[i];
      const color = r.legs ? r.legs[Math.max(0, i - 1)].color : r.color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(o.x, o.y, p.isStart ? 8 : 12, 0, Math.PI * 2);
      ctx.fill();
      if (p.isStart) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        return;
      }
      n++;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0b1220';
      ctx.font = `bold ${n > 99 ? 8 : 12}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(n), o.x, o.y + 1);
      ctx.shadowBlur = 4;
    });
  }
  ctx.restore();

  // ── Header: title, then one swatch + label + stop count per route
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#edaf18';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(title, 16, 32);
  ctx.font = '16px sans-serif';
  let lx = 16;
  for (const r of routes) {
    const stops = r.points.filter(p => !p.isStart).length;
    const text = `${r.label} · ${stopsLabel(stops)}`;
    const tw = ctx.measureText(text).width;
    if (lx + 32 + tw > w - 16 && lx > 16) break;
    stroke({ x: lx, y: 72 }, { x: lx + 24, y: 72 }, r.color, r.line);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText(text, lx + 32, 72);
    lx += 32 + tw + 24;
  }

  // ── Footer
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(footer, w - 16, HEADER + h + FOOTER / 2);

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
