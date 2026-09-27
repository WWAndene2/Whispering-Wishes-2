# Map archive

Previous versions of map overlays, kept for reference and never served:
nothing under `app/assets/` is copied into the web or native build, and no
code references these files.

- `lahai-roi-2026-09-22/overlay/` — Lahai Roi before the 2026-09-27 map
  update (tiles, sources, reference webp), byte-for-byte as it was served.
- `lahai-roi-2026-09-22/unused-webp-tiles/` — an older `{z}/{y}/{x}.webp`
  pyramid that sat next to it; the app only ever loaded `lossless/`.
- `dimmr-plains-2026-09-22/overlay/` — Dimmr Plains before the 2026-09-27
  map update (tiles and reference webp), byte-for-byte as it was served.
- `solaris_3-old/` — the base world map's previous version.

To bring a version back, move its folder into `app/public/map-tiles/` under a
**new** folder name and point the overlay's `imageUrl` at it (tiles are cached
by URL on jsDelivr and on devices, so reusing an old path would serve stale
tiles).
