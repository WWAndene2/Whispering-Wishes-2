// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/routeImageRenderer.js
// Saves the map's search routes as a PNG over the player's app background: the
// ground-floor map under the routes' bounding box, each sub-map with stops in its
// own card beside it, each route in its colour and line
// style, every stop as its map icon with its order badge, the warp rings of
// teleporter-aware legs, and a legend with each search's icon. Rendered from the tile
// pyramid directly rather than from the on-screen map, so the image is north-up
// and framed on the routes whatever the view's zoom or rotation.
// ═══════════════════════════════════════════════════════════════════════════════

import { TILE_SIZE, NATIVE_ZOOM, MAP_W, MAP_H } from './tileMath.js';
import { ROUTE_LINE_DASH, drawArrowheads } from './routeLineStyle.js';

const MAX_SIDE = 1536;      // longest side of the map area, in output px
const MIN_SIDE = 768;       // small routes are drawn larger, up to 2× the tile scale
const EDGE = 32;            // output px kept between the outermost stops and the frame
const MARGIN = 32;          // canvas edge to panels
const GAP = 16;             // between panels
const HEADER = 96;
const CHIP = 48;            // legend chip height
const FOOTER = 48;
const RADIUS = 16;
// Same look as the tile pane on screen (MapTab's tile-pane filter).
const TILE_FILTER = 'contrast(1.06) brightness(1.04) saturate(1.05)';
const APP_ICON = './app-title-icon/Abby_app_home_icon.png';
// The app's palette and type (styles/kuro.css).
const GOLD = '#edaf18';
const BG = '#080810';
// Open-sea colour of the base map tiles.
const SEA = 'rgb(6, 38, 52)';
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

// Stops per floor: 0 (the ground floor, Mengzhou included) is the main panel; every other
// floor gets its own card beside it.
const floorOf = (p) => p.floor ?? 0;
const SUB_LABEL = 32;       // label strip at the top of a sub-map card

// Marker scale for a view: full size when neighbouring stops are 40 output px or more apart,
// down to half size on dense routes; order badges only near full size.
function markerScale(stops, k, longSide) {
  const nn = stops.slice(0, 1000)
    .map(a => Math.min(...stops.filter(b => b !== a).map(b => Math.hypot(a.x - b.x, a.y - b.y))))
    .filter(Number.isFinite).sort((a, b) => a - b);
  const f = nn.length ? Math.min(1, Math.max(0.5, (nn[nn.length >> 1] * k) / 40)) : 1;
  // Icons are drawn bare, as on the map, and grow with the view: 32 px base, 48 px when large.
  return { iconPx: (longSide >= 1280 ? 48 : 32) * f, showBadge: f >= 0.75 };
}

// Axis-aligned bounds of an overlay placed on the map (centre, scale, rotation).
function overlayBounds(ov) {
  const rot = (ov.rotation * Math.PI) / 180;
  const hw = (ov.naturalWidth * ov.scale) / 2;
  const hh = (ov.naturalHeight * ov.scale) / 2;
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => ({
    x: ov.center[0] + x * Math.cos(rot) - y * Math.sin(rot),
    y: ov.center[1] + x * Math.sin(rot) + y * Math.cos(rot),
  }));
}

/**
 * routes: [{ points: [{x, y, floor?, isStart?, iconUrl?}], color, line, legs?, warps? }] in native map px.
 * legend: [{ label, iconUrl, color, line, stops }]. backdrop: { url, position } | null.
 * overlays: sub-maps to draw, each with its floor and name.
 * Returns a PNG Blob, or null when there is nothing to draw.
 */
