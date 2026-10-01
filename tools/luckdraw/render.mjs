#!/usr/bin/env node
// Renders one frame of a Spine 4.1 Luckdraw rig with the app's own runtime
// (app/public/vendor/spine-player-4.1.55) and settings, in headless Chromium.
//
// Usage: node render.mjs <skel> <atlas> <out.png|-> <width> <height> <viewport-json|auto> [--regions]
//   <skel>/<atlas>: paths relative to app/public (e.g. spine/role_xin/c_xin_01.skel).
//   viewport: {"x":..,"y":..,"width":..,"height":..} in world units, or "auto"
//             (spine-player's default framing).
//   --regions: also report, for every skin attachment's atlas region, the slot
//              blend modes that use it (0 normal, 1 additive, 2 multiply, 3 screen).
// Prints one JSON line: { vp: frame-0 world bounds, regions?: {name: [modes]} }.
// Needs a static server of app/public at $LUCKDRAW_SERVER (default
// http://127.0.0.1:8099), e.g. `npx http-server app/public -p 8099 -s`.
// Chromium: $PW_CHROMIUM (default /opt/pw-browsers/chromium); Playwright
// module: $PLAYWRIGHT_MODULE (default 'playwright').
import fs from 'fs';

const [skel, atlas, out, w, h, vpArg, flag] = process.argv.slice(2);
if (!h) { console.error('usage: render.mjs <skel> <atlas> <out.png|-> <w> <h> <viewport|auto> [--regions]'); process.exit(2); }
const SERVER = process.env.LUCKDRAW_SERVER || 'http://127.0.0.1:8099';
// Without the server the page never loads spine-player and the wait below would hang.
try {
  const r = await fetch(`${SERVER}/vendor/spine-player-4.1.55/spine-player.js`, { method: 'HEAD' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
} catch (e) {
  console.error(`static server of app/public not reachable at ${SERVER} (${e.message})`);
  process.exit(1);
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const vp = vpArg && vpArg !== 'auto' ? JSON.parse(vpArg) : null;
const wantRegions = flag === '--regions';

// Same runtime tweak as app/src/main.jsx: additive slots leave canvas alpha unchanged.
const html = `<!doctype html><html><head>
<style>html,body{margin:0;background:transparent}#c{width:${w}px;height:${h}px}</style>
<script src="/vendor/spine-player-4.1.55/spine-player.js"></script></head><body><div id=c></div><script>
spine.PolygonBatcher.blendModesGL[1].srcAlpha = 0;
window.done = false;
new spine.SpinePlayer('c', {
  skelUrl: '/${skel}', atlasUrl: '/${atlas}', animation: 'idle', showControls: false,
  backgroundColor: '#00000000', alpha: true, premultipliedAlpha: false, showLoading: false,
  preserveDrawingBuffer: true,
  ${vp ? `viewport: { ...${JSON.stringify(vp)}, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0, transitionTime: 0 },` : ''}
  success: (p) => {
    p.animationState.timeScale = 0;
    p.animationState.apply(p.skeleton); p.skeleton.updateWorldTransform();
    const o = new spine.Vector2(), sz = new spine.Vector2(); p.skeleton.getBounds(o, sz, []);
    window.vp = { x: o.x, y: o.y, width: sz.x, height: sz.y };
    if (${wantRegions}) {
      const use = {}, sd = p.skeleton.data;
      for (const skin of sd.skins) for (const e of skin.getAttachments()) {
        const a = e.attachment, name = (a.region && a.region.name) || a.path || a.name;
        (use[name] = use[name] || new Set()).add(sd.slots[e.slotIndex].blendMode);
      }
      window.regions = Object.fromEntries(Object.entries(use).map(([k, v]) => [k, [...v]]));
    }
    setTimeout(() => { window.done = true; }, 1500);
  },
  error: (p, m) => { window.err = m; window.done = true; },
});
</script></body></html>`;

const b = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const pg = await b.newPage({ viewport: { width: +w, height: +h } });
  pg.on('pageerror', (e) => console.error('pageerror:', e.message));
  await pg.route('**/__luckdraw_harness.html', (r) => r.fulfill({ contentType: 'text/html', body: html }));
  await pg.goto(`${SERVER}/__luckdraw_harness.html`);
  await pg.waitForFunction(() => window.done, null, { timeout: 600000 });
  const res = await pg.evaluate(() => ({ err: window.err, vp: window.vp, regions: window.regions }));
  if (res.err) { console.error('spine error:', res.err); process.exit(1); }
  if (out !== '-') {
    const data = await pg.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
    fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  }
  console.log(JSON.stringify({ vp: res.vp, ...(wantRegions ? { regions: res.regions } : {}) }));
} finally {
  await b.close();
}
