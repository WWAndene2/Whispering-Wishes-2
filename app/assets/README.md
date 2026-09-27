# app/assets

`icon.png` is a same-content copy of `Abby_icon.png`, kept only because
`npm run icons` (`@capacitor/assets generate --android`) requires that exact
filename as its source — the tool has no option to point at a differently-named
file. If `Abby_icon.png` changes, re-copy it over `icon.png` before running
`npm run icons`.

`map-icon-sources/` holds enemy portraits supplied for map icons that have no
official version (not shipped — only the composed PNG in
`public/map-icons/enemy/` is). Each is framed into `public/map-icons/frames/`
(octagon for Calamity, diamond for Overlord/Elite) as described in the commit
that adds it.
