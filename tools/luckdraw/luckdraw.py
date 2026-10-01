#!/usr/bin/env python3
"""Luckdraw (animated convene-banner) Spine rigs from encore.moe, per character.

Subcommands, run from the repository root, one character at a time:

  fetch   <Dir> <stem> <role>        download the rig into app/public/spine/<role>/
  fixtex  <skel> <atlas>             premultiply RGB in Screen/Multiply-only regions
  process <Name> <skel> <atlas> [--work DIR]
                                     still image, tile framing, bannerViewport (JSON)
  wire    <result.json> <key> <Element> <encoreId>
                                     add the entry to SpinePlayer.jsx and banners.js

<Dir>/<stem> come from https://api.encore.moe/en/character/<id>, field
Luckdraw.LuckdrawSpineSkeletonData (".../Character/<Dir>/<stem>.skel").
<skel>/<atlas> are paths relative to app/public, as printed by `fetch`.
render.mjs (same folder) needs a static server of app/public; see its header.
Requires: curl, node + playwright, python3 with numpy, pillow, opencv-python.
"""
import json
import os
import re
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PUB = os.path.join(ROOT, 'app', 'public')
RENDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'render.mjs')
ENCORE = 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/UiLuckdraw/Spine/Character/'
TILE_MIN_FILL = 0.69   # below this (larger dimension), the Assets tile gets a tileViewport
TILE_TARGET_FILL = 0.83


def render(skel, atlas, out, w, h, vp='auto', regions=False):
    args = ['node', RENDER, skel, atlas, out, str(w), str(h), vp if isinstance(vp, str) else json.dumps(vp)]
    if regions:
        args.append('--regions')
    r = subprocess.run(args, capture_output=True, text=True)
    lines = r.stdout.strip().splitlines()
    if r.returncode or not lines:
        sys.exit(f'render failed ({skel}): {r.stderr.strip()[-400:]}')
    return json.loads(lines[-1])


def curl(url):
    # Python's urllib gets 403 from encore.moe; curl does not.
    r = subprocess.run(['curl', '-sSf', url], capture_output=True)
    if r.returncode:
        sys.exit(f'download failed: {url}')
    return r.stdout


def cmd_fetch(d, stem, role):
    dest = os.path.join(PUB, 'spine', role)
    os.makedirs(dest, exist_ok=True)
    tracked = set(subprocess.run(['git', 'ls-files'], cwd=dest, capture_output=True, text=True).stdout.split())
    atlas = curl(f'{ENCORE}{d}/{stem}.atlas')
    skel = curl(f'{ENCORE}{d}/{stem}.skel')
    pages = [l.strip() for l in atlas.decode().splitlines() if l.strip().endswith(('.webp', '.png'))]
    clash = [p for p in pages if p in tracked]
    if clash:
        sys.exit(f'atlas page(s) would overwrite tracked files: {clash}')
    # A Spine 4.2 banner rig may already use this stem in the same folder.
    suffix = '_luckdraw' if {f'{stem}.atlas', f'{stem}.skel', f'{stem}.json'} & tracked else ''
    with open(os.path.join(dest, f'{stem}{suffix}.atlas'), 'wb') as f:
        f.write(atlas)
    with open(os.path.join(dest, f'{stem}{suffix}.skel'), 'wb') as f:
        f.write(skel)
    for p in pages:
        with open(os.path.join(dest, p), 'wb') as f:
            f.write(curl(f'{ENCORE}{d}/{p}'))
    print(json.dumps({'skel': f'spine/{role}/{stem}{suffix}.skel', 'atlas': f'spine/{role}/{stem}{suffix}.atlas', 'pages': pages}))


def atlas_regions(atlas_path):
    pages, page, cur = {}, None, None
    for line in open(atlas_path).read().split('\n'):
        s = line.strip()
        if s.endswith(('.webp', '.png')):
            page = s
            pages.setdefault(page, [])
        elif s and ':' not in s:
            cur = {'name': s}
            pages[page].append(cur)
        elif cur is not None and s.startswith('bounds:'):
            cur['bounds'] = list(map(int, s[7:].split(',')))
        elif cur is not None and s.startswith('rotate:'):
            cur['rotate'] = s[7:]
    return pages