export async function renderRouteImage({ routes, legend, backdrop, overlays = [], tileBase, title, stopsLabel, footer }) {
  const all = routes.flatMap(r => [...r.points, ...(r.warps || []).filter(Boolean)]);
  if (!all.length) return null;

  // Stop numbers run through the whole route, across panels.
  const numberOf = new Map();
  for (const r of routes) {
    let n = 0;
    for (const p of r.points) if (!p.isStart) numberOf.set(p, ++n);
  }

  // ── Main panel: ground-floor stops, framed on them, over the base map.
  const groundPts = all.filter(p => floorOf(p) === 0);
  let main = null;
  if (groundPts.length) {
    const rawMinX = Math.min(...groundPts.map(p => p.x));
    const rawMinY = Math.min(...groundPts.map(p => p.y));
    const rawMaxX = Math.max(...groundPts.map(p => p.x));
    const rawMaxY = Math.max(...groundPts.map(p => p.y));
    const side = Math.max(rawMaxX - rawMinX, rawMaxY - rawMinY, 1);
    // Deepest tile level whose scale keeps the longest side within MAX_SIDE.
    let z = NATIVE_ZOOM;
    while (z > 0 && side * 2 ** (z - NATIVE_ZOOM) > MAX_SIDE) z--;
    const tileScale = 2 ** (z - NATIVE_ZOOM);
    const up = Math.min(2, Math.max(1, MIN_SIDE / (side * tileScale)));
    const k = tileScale * up; // output px per native map px
    const pad = EDGE / k;
    const minX = rawMinX - pad;
    const minY = rawMinY - pad;
    const w = Math.max(MIN_SIDE, Math.round((rawMaxX - rawMinX + 2 * pad) * k));
    const h = Math.round((rawMaxY - rawMinY + 2 * pad) * k);
    main = {
      floor: 0, k, minX, minY, w, h, label: null,
      offX: (w - (rawMaxX - rawMinX + 2 * pad) * k) / 2, offY: 0,
      base: { z, tileScale, up, maxX: rawMaxX + pad, maxY: rawMaxY + pad },
      overlays: overlays.filter(ov => ov.floor === 0),
    };
  }
  const w = main ? main.w : MIN_SIDE;

  // ── Sub-map cards: one per other floor holding a stop, framed on its whole sub-map.
  const subFloors = [...new Set(all.map(floorOf).filter(f => f !== 0))];
  const subs = subFloors.map((floor) => {
    const ovs = overlays.filter(ov => ov.floor === floor);
    const pts = [...all.filter(p => floorOf(p) === floor), ...ovs.flatMap(overlayBounds)];
    const minX = Math.min(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    return {
      floor, overlays: ovs, label: ovs.map(ov => ov.name).join(' · '),
      minX, minY, bw: Math.max(1, Math.max(...pts.map(p => p.x)) - minX), bh: Math.max(1, Math.max(...pts.map(p => p.y)) - minY),
    };
  });
  const cols = subs.length > 1 ? 2 : 1;
  const cellW = (w - GAP * (cols - 1)) / cols;
  for (const v of subs) {
    const inner = cellW - EDGE * 2;
    v.k = Math.min(inner / v.bw, inner / v.bh); // at most square
    v.w = cellW;
    v.h = Math.round(v.bh * v.k + EDGE * 2 + SUB_LABEL);
    v.offX = (cellW - v.bw * v.k) / 2;
  }
  // Card rows: each row as tall as its tallest card.
  const subRows = [];
  for (let i = 0; i < subs.length; i += cols) subRows.push(subs.slice(i, i + cols));

  await Promise.all(['700 32px Rajdhani', '600 16px Rajdhani', '700 24px Cinzel', '700 12px "JetBrains Mono"']
    .map(f => document.fonts?.load(f).catch(() => null)));
  const [appIco, bgImg] = await Promise.all([loadImage(APP_ICON), backdrop ? loadImage(backdrop.url) : null]);
  const iconUrls = [...new Set([...all.map(p => p.iconUrl), ...legend.map(l => l.iconUrl)].filter(Boolean))];
  const iconImgs = new Map((await Promise.all(iconUrls.map(u => loadImage(u).then(img => [u, img])))).filter(([, img]) => img));

  // Legend chips, laid out in rows before the canvas height is known.
  const measure = document.createElement('canvas').getContext('2d');
  const chips = [];
  let cx = 0;
  let rows = 1;
  for (const r of legend) {
    const stops = stopsLabel(r.stops);
    measure.font = `600 16px ${DISPLAY}`;
    const lw = measure.measureText(r.label).width;
    measure.font = `12px ${DATA}`;
    const sw = measure.measureText(stops).width;
    const cw = Math.min(w, 12 + 32 + 12 + 32 + 12 + lw + 12 + sw + 16);
    if (cx > 0 && cx + cw > w) { cx = 0; rows++; }
    chips.push({ r, stops, x: cx, row: rows - 1, w: cw });
    cx += cw + 12;
  }

  // ── Vertical layout
  const W = w + MARGIN * 2;
  let y = MARGIN + HEADER + GAP;
  if (main) { main.x = MARGIN; main.y = y; y += main.h + GAP; }
  for (const row of subRows) {
    const rh = Math.max(...row.map(v => v.h));
    row.forEach((v, i) => { v.x = MARGIN + i * (cellW + GAP); v.y = y; v.h = rh; v.offY = SUB_LABEL + (rh - SUB_LABEL - v.bh * v.k) / 2; });
    y += rh + GAP;
  }
  const legendY = y;
  const footY = legendY + rows * CHIP + (rows - 1) * 12 + GAP;
  const H = footY + FOOTER + MARGIN - GAP;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Backdrop: the player's app background at the app's 35% over its base colour, cover-fit
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  if (bgImg) {
    const sc = Math.max(W / bgImg.width, H / bgImg.height);
    const [px, py] = (backdrop.position || '50% 50%').split(/\s+/).map(v => (parseFloat(v) || 50) / 100);
    const dw = bgImg.width * sc;
    const dh = bgImg.height * sc;
    ctx.globalAlpha = 0.35;
    ctx.drawImage(bgImg, (W - dw) * px, (H - dh) * (py ?? 0.5), dw, dh);
    ctx.globalAlpha = 1;
  }
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

  // Route lines: a dark casing under each coloured line keeps it readable on any tile.
  const stroke = (a, b, color, line) => {
    ctx.lineJoin = 'round';
    ctx.setLineDash(ROUTE_LINE_DASH[line] || []);
    ctx.lineCap = line === 'dotted' ? 'round' : 'butt';
    ctx.strokeStyle = 'rgba(8, 8, 16, 0.7)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    if (line === 'arrow') drawArrowheads(ctx, a, b, color);
  };

  // Draws one map view: sea, base tiles (main panel only), sub-maps, then the legs and stops
  // of this floor. A leg is drawn only when both its ends are on the view's floor.
  const drawView = async (v) => {
    const { x: vx, y: vy, w: vw, h: vh, k } = v;
    const toOut = (p) => ({ x: vx + v.offX + (p.x - v.minX) * k, y: vy + v.offY + (p.y - v.minY) * k });
    const inView = (p) => floorOf(p) === v.floor;
    ctx.save();
    roundRect(ctx, vx, vy, vw, vh, RADIUS);
    ctx.filter = TILE_FILTER;
    ctx.fillStyle = SEA;
    ctx.fill();
    ctx.clip();
    if (v.base) {
      // Base tiles, clipped to the map's own extent: tiles past it carry black padding.
      const { z, tileScale, up } = v.base;
      const jobs = [];
      for (let tx = Math.max(0, Math.floor((v.minX * tileScale) / TILE_SIZE)); tx <= Math.floor((v.base.maxX * tileScale) / TILE_SIZE); tx++) {
        for (let ty = Math.max(0, Math.floor((v.minY * tileScale) / TILE_SIZE)); ty <= Math.floor((v.base.maxY * tileScale) / TILE_SIZE); ty++) {
          jobs.push(loadImage(`${tileBase}map-tiles/Solaris_3/${z}/${ty}/${tx}.webp`).then(img => ({ img, tx, ty })));
        }
      }
      const tiles = await Promise.all(jobs);
      const m0 = toOut({ x: 0, y: 0 });
      const m1 = toOut({ x: MAP_W, y: MAP_H });
      ctx.save();
      ctx.beginPath();
      ctx.rect(m0.x, m0.y, m1.x - m0.x, m1.y - m0.y);
      ctx.clip();
      const tileOut = TILE_SIZE * up;
      for (const t of tiles) {
        if (t.img) ctx.drawImage(t.img, vx + v.offX + t.tx * tileOut - v.minX * k, vy + v.offY + t.ty * tileOut - v.minY * k, tileOut, tileOut);
      }
      ctx.restore();
    }
    ctx.filter = 'none';
    // Sub-maps: each overlay's tiles at the pyramid level closest to 1:1 with the output,
    // placed with its centre, scale and rotation.
    for (const ov of v.overlays) {
      const displayScale = ov.scale * k;
      let oz = null;
      let factor = 1;
      if (ov.pyramid) {
        oz = Math.min(ov.maxZoom, Math.max(ov.minZoom, Math.round(ov.maxZoom + Math.log2(displayScale))));
        factor = 2 ** (ov.maxZoom - oz);
      }
      const tilePx = TILE_SIZE * factor;
      const c = toOut({ x: ov.center[0], y: ov.center[1] });
      const rot = (ov.rotation * Math.PI) / 180;
      // View corners in overlay-local px, to fetch only the tiles inside the view.
      const local = [[vx, vy], [vx + vw, vy], [vx + vw, vy + vh], [vx, vy + vh]].map(([sx, sy]) => {
        const dx = (sx - c.x) / displayScale;
        const dy = (sy - c.y) / displayScale;
        return [dx * Math.cos(-rot) - dy * Math.sin(-rot) + ov.naturalWidth / 2, dx * Math.sin(-rot) + dy * Math.cos(-rot) + ov.naturalHeight / 2];
      });
      const x0 = Math.max(0, Math.floor(Math.min(...local.map(q => q[0])) / tilePx));
      const x1 = Math.min(Math.ceil(ov.naturalWidth / tilePx) - 1, Math.floor(Math.max(...local.map(q => q[0])) / tilePx));
      const y0 = Math.max(0, Math.floor(Math.min(...local.map(q => q[1])) / tilePx));
      const y1 = Math.min(Math.ceil(ov.naturalHeight / tilePx) - 1, Math.floor(Math.max(...local.map(q => q[1])) / tilePx));
      if (x0 > x1 || y0 > y1) continue;
      const jobs = [];
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) jobs.push(loadImage(ov.tileUrl(oz, ty, tx)).then(img => ({ img, tx, ty })));
      const imgs = await Promise.all(jobs);
      ctx.save();
      ctx.globalAlpha = ov.opacity;
      ctx.translate(c.x, c.y);
      ctx.rotate(rot);
      ctx.scale(displayScale, displayScale);
      for (const { img, tx, ty } of imgs) {
        if (img) ctx.drawImage(img, tx * tilePx - ov.naturalWidth / 2, ty * tilePx - ov.naturalHeight / 2, tilePx, tilePx);
      }
      ctx.restore();
    }
    // Edge vignette so the tiles sink into the frame.
    const vig = ctx.createRadialGradient(vx + vw / 2, vy + vh / 2, Math.min(vw, vh) * 0.4, vx + vw / 2, vy + vh / 2, Math.max(vw, vh) * 0.75);
    vig.addColorStop(0, 'rgba(8, 8, 16, 0)');
    vig.addColorStop(1, 'rgba(8, 8, 16, 0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(vx, vy, vw, vh);

    const stops = routes.flatMap(r => r.points.filter(p => !p.isStart && inView(p)));
    const { iconPx, showBadge } = markerScale(stops, k, Math.max(vw, vh));
    for (const r of routes) {
      for (let i = 1; i < r.points.length; i++) {
        const style = r.legs ? r.legs[i - 1] : r;
        const via = r.warps && r.warps[i - 1];
        const fromPt = via || r.points[i - 1];
        if (!inView(fromPt) || !inView(r.points[i])) continue;
        const from = toOut(fromPt);
        stroke(from, toOut(r.points[i]), style.color, style.line);
        if (via) {
          // The teleporter warped to, as its own icon in a dashed ring.
          ctx.strokeStyle = style.color;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.arc(from.x, from.y, iconPx * 0.75, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          const ti = via.iconUrl && iconImgs.get(via.iconUrl);
          if (ti) ctx.drawImage(ti, from.x - iconPx / 2, from.y - iconPx / 2, iconPx, iconPx);
        }
      }
    }
    // Stops, drawn after every line so no route crosses an icon: the stop's map icon, bare as
    // on the map, with its order in a small badge in the route colour.
    for (const r of routes) {
      r.points.forEach((p, i) => {
        if (!inView(p)) return;
        const o = toOut(p);
        const color = r.legs ? r.legs[Math.max(0, i - 1)].color : r.color;
        if (p.isStart) {
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(o.x, o.y, 8, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
          return;
        }
        const n = numberOf.get(p);
        const img = p.iconUrl && iconImgs.get(p.iconUrl);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 6;
        if (img) ctx.drawImage(img, o.x - iconPx / 2, o.y - iconPx / 2, iconPx, iconPx);
        else { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(o.x, o.y, iconPx / 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.shadowBlur = 0;
        if (!showBadge) return;
        const bx2 = o.x + iconPx * 0.4;
        const by2 = o.y - iconPx * 0.4;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(bx2, by2, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = BG;
        ctx.font = `700 ${n > 99 ? 6 : 8}px ${DATA}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n), bx2, by2 + 1);
      });
    }
    // Sub-map name on a strip across the top of its card.
    if (v.label) {
      ctx.fillStyle = 'rgba(8, 8, 16, 0.72)';
      ctx.fillRect(vx, vy, vw, SUB_LABEL);
      ctx.fillStyle = GOLD;
      ctx.font = `600 16px ${DISPLAY}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(v.label, vx + 16, vy + SUB_LABEL / 2 + 1);
    }
    ctx.restore();
    roundRect(ctx, vx, vy, vw, vh, RADIUS);
    ctx.strokeStyle = 'rgba(237, 175, 24, 0.32)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  if (main) await drawView(main);
  for (const v of subs) await drawView(v);

  // ── Legend chips
  for (const c of chips) {
    const x = MARGIN + c.x;
    const cy = legendY + c.row * (CHIP + 12);
    panel(ctx, x, cy, c.w, CHIP, 12);
    const my = cy + CHIP / 2;
    ctx.save();
    roundRect(ctx, x, cy, c.w, CHIP, 12);
    ctx.clip();
    const li = c.r.iconUrl && iconImgs.get(c.r.iconUrl);
    if (li) ctx.drawImage(li, x + 12, my - 16, 32, 32);
    stroke({ x: x + 56, y: my }, { x: x + 88, y: my }, c.r.color, c.r.line);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = TEXT;
    ctx.font = `600 16px ${DISPLAY}`;
    ctx.fillText(c.r.label, x + 100, my + 1);
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
