# tools/luckdraw — animated convene-banner (Luckdraw) Spine rigs

Adds a character's Luckdraw rig (the game's `UiLuckdraw/Spine/Character/…`
splash animation, Spine 4.1 binary) from encore.moe to the app:

- the detail modal's Assets section tile ("Animated Banner SplashArt"), via a
  still image plus the playable rig;
- the tracker card in full-animation mode, where `BannerCard` lays the rig
  exactly over the character's banner art (`bannerViewport`).

Registered in `LUCKDRAW_SPINE_CHARACTERS` (`app/src/shared/components/SpinePlayer.jsx`)
and `LUCKDRAW_STILLS` (`app/src/data/banners.js`).

## Requirements

- `curl`, Node with Playwright and a Chromium (`PW_CHROMIUM`, default
  `/opt/pw-browsers/chromium`; `PLAYWRIGHT_MODULE` if `playwright` is not
  resolvable from here, e.g. a global install's `index.mjs`).
- Python 3 with `numpy`, `pillow`, `opencv-python-headless`.
- A static server of `app/public` (`LUCKDRAW_SERVER`, default
  `http://127.0.0.1:8099`): `npx http-server app/public -p 8099 -s`.

## One character (from the repository root)

Find the rig on `https://api.encore.moe/en/character/<id>`, field
`Luckdraw.LuckdrawSpineSkeletonData` → `…/Character/<Dir>/<stem>.skel`.

```sh
python3 tools/luckdraw/luckdraw.py fetch <Dir> <stem> role_<code>
#   prints the skel/atlas paths; adds a _luckdraw suffix when a Spine 4.2
#   banner rig already uses the stem in that folder (4.2 files untouched)
python3 tools/luckdraw/luckdraw.py fixtex <skel> <atlas>
#   premultiplies RGB in Screen/Multiply-only regions (see below);
#   refuses a page that is committed and unchanged
python3 tools/luckdraw/luckdraw.py process <Name> <skel> <atlas> --work /tmp/luckdraw
#   writes the still, prints tileFill/tileViewport, match and verify numbers,
#   and saves <slug>.json and <slug>-overlay.jpg in the work folder
python3 tools/luckdraw/luckdraw.py wire /tmp/luckdraw/<slug>.json <code> <Element> <id>
cd app && npx vitest run
```

Before committing, look at the overlay and the still, and check:
`verify.median` within about 0.5 px, `match.aspect` equal to the art's, and
the tile in the running app (Collection → character → Assets). Commit one
character at a time with the measured numbers in the message.

## Why `fixtex`

spine-player's Screen (`ONE, ONE_MINUS_SRC_COLOR`) and Multiply
(`DST_COLOR, ONE_MINUS_SRC_ALPHA`) blend factors assume premultiplied colour.
These atlas pages are straight alpha, so colour hidden under transparent
pixels renders as solid blobs, squares or slabs (seen on Sigrika, Jinhsi,
Yinlin, Brant, Jiyan, Changli). Premultiplying RGB by alpha only in regions
used solely by Screen/Multiply slots makes the runtime's own factors exact;
normal and additive regions are left as downloaded. The page is re-saved as
lossy WebP q90 with lossless alpha.