def cmd_fixtex(skel, atlas):
    """spine-player's Screen (ONE, ONE_MINUS_SRC_COLOR) and Multiply (DST_COLOR,
    ONE_MINUS_SRC_ALPHA) factors assume premultiplied colour; these pages are
    straight alpha, so colour hidden under transparent pixels draws as blobs.
    Premultiplying RGB in regions used only by those slots makes the factors exact."""
    use = render(skel, atlas, '-', 64, 64, regions=True)['regions']
    target = {k for k, v in use.items() if set(v) <= {2, 3}}
    mixed = sorted(k for k, v in use.items() if set(v) & {2, 3} and not set(v) <= {2, 3})
    print(f'{len(use)} regions; Screen/Multiply-only: {sorted(target)}; mixed (left as is): {mixed}')
    if not target:
        return
    folder = os.path.dirname(os.path.join(PUB, atlas))
    for page, regs in atlas_regions(os.path.join(PUB, atlas)).items():
        hits = [r for r in regs if r['name'] in target and 'bounds' in r]
        if not hits:
            continue
        path = os.path.join(folder, page)
        # Premultiplying twice darkens those regions again, so only touch a freshly
        # fetched page: one git does not already hold unchanged.
        tracked = subprocess.run(['git', 'ls-files', '--error-unmatch', page], cwd=folder, capture_output=True).returncode == 0
        if tracked and subprocess.run(['git', 'diff', '--quiet', '--', page], cwd=folder).returncode == 0:
            sys.exit(f'{page} is committed and unchanged (already fixed?); re-fetch it before running fixtex')
        im = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
        for r in hits:
            x, y, w, h = r['bounds']
            if r.get('rotate') in ('90', 'true', '270'):
                w, h = h, w
            blk = im[y:y + h, x:x + w]
            blk[..., :3] *= blk[..., 3:4] / 255.0
        Image.fromarray(np.clip(im + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(path, quality=90, method=6, exact=True)
        print(f'rewrote {page} ({len(hits)} regions premultiplied)')


def theme_art(name):
    js = "import('./banners.js').then(m=>{const t=m.CHARACTER_THEMES.find(t=>t.name===process.argv[1]);console.log(t?t.bannerArt:'')})"
    r = subprocess.run(['node', '-e', js, name], cwd=os.path.join(ROOT, 'app', 'src', 'data'), capture_output=True, text=True)
    art = r.stdout.strip()
    if not art:
        sys.exit(f'no CHARACTER_THEMES bannerArt for {name}')
    return art


def sift_pairs(a_gray, b_gray, b_mask):
    sift = cv2.SIFT_create(8000)
    k1, d1 = sift.detectAndCompute(a_gray, None)
    k2, d2 = sift.detectAndCompute(b_gray, b_mask)
    good = [m for m, n in cv2.BFMatcher().knnMatch(d1, d2, k=2) if m.distance < 0.75 * n.distance]
    return np.float32([k1[m.queryIdx].pt for m in good]), np.float32([k2[m.trainIdx].pt for m in good])


def on_black(rgba):
    a = rgba[:, :, 3:4] / 255.0
    return cv2.cvtColor((rgba[:, :, :3] * a).astype(np.uint8), cv2.COLOR_BGR2GRAY), (rgba[:, :, 3] > 200).astype(np.uint8) * 255


def cmd_process(name, skel, atlas, work):
    os.makedirs(work, exist_ok=True)
    slug = name.lower().replace(' ', '-').replace(':', '')
    out = {'name': name, 'skel': skel, 'atlas': atlas}
    vp = render(skel, atlas, '-', 64, 64)['vp']
    H = round(2048 * vp['height'] / vp['width'])
    big = os.path.join(work, f'{slug}-2048.png')
    render(skel, atlas, big, 2048, H, vp)

    # Assets tile: how much of a square tile the default framing fills.
    auto = os.path.join(work, f'{slug}-tile.png')
    render(skel, atlas, auto, 512, 512)
    b = Image.open(auto).split()[3].point(lambda v: 255 if v > 40 else 0).getbbox()
    fill = ((b[2] - b[0]) / 512, (b[3] - b[1]) / 512)
    out['tileFill'] = [round(f, 2) for f in fill]
    im = Image.open(big)
    tv = None
    if max(fill) < TILE_MIN_FILL:
        bb = im.split()[3].point(lambda v: 255 if v > 40 else 0).getbbox()
        k = vp['width'] / 2048
        x0, x1 = vp['x'] + bb[0] * k, vp['x'] + bb[2] * k
        yt, yb = vp['y'] + (H - bb[1]) * k, vp['y'] + (H - bb[3]) * k
        side = max(x1 - x0, yt - yb) / TILE_TARGET_FILL
        cx, cy = (x0 + x1) / 2, (yt + yb) / 2
        tv = {'x': round(cx - side / 2, 2), 'y': round(cy - side / 2, 2), 'width': round(side, 2), 'height': round(side, 2)}
    out['tileViewport'] = tv

    # Still for the Assets tile (same framing as the tile when a tileViewport is set).
    sdir = os.path.join(PUB, 'banners', 'characters', slug)
    os.makedirs(sdir, exist_ok=True)
    still = os.path.join(sdir, f"{name.replace(' ', '-').replace(':', '')}-Luckdraw-Still.webp")
    if tv:
        sq = os.path.join(work, f'{slug}-square.png')
        render(skel, atlas, sq, 1024, 1024, tv)
        Image.open(sq).save(still, quality=90, method=6)
    else:
        s = im.crop(im.getbbox())
        f = 1024 / max(s.size)
        s.resize((round(s.width * f), round(s.height * f)), Image.LANCZOS).save(still, quality=90, method=6)
    out['still'] = './' + os.path.relpath(still, PUB)

    # bannerViewport: where the tracker art sits in the rig's world space.
    art_rel = theme_art(name)
    art = os.path.join(PUB, art_rel.lstrip('./'))
    out['art'] = art_rel
    A = cv2.imread(art)
    AH, AW = A.shape[:2]
    out['artSize'] = [AW, AH]
    a_gray = cv2.cvtColor(A, cv2.COLOR_BGR2GRAY)
    R = cv2.imread(big, cv2.IMREAD_UNCHANGED)
    p1, p2 = sift_pairs(a_gray, *on_black(R))
    M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=3, maxIters=20000)
    inl = inl.ravel().astype(bool)
    P, Q = p1[inl], p2[inl]
    X = np.zeros((2 * len(P), 3))
    X[0::2, 0], X[0::2, 1], X[1::2, 0], X[1::2, 2] = P[:, 0], 1, P[:, 1], 1
    (sc, tx, ty), *_ = np.linalg.lstsq(X, Q.reshape(-1), rcond=None)
    res = np.hypot(*(np.c_[P[:, 0] * sc + tx, P[:, 1] * sc + ty] - Q).T) / sc
    ppw = 2048 / vp['width']
    wid, hei = AW * sc / ppw, AH * sc / ppw
    bv = {'x': round(vp['x'] + tx / ppw, 2), 'y': round(vp['y'] + (H - ty) / ppw - hei, 2), 'width': round(wid, 2), 'height': round(hei, 2)}
    out['match'] = {'matches': len(p1), 'inliers': int(inl.sum()), 'mean': round(float(res.mean()), 2), 'max': round(float(res.max()), 2),
                    'rot': round(float(np.degrees(np.arctan2(M[1, 0], M[0, 0]))), 2), 'aspect': round(wid / hei, 4)}
    out['bannerViewport'] = bv

    # Verify: re-render at the art size and measure the residual offset.
    ver = os.path.join(work, f'{slug}-verify.png')
    render(skel, atlas, ver, AW, AH, bv)
    V = cv2.imread(ver, cv2.IMREAD_UNCHANGED)
    q1, q2 = sift_pairs(a_gray, *on_black(V))
    d = q2 - q1
    c = d[np.hypot(*d.T) < 5]
    out['verify'] = {'consensus': int(len(c)), 'of': int(len(d)), 'median': [round(float(v), 2) for v in (np.median(c, axis=0) if len(c) else [99, 99])]}
    va = V[:, :, 3:4] / 255.0
    cv2.imwrite(os.path.join(work, f'{slug}-overlay.jpg'), np.hstack([A, (A * (1 - va) + V[:, :, :3] * va).astype(np.uint8)])[::2, ::2])

    path = os.path.join(work, f'{slug}.json')
    json.dump(out, open(path, 'w'), indent=1)
    print(json.dumps(out))
    print(f'result: {path}  overlay: {os.path.join(work, slug + "-overlay.jpg")}', file=sys.stderr)


def cmd_wire(result, key, element, eid):
    r = json.load(open(result))
    m, v = r['match'], r['bannerViewport']
    aw, ah = r['artSize']
    fmt = lambda o: '{ ' + ', '.join(f'{k}: {o[k]:.2f}' for k in ('x', 'y', 'width', 'height')) + ' }'
    lines = [f"  // {r['name']} (character {eid}): bannerViewport against {r['art'].lstrip('./')} ({aw}x{ah}): {m['inliers']} inliers,",
             f"  // mean residual {m['mean']:.2f} px / max {m['max']:.2f} px at the art's {aw} px width, rotation {m['rot']:.2f} deg; aspect {m['aspect']}."]
    k = key if key.isidentifier() else f"'{key}'"
    body = (f"    name: '{r['name']}', element: '{element}', skelUrl: '{r['skel']}', atlasUrl: '{r['atlas']}',\n"
            f"    bannerArtSize: [{aw}, {ah}],\n    bannerViewport: {fmt(v)},\n")
    if r['tileViewport']:
        f = r['tileFill']
        body += (f"    // tileViewport: default framing left the frame-0 art at {f[0] * 100:.0f}% x {f[1] * 100:.0f}% of the tile; this square fills 83%.\n"
                 f"    tileViewport: {fmt(r['tileViewport'])},\n")
    entry = '\n'.join(lines) + f"\n  {k}: {{\n{body}  }},\n"
    sp = os.path.join(ROOT, 'app', 'src', 'shared', 'components', 'SpinePlayer.jsx')
    s = open(sp).read()
    anchor = '};\n\n// Merged view for lookup by surface-prefixed id.'
    if s.count(anchor) != 1 or f"name: '{r['name']}', element:" in s[s.index('export const LUCKDRAW_SPINE_CHARACTERS'):s.index(anchor)]:
        sys.exit('SpinePlayer.jsx: anchor missing or character already registered')
    open(sp, 'w').write(s.replace(anchor, entry + anchor))
    bj = os.path.join(ROOT, 'app', 'src', 'data', 'banners.js')
    s = open(bj).read()
    i = s.index('const LUCKDRAW_STILLS = {\n')
    j = s.index('};', i)
    nk = r['name'] if r['name'].isidentifier() else f"'{r['name']}'"
    if re.search(rf"^  {re.escape(nk)}: ", s[i:j], re.M):
        sys.exit('banners.js: still already registered')
    open(bj, 'w').write(s[:j] + f"  {nk}: '{r['still']}',\n" + s[j:])
    print(f"wired {r['name']}")


if __name__ == '__main__':
    a = sys.argv[1:]
    cmds = {'fetch': (cmd_fetch, 3), 'fixtex': (cmd_fixtex, 2), 'process': (cmd_process, 3), 'wire': (cmd_wire, 4)}
    if not a or a[0] not in cmds:
        sys.exit(__doc__)
    fn, n = cmds[a[0]]
    rest = a[1:]
    if a[0] == 'process':
        work = rest[rest.index('--work') + 1] if '--work' in rest else os.path.join(os.environ.get('TMPDIR', '/tmp'), 'luckdraw')
        rest = [x for i, x in enumerate(rest) if x != '--work' and (i == 0 or rest[i - 1] != '--work')]
        if len(rest) != 3:
            sys.exit(__doc__)
        fn(*rest, work)
    else:
        if len(rest) != n:
            sys.exit(__doc__)
        fn(*rest)
