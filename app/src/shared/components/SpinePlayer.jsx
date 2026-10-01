// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — shared/components/SpinePlayer.jsx
// Animated Spine character renderer. Three independent systems live here:
//
//   BANNER_SPINE_CHARACTERS — Spine 4.2 JSON, in-repo at /spine/role_<id>/,
//     rendered by BannerCard on the tracker. Runtime: window.spine (4.2).
//
//   SPRITE_SPINE_CHARACTERS — Spine 4.1 binary .skel from the source,
//     placed under /portraits/<id>/, rendered in CollectionGridCard and the
//     detail modals. Runtime: window.spine41 (4.1).
//
//   LUCKDRAW_SPINE_CHARACTERS — Spine 4.1 binary .skel of a character's
//     animated convene-banner splash art (the game's UiLuckdraw rig), placed
//     under /spine/role_<id>/, rendered in the detail modal's Assets section
//     as "Animated Banner SplashArt". Runtime: window.spine41 (4.1).
//
// The two systems share this file but NOT their keyspace: sprite keys derive
// from the source's portrait codename (lowercased) and may collide with banner
// codenames for unrelated characters (e.g. banner luokeke=Lumi, sprite
// luokeke=Roccia). To keep the lookup unambiguous we expose a merged flat
// map `SPINE_CHARACTERS` keyed by surface-prefixed ids (`banner:xigelika`,
// `sprite:fuluoluo`). `getSpineId(name, {surface})` returns one of those
// prefixed ids; downstream code treats the whole string as opaque.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useId, useRef, useState, memo } from 'react';
import { useSpineTuning } from '../../hooks/useSpineTuning.js';
import { useSpineBudget } from '../../hooks/useSpineBudget.js';
import { useInView } from '../../hooks/useInView.js';
import { getPrerenderedIdle } from '../spinePrerenderManifest.js';

// SVG color-matrix filter used to chroma-key black out of MP4 prerenders.
// MP4/H.264 has no alpha channel, so the capture pipeline bakes a solid
// black background. The matrix's last row sets the output alpha to
// 3 * (R + G + B), so pixels at or near pure black drop to alpha=0 while
// any non-black pixel (down to mid-gray) clamps to alpha=1. Antialiased
// edges between black and character get a smooth alpha gradient.
//
// Injected once into <body> on module load so the filter URL is always
// resolvable. Skipped on the server side (ssr) and on hot-reload re-imports.
const SVG_FILTER_ID = 'spine-prerender-drop-black';
if (typeof document !== 'undefined' && !document.getElementById(SVG_FILTER_ID)) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">' +
    `<filter id="${SVG_FILTER_ID}" color-interpolation-filters="sRGB">` +
    '<feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  3 3 3 0 0"/>' +
    '</filter>' +
    '</svg>';
  document.body.appendChild(wrap);
}

// Banner spine — tx/ty tuned per-character based on face offset from skeleton center.
export const BANNER_SPINE_CHARACTERS = {
  xigelika:    { name: 'Sigrika',      element: 'Aero',    scale: 2.3, tx: 3,    ty: 2.5 },
  qiuyuan:     { name: 'Qiuyuan',      element: 'Aero',    scale: 2.3, tx: 0.5,  ty: 2.5 },
  zanni:       { name: 'Zani',         element: 'Electro', scale: 2.0, tx: -0.5, ty: -7 },
  feibi:       { name: 'Phoebe',       element: 'Spectro', scale: 2.0, tx: 5.5,  ty: -10 },
  linnai:      { name: 'Lynae',        element: 'Spectro', scale: 2.0, tx: 9.5,  ty: -10.5 },
  jinxi:       { name: 'Jinhsi',       element: 'Spectro', scale: 2.3, tx: 1.5,  ty: 2.5 },
  // luokeke is Roccia's convene-banner rig (encore.moe character 1606, C_LuoKeKe_01; its Luckdraw copy
  // matches her banner art), not Lumi's — Lumi's codename is Dengdeng.
  luokeke:     { name: 'Roccia',       element: 'Havoc',   scale: 2.3, tx: 1,    ty: 2.5 },
  yinlin:      { name: 'Yinlin',       element: 'Electro', scale: 2.3, tx: 2,    ty: 2.5 },
  bulante:     { name: 'Brant',        element: 'Fusion',  scale: 2.3, tx: 2.5,  ty: 2.5 },
  jiyan:       { name: 'Jiyan',        element: 'Aero',    scale: 2.3, tx: 3,    ty: 2.5 },
  xiangliyao:  { name: 'Xiangli Yao',  element: 'Electro', scale: 2.3, tx: 1.5,  ty: 2.5 },
  changli:     { name: 'Changli',      element: 'Fusion',  scale: 2.3, tx: 0,    ty: 2.5 },
  chun:        { name: 'Chun',         element: 'Glacio',  scale: 2.3, tx: 2,    ty: 2.5 },
};

// Sprite spine — all skel/atlas/webp files live under app/public/portraits/<id>/.
// Each entry may carry per-surface tuning: the top-level scale/tx/ty apply on
// the Collection grid card (the default `card` context); an optional `detail`
// sub-object holds numbers for the CharacterDetailModal header surface, and
// an optional `echo` sub-object for the EchoDetailModal 48×48 icon. Untuned
// contexts fall back to SPRITE_DEF. Tune each surface live in the admin mini
// panel (Ctrl+Alt+P) and paste the export back here to promote.
const SPRITE_DEF = { scale: 2.3, tx: -3, ty: 27.5 };
// `dir` overrides the folder (used for Rover variants that share a portrait
// file across multiple entries). `detail` / `echo` carry per-surface defaults.
const spriteEntry = (name, element, portrait, extras = {}) => {
  const dir = extras.dir || portrait.toLowerCase();
  return {
    name, element,
    scale: extras.scale ?? SPRITE_DEF.scale,
    tx:    extras.tx    ?? SPRITE_DEF.tx,
    ty:    extras.ty    ?? SPRITE_DEF.ty,
    skelUrl:  `portraits/${dir}/Portraits_${portrait}.skel`,
    atlasUrl: `portraits/${dir}/Portraits_${portrait}.atlas`,
    ...(extras.detail ? { detail: extras.detail } : {}),
    ...(extras.echo   ? { echo:   extras.echo   } : {}),
  };
};

export const SPRITE_SPINE_CHARACTERS = {
  // Per-surface tuning promoted from live adjustments on device:
  //   top-level scale/tx/ty  → Collection grid card
  //   detail: { ... }         → CharacterDetailModal header
  fuluoluo:        spriteEntry('Phrolova',         'Havoc',   'Fuluoluo',
                      { scale: 2.4, tx: -1,   ty: 23,
                        detail: { scale: 3.1,  tx: 5,    ty: 32.5 } }),
  kanteleila:      spriteEntry('Cantarella',       'Havoc',   'Kanteleila',
                      { scale: 3.15, tx: 2,
                        detail: { scale: 3.05, tx: 7,    ty: 30.5 } }),
  luokeke:         spriteEntry('Roccia',           'Havoc',   'Luokeke',
                      { tx: -4, ty: 15,
                        detail: { scale: 2.5,  tx: 6,    ty: 20 } }),
  // Rover has no in-app gender selection — one shared skeleton/atlas per
  // element, keyed to the plain CHARACTER_DATA name so getSpineId(name)
  // actually resolves it (a prior "(Male)"/"(Female)" split here never
  // matched anything, since no call site ever passed a gender-suffixed
  // name — every Rover sprite lookup silently failed). rover_female is the
  // richer of the two source folders (3 webp variants vs rover_male's 1),
  // so it's the one in use; portraits/rover_male/ is kept on disk but
  // currently unreferenced.
  rover_havoc:     spriteEntry('Rover: Havoc',   'Havoc', 'Female', { dir: 'rover_female' }),
  chun:            spriteEntry('Camellya',         'Havoc',   'Chun',
                      { scale: 2.5,  tx: -2,  ty: 22.5,
                        detail: { scale: 2.95, tx: 4,    ty: 29.5 } }),
  danjin:          spriteEntry('Danjin',           'Havoc',   'Danjin',
                      { tx: 1, ty: 21,
                        detail: { scale: 2.55, tx: 8,    ty: 28 } }),
  taoqi:           spriteEntry('Taoqi',            'Havoc',   'Taoqi',
                      { scale: 2.15, tx: -1.5, ty: 20,
                        detail: { scale: 2.5,  tx: 7,    ty: 29 } }),
  luhesi:          spriteEntry('Luuk Herssen',     'Spectro', 'Luhesi',
                      { scale: 2.95, tx: 0.5,  ty: 27.5,
                        detail: { scale: 3.55, tx: 5,    ty: 32.5 } }),
  linnai:          spriteEntry('Lynae',            'Spectro', 'Linnai',
                      { scale: 2.3,  tx: 8.5,  ty: 22.5,
                        detail: { scale: 2.35, tx: 10,   ty: 29 } }),
  qianxiao:        spriteEntry('Chisa',            'Spectro', 'Qianxiao',
                      { scale: 2.7,  tx: 3,    ty: 21.5,
                        detail: { scale: 2.9,  tx: 7,    ty: 31 } }),
  zanni:           spriteEntry('Zani',             'Spectro', 'Zanni',
                      { scale: 2.55, tx: -4,   ty: 22,
                        detail: { scale: 3.15, tx: 4,    ty: 29 } }),
  feibi:           spriteEntry('Phoebe',           'Spectro', 'Feibi',
                      { tx: -11, ty: 21.5,
                        detail: { scale: 2.55, tx: 3.5,  ty: 28.5 } }),
  shouanren:       spriteEntry('Shorekeeper',      'Spectro', 'Shouanren',
                      { scale: 2.5,  tx: -10,  ty: 17.5,
                        detail: { scale: 2.9,  tx: 1.5,  ty: 24.5 } }),
  dengdeng:        spriteEntry('Lumi',             'Glacio',  'Dengdeng',
                      { ty: 21.5,
                        detail: { scale: 2.7,  tx: 5,    ty: 30 } }),
  weilinai:        spriteEntry('Verina',           'Spectro', 'Weilinai',
                      { scale: 1.85, tx: 1,    ty: 17,
                        detail: { scale: 2.3,  tx: 8.5,  ty: 25 } }),
  rover_spectro:   spriteEntry('Rover: Spectro', 'Spectro', 'Female', { dir: 'rover_female' }),
  xigelika:        spriteEntry('Sigrika',          'Aero',    'Xigelika',
                      { ty: 22,
                        detail: { scale: 2.7,  tx: 5,    ty: 28.5 } }),
  qiuyuan:         spriteEntry('Qiuyuan',          'Aero',    'Qiuyuan',
                      { scale: 2.85, tx: 7,    ty: 23.5,
                        detail: { scale: 3.25, tx: 7,    ty: 28.5 } }),
  younuo:          spriteEntry('Iuno',             'Aero',    'Younuo',
                      { scale: 2.45, tx: 1.5,  ty: 17,
                        detail: { scale: 2.6,  tx: 7.5,  ty: 26 } }),
  katixiya:        spriteEntry('Cartethyia',       'Aero',    'Katixiya',
                      { scale: 2.4,  tx: 3.5,  ty: 24.5,
                        detail: { scale: 2.8,  tx: 6.5,  ty: 30 } }),
  rover_aero:      spriteEntry('Rover: Aero',      'Aero', 'Female', { dir: 'rover_female' }),
  xiakong:         spriteEntry('Ciaccona',         'Aero',    'Xiakong',
                      { scale: 2.9,  tx: -8,   ty: 19,
                        detail: { scale: 3.25, tx: 1.5,  ty: 24.5 } }),
  jianxin:         spriteEntry('Jianxin',          'Aero',    'Jianxin',
                      { ty: 16.5,
                        detail: { scale: 2.65, tx: 6.5,  ty: 22.5 } }),
  jiyan:           spriteEntry('Jiyan',            'Aero',    'Jiyan',
                      { scale: 3.7,  tx: -2.5, ty: 21.5,
                        detail: { scale: 2.85, tx: 6,    ty: 29 } }),
  qiushui:         spriteEntry('Aalto',            'Aero',    'Qiushui',
                      { scale: 2.6,  ty: 18.5,
                        detail: { scale: 3.2,  tx: 3,    ty: 24.5 } }),
  yangyang:        spriteEntry('Yangyang',         'Aero',    'Yangyang',
                      { scale: 2.1,  tx: 3.5,  ty: 20,
                        detail: { scale: 2.55, tx: 7,    ty: 28 } }),
  buling:          spriteEntry('Buling',           'Havoc',   'Buling',
                      { scale: 2.3,  ty: 22.5,
                        detail: { scale: 2.35, tx: 7.5,  ty: 28 } }),
  aogusita:        spriteEntry('Augusta',          'Electro', 'Aogusita',
                      { scale: 2.95, tx: -3,   ty: 25,
                        detail: { scale: 3.15, tx: 4,    ty: 29.5 } }),
  xiangliyao:      spriteEntry('Xiangli Yao',      'Electro', 'Xiangliyao',
                      { scale: 2.75, tx: 13,   ty: 26,
                        detail: { scale: 2.8,  tx: 12.5, ty: 31.5 } }),
  jinxi:           spriteEntry('Jinhsi',           'Spectro', 'Jinxi',
                      { ty: 23.5,
                        detail: { scale: 2.8,  tx: 6,    ty: 30.5 } }),
  yuanwu:          spriteEntry('Yuanwu',           'Electro', 'Yuanwu',
                      { scale: 2.5,  tx: -7.5, ty: 23,
                        detail: { scale: 2.7,  tx: 4.5,  ty: 28 } }),
  yinlin:          spriteEntry('Yinlin',           'Electro', 'Yinlin',
                      { scale: 2.55, tx: -0.5, ty: 22.5,
                        detail: { scale: 2.75, tx: 7,    ty: 28.5 } }),
  kakaluo:         spriteEntry('Calcharo',         'Electro', 'Kakaluo',
                      { scale: 4.85, tx: -16,  ty: 13.5,
                        detail: { scale: 2.75, tx: -3.5, ty: 29.5 } }),
  rover_electro:   spriteEntry('Rover: Electro',   'Electro', 'Female', { dir: 'rover_female' }),
  // Daniya's webp is stored on the source's CDN as Portraits_DaNiYa.webp (mixed
  // case); the atlas references it verbatim and Spine resolves it relative to
  // atlasUrl, so we preserve the exact casing on disk.
  daniya:          spriteEntry('Denia',            'Electro', 'Daniya'),
  aimisi:          spriteEntry('Aemeath',          'Electro', 'Aimisi',
                      { scale: 2.3,  tx: 10,   ty: 22,
                        detail: { scale: 2.6,  tx: 7.5,  ty: 28.5 } }),
  moning:          spriteEntry('Mornye',           'Havoc',   'Moning',
                      { scale: 2.25, tx: -3,   ty: 19,
                        detail: { scale: 2.55, tx: 6,    ty: 24 } }),
  jiabeilina:      spriteEntry('Galbrena',         'Fusion',  'Jiabeilina',
                      { scale: 2.7,  tx: -11.5, ty: 19,
                        detail: { scale: 3.3,  tx: 0.5,  ty: 25.5 } }),
  lupa:            spriteEntry('Lupa',             'Fusion',  'Lupa',
                      { scale: 2.75, tx: -2,   ty: 11,
                        detail: { scale: 2.9,  tx: 3.5,  ty: 19 } }),
  bulante:         spriteEntry('Brant',            'Fusion',  'Bulante',
                      { scale: 2.75, tx: 5.5,  ty: 20.5,
                        detail: { scale: 2.8,  tx: 9,    ty: 25 } }),
  changli:         spriteEntry('Changli',          'Fusion',  'Changli',
                      { tx: -7.5, ty: 22.5,
                        detail: { scale: 2.75, tx: 4.5,  ty: 30 } }),
  motefei:         spriteEntry('Mortefi',          'Fusion',  'Motefei',
                      { scale: 2.6,  tx: -1,   ty: 23.5,
                        detail: { scale: 3.2,  tx: 4.5,  ty: 31 } }),
  anke:            spriteEntry('Encore',           'Fusion',  'Anke',
                      { scale: 1.8,  tx: 2,    ty: 18,
                        detail: { scale: 2.1,  tx: 11,   ty: 24.5 } }),
  feixue:          spriteEntry('Hiyuki',           'Glacio',  'Feixue'),
  kelaita:         spriteEntry('Carlotta',         'Fusion',  'Kelaita',
                      { scale: 2.2,  tx: -5,   ty: 23,
                        detail: { scale: 2.35, tx: 6,    ty: 28.5 } }),
  youhu:           spriteEntry('Youhu',            'Glacio',  'Youhu',
                      { scale: 2.1,  tx: 4,    ty: 21.5,
                        detail: { scale: 2.45, tx: -50,  ty: 26 } }),
  zhezhi:          spriteEntry('Zhezhi',           'Glacio',  'Zhezhi',
                      { scale: 2.75, tx: 2.5,  ty: 10.5,
                        detail: { scale: 3.35, tx: 6.5,  ty: 19 } }),
  lingyang:        spriteEntry('Lingyang',         'Glacio',  'Lingyang',
                      { scale: 1.8,  tx: -3,   ty: 16,
                        detail: { scale: 2,    tx: 7.5,  ty: 25.5 } }),
  baizhi:          spriteEntry('Baizhi',           'Glacio',  'Baizhi',
                      { tx: 1.5, ty: 21.5,
                        detail: { scale: 2.9,  tx: 7,    ty: 31 } }),
  sanhua:          spriteEntry('Sanhua',           'Glacio',  'Sanhua',
                      { scale: 2.4,  tx: -8,   ty: 21,
                        detail: { scale: 2.65, tx: 4,    ty: 30 } }),
  // Untuned — scale/tx/ty fall back to SPRITE_DEF until adjusted live in the
  // admin mini panel (Ctrl+Alt+P) and promoted here.
  luosela:         spriteEntry('Lucilla',           'Glacio',  'LuoSeLa'),
  suisui:          spriteEntry('Suisui',            'Glacio',  'Suisui'),
  rebecca:         spriteEntry('Rebecca',           'Electro', 'Rebecca'),
  qingxiao:        spriteEntry('Qingxiao',          'Aero',    'Qingxiao'),
  lucy:            spriteEntry('Lucy',              'Spectro', 'Lucy'),
  jingran:         spriteEntry('Jingran',           'Fusion',  'Jingran'),
  xuanling:        spriteEntry('Yangyang: Xuanling','Havoc',   'Xuanling'),
  xin:             spriteEntry('Hsin',              'Electro', 'Xin'),
  suoming:         spriteEntry('Suoming',           'Electro', 'Suoming'),
};

// Luckdraw spine — the game's UiLuckdraw/Spine/Character/C_<Id>_01 rig,
// sourced from encore.moe's character API (Hsin: character 1311, Iuno: character 1410,
// Chisa: character 1508, Suoming: character 1312, Lynae: character 1509, Lucilla: character 1109).
export const LUCKDRAW_SPINE_CHARACTERS = {
  // bannerViewport: the world-space rectangle her 1920x1080 banner art (characters/hsin/
  // Hsin_Banner.jpg) covers, so BannerCard can lay the rig exactly over the art. Measured by
  // SIFT-matching the big Hsin face in the art against the rig's idle frame 0 (26 inliers,
  // scale+translation fit, mean residual 1.04 px / max 1.92 px at the art's 1920 px width);
  // the rectangle's aspect (1.7779) matches the art's 16:9.
  xin: {
    name: 'Hsin', element: 'Electro', skelUrl: 'spine/role_xin/c_xin_01.skel', atlasUrl: 'spine/role_xin/c_xin_01.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -11935.70, y: -4706.75, width: 19621.63, height: 11036.39 },
  },
  // bannerViewport as for Hsin, here against banners/_shared/DPd6HgjH-iuno-banner.jpg: SIFT-matched
  // the rig's idle frame 0 to the art (141 inliers, scale+translation fit, mean residual 1.51 px /
  // max 3.61 px at the art's 1920 px width, rotation -0.07 deg; rectangle aspect 1.7777 vs 16:9).
  younuo: {
    name: 'Iuno', element: 'Aero', skelUrl: 'spine/role_younuo/c_younuo_1.skel', atlasUrl: 'spine/role_younuo/c_younuo_1.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -3483.49, y: -1247.44, width: 5742.48, height: 3230.26 },
  },
  // bannerViewport as for Hsin, here against banners/_shared/RTZ06knw-chisa-banner.jpg: SIFT-matched
  // the rig's idle frame 0 to the art (760 inliers, scale+translation fit, mean residual 1.78 px /
  // max 5.57 px at the art's 1920 px width, rotation -0.07 deg; rectangle aspect 1.7778 vs 16:9).
  qianxiao: {
    name: 'Chisa', element: 'Havoc', skelUrl: 'spine/role_qianxiao/c_qianxiao_1.skel', atlasUrl: 'spine/role_qianxiao/c_qianxiao_1.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -6535.70, y: -3815.38, width: 10500.47, height: 5906.51 },
  },
  // bannerViewport as for Hsin, here against characters/suoming/Suoming_Banner.webp: SIFT-matched
  // the rig's idle frame 0 to the art (709 inliers, scale+translation fit, mean residual 0.65 px /
  // max 2.76 px at the art's 1920 px width, rotation 0.00 deg; rectangle aspect 1.7778 vs 16:9).
  suoming: {
    name: 'Suoming', element: 'Electro', skelUrl: 'spine/role_suoming/c_suoming_01.skel', atlasUrl: 'spine/role_suoming/c_suoming_01.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -3444.29, y: -1068.60, width: 5540.17, height: 3116.35 },
  },
  // Lynae's Luckdraw rig shares role_linnai/ with her Spine 4.2 banner rig (c_linnai_1.atlas/.json/.png),
  // so its .atlas/.skel carry a _luckdraw suffix; its page stays c_linnai_1.webp as the atlas names it.
  // bannerViewport as for Hsin, against banners/_shared/h1Kwq7Vj-lynae-banner.jpg: SIFT-matched the rig's
  // idle frame 0 to the art (913 inliers, scale+translation fit, mean residual 0.80 px / max 4.19 px at
  // the art's 1920 px width, rotation 0.07 deg; rectangle aspect 1.7778 vs 16:9).
  linnai: {
    name: 'Lynae', element: 'Spectro', skelUrl: 'spine/role_linnai/c_linnai_1_luckdraw.skel', atlasUrl: 'spine/role_linnai/c_linnai_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -6810.28, y: -3714.54, width: 11801.05, height: 6638.09 },
    // tileViewport: the square the Assets-section tile plays her in. spine-player's default framing
    // (idle animation bounds + padding) left her frame-0 art at 63% x 44% of the tile; this square is
    // centred on that art (alpha > 40) with its 1.44:1 width filling 83% of the tile, Lucilla's fill.
    tileViewport: { x: -6055.27, y: -6968.64, width: 12808.06, height: 12808.06 },
  },
  // bannerViewport as for Hsin, against banners/_shared/zT91s0wt-Lucilla-banner.jpg (2048x1152): 744
  // inliers, mean residual 0.70 px / max 2.53 px at the art's 2048 px width, rotation 0.03 deg; aspect 1.7778.
  luosela: {
    name: 'Lucilla', element: 'Glacio', skelUrl: 'spine/role_luosela/c_luosela_01.skel', atlasUrl: 'spine/role_luosela/c_luosela_01.atlas',
    bannerArtSize: [2048, 1152],
    bannerViewport: { x: -7441.08, y: -3925.82, width: 12066.28, height: 6787.28 },
  },
  // Sigrika (character 1412): bannerViewport against banners/_shared/DHJ2YMTM-sigrika-banner.jpg (2560x1440): 1219 inliers,
  // mean residual 0.92 px / max 3.32 px at the art's 2560 px width, rotation 0.02 deg; aspect 1.7778.
  xigelika: {
    name: 'Sigrika', element: 'Aero', skelUrl: 'spine/role_xigelika/c_xigelika_1_luckdraw.skel', atlasUrl: 'spine/role_xigelika/c_xigelika_1_luckdraw.atlas',
    bannerArtSize: [2560, 1440],
    bannerViewport: { x: -4199.61, y: -2046.10, width: 6750.59, height: 3797.21 },
  },
  // Qiuyuan (character 1411): bannerViewport against banners/_shared/fd3D6QRx-qiuyuan-banner.jpg (2560x1440): 557 inliers,
  // mean residual 1.23 px / max 4.65 px at the art's 2560 px width, rotation 0.01 deg; aspect 1.7778.
  qiuyuan: {
    name: 'Qiuyuan', element: 'Aero', skelUrl: 'spine/role_qiuyuan/c_qiuyuan_1_luckdraw.skel', atlasUrl: 'spine/role_qiuyuan/c_qiuyuan_1_luckdraw.atlas',
    bannerArtSize: [2560, 1440],
    bannerViewport: { x: -2931.89, y: -1544.44, width: 5199.74, height: 2924.85 },
  },
  // Zani (character 1507): bannerViewport against banners/_shared/tMVkd4dg-zani-banner.jpg (2560x1440): 493 inliers,
  // mean residual 1.40 px / max 3.82 px at the art's 2560 px width, rotation 0.03 deg; aspect 1.7778.
  zanni: {
    name: 'Zani', element: 'Spectro', skelUrl: 'spine/role_zanni/c_zanni_1_luckdraw.skel', atlasUrl: 'spine/role_zanni/c_zanni_1_luckdraw.atlas',
    bannerArtSize: [2560, 1440],
    bannerViewport: { x: -3012.25, y: -1106.97, width: 6028.16, height: 3390.84 },
  },
  // Phoebe (character 1506): bannerViewport against banners/_shared/Tq7pFMgp-phoebe-banner.jpg (1920x1080): 1105 inliers,
  // mean residual 1.06 px / max 3.31 px at the art's 1920 px width, rotation 0.03 deg; aspect 1.7778.
  feibi: {
    name: 'Phoebe', element: 'Spectro', skelUrl: 'spine/role_feibi/c_feibi_1_luckdraw.skel', atlasUrl: 'spine/role_feibi/c_feibi_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -3694.64, y: -678.46, width: 6278.60, height: 3531.71 },
  },
  // Jinhsi (character 1304): bannerViewport against banners/_shared/7xBSVRbQ-jinhsi-banner.jpg (1920x1080): 136 inliers,
  // mean residual 1.09 px / max 4.53 px at the art's 1920 px width, rotation 0.52 deg; aspect 1.7778.
  jinxi: {
    name: 'Jinhsi', element: 'Spectro', skelUrl: 'spine/role_jinxi/c_jinxi_1_luckdraw.skel', atlasUrl: 'spine/role_jinxi/c_jinxi_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -6198.45, y: 276.77, width: 12381.34, height: 6964.51 },
  },
  // Roccia (character 1606): bannerViewport against banners/_shared/YYWVfxt-roccia-banner.jpg (1920x1080): 259 inliers,
  // mean residual 0.77 px / max 1.96 px at the art's 1920 px width, rotation -0.02 deg; aspect 1.7778.
  luokeke: {
    name: 'Roccia', element: 'Havoc', skelUrl: 'spine/role_luokeke/c_luokeke_1_luckdraw.skel', atlasUrl: 'spine/role_luokeke/c_luokeke_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -4315.86, y: -1902.31, width: 7401.43, height: 4163.30 },
  },
  // Yinlin (character 1302): bannerViewport against banners/_shared/Y4SDqwg2-yinlin-banner.jpg (1920x1080): 654 inliers,
  // mean residual 0.60 px / max 2.33 px at the art's 1920 px width, rotation -0.01 deg; aspect 1.7778.
  yinlin: {
    name: 'Yinlin', element: 'Electro', skelUrl: 'spine/role_yinlin/c_yinlin_1_luckdraw.skel', atlasUrl: 'spine/role_yinlin/c_yinlin_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -3081.22, y: -1367.27, width: 6134.14, height: 3450.45 },
  },
  // Brant (character 1206): bannerViewport against banners/_shared/vx8KGHcj-brant-banner.jpg (1920x1080): 584 inliers,
  // mean residual 0.82 px / max 2.49 px at the art's 1920 px width, rotation -0.02 deg; aspect 1.7778.
  bulante: {
    name: 'Brant', element: 'Fusion', skelUrl: 'spine/role_bulante/c_bulante_1_luckdraw.skel', atlasUrl: 'spine/role_bulante/c_bulante_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -4288.59, y: -1785.02, width: 6929.24, height: 3897.70 },
  },
  // Jiyan (character 1404): bannerViewport against banners/_shared/hFM8STLQ-jiyan-banner.jpg (1920x1080): 358 inliers,
  // mean residual 1.38 px / max 3.05 px at the art's 1920 px width, rotation -0.10 deg; aspect 1.7778.
  jiyan: {
    name: 'Jiyan', element: 'Aero', skelUrl: 'spine/role_jiyan/c_jiyan_1_luckdraw.skel', atlasUrl: 'spine/role_jiyan/c_jiyan_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -3378.79, y: -1334.88, width: 5396.09, height: 3035.30 },
  },
  // Changli (character 1205): bannerViewport against banners/_shared/HDZ1LG4R-changli-banner.jpg (1920x1080): 1021 inliers,
  // mean residual 0.69 px / max 2.79 px at the art's 1920 px width, rotation -0.01 deg; aspect 1.7778.
  changli: {
    name: 'Changli', element: 'Fusion', skelUrl: 'spine/role_changli/c_changli_1_luckdraw.skel', atlasUrl: 'spine/role_changli/c_changli_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -1019.99, y: -696.59, width: 2271.91, height: 1277.95 },
  },
  // Zhezhi (character 1105): bannerViewport against banners/_shared/XfkKS4dS-zhezhi-banner.jpg (1920x1080): 247 inliers,
  // mean residual 1.20 px / max 2.85 px at the art's 1920 px width, rotation -0.07 deg; aspect 1.7778.
  zhezhi: {
    name: 'Zhezhi', element: 'Glacio', skelUrl: 'spine/role_zhezhi/c_zhezhi_01.skel', atlasUrl: 'spine/role_zhezhi/c_zhezhi_01.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -8748.50, y: -557.41, width: 14682.74, height: 8259.04 },
  },
  // Xiangli Yao (character 1305): bannerViewport against banners/_shared/CphXJs9L-xiangli-yao-banner.jpg (1920x1080): 93 inliers,
  // mean residual 2.10 px / max 4.38 px at the art's 1920 px width, rotation -0.58 deg; aspect 1.7778.
  xiangliyao: {
    name: 'Xiangli Yao', element: 'Electro', skelUrl: 'spine/role_xiangliyao/c_xiangliyao_1_luckdraw.skel', atlasUrl: 'spine/role_xiangliyao/c_xiangliyao_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -3145.04, y: -1613.76, width: 5666.64, height: 3187.48 },
  },
  // Shorekeeper (character 1505): bannerViewport against banners/_shared/cKTnnDWB-shore-keeper-banner.jpg (1920x1080): 416 inliers,
  // mean residual 0.88 px / max 3.41 px at the art's 1920 px width, rotation -0.04 deg; aspect 1.7778.
  shouanren: {
    name: 'Shorekeeper', element: 'Spectro', skelUrl: 'spine/role_shouanren/c_shouanren_1.skel', atlasUrl: 'spine/role_shouanren/c_shouanren_1.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -3046.31, y: -1589.77, width: 6029.02, height: 3391.32 },
  },
  // Camellya (character 1603): bannerViewport against banners/_shared/20xFP1B1-camellya-banner.png (1920x1080): 896 inliers,
  // mean residual 1.31 px / max 3.00 px at the art's 1920 px width, rotation -0.02 deg; aspect 1.7778.
  chun: {
    name: 'Camellya', element: 'Havoc', skelUrl: 'spine/role_chun/c_chun_1_luckdraw.skel', atlasUrl: 'spine/role_chun/c_chun_1_luckdraw.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -2353.38, y: -1200.58, width: 4905.33, height: 2759.25 },
  },
  // Carlotta (character 1107): bannerViewport against banners/_shared/67r6NbMf-carlotta-banner.png (1920x1080): 1281 inliers,
  // mean residual 0.42 px / max 2.29 px at the art's 1920 px width, rotation -0.00 deg; aspect 1.7778.
  kelaita: {
    name: 'Carlotta', element: 'Glacio', skelUrl: 'spine/role_kelaita/c_kelaita_1.skel', atlasUrl: 'spine/role_kelaita/c_kelaita_1.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -3798.20, y: -686.06, width: 6066.76, height: 3412.55 },
  },
  // Cantarella (character 1607): bannerViewport against banners/_shared/wZ85YQzF-cantarella-banner.jpg (2560x1440): 314 inliers,
  // mean residual 1.27 px / max 3.74 px at the art's 2560 px width, rotation -0.00 deg; aspect 1.7778.
  kanteleila: {
    name: 'Cantarella', element: 'Havoc', skelUrl: 'spine/role_kanteleila/c_kanteleila_1.skel', atlasUrl: 'spine/role_kanteleila/c_kanteleila_1.atlas',
    bannerArtSize: [2560, 1440],
    bannerViewport: { x: -3662.51, y: -1497.79, width: 5920.75, height: 3330.42 },
  },
  // Ciaccona (character 1407): bannerViewport against banners/_shared/prXLxMyw-ciaconna-banner.jpg (2560x1440): 415 inliers,
  // mean residual 0.84 px / max 3.33 px at the art's 2560 px width, rotation -0.01 deg; aspect 1.7778.
  xiakong: {
    name: 'Ciaccona', element: 'Aero', skelUrl: 'spine/role_xiakong/c_xiakong_1.skel', atlasUrl: 'spine/role_xiakong/c_xiakong_1.atlas',
    bannerArtSize: [2560, 1440],
    bannerViewport: { x: -1721.60, y: -750.43, width: 2919.42, height: 1642.17 },
  },
  // Cartethyia (character 1409): bannerViewport against banners/_shared/Ppt1BXc-carthetya-banner.jpg (2560x1440): 396 inliers,
  // mean residual 1.66 px / max 4.67 px at the art's 2560 px width, rotation 0.01 deg; aspect 1.7778.
  katixiya: {
    name: 'Cartethyia', element: 'Aero', skelUrl: 'spine/role_katixiya/c_katixiya_1.skel', atlasUrl: 'spine/role_katixiya/c_katixiya_1.atlas',
    bannerArtSize: [2560, 1440],
    bannerViewport: { x: -4144.40, y: -1743.84, width: 6744.91, height: 3794.01 },
  },
  // Lupa (character 1207): bannerViewport against banners/_shared/9HBRhrjq-lupa-banner.jpg (1920x1080): 191 inliers,
  // mean residual 0.78 px / max 3.32 px at the art's 1920 px width, rotation 0.01 deg; aspect 1.7778.
  lupa: {
    name: 'Lupa', element: 'Fusion', skelUrl: 'spine/role_lupa/c_lupa_1.skel', atlasUrl: 'spine/role_lupa/c_lupa_1.atlas',
    bannerArtSize: [1920, 1080],
    bannerViewport: { x: -3454.51, y: -1136.44, width: 5573.67, height: 3135.19 },
  },
  // Phrolova (character 1608): bannerViewport against banners/_shared/QvHKLCgt-phrolova-banner.jpg (2560x1440): 798 inliers,
  // mean residual 0.88 px / max 5.08 px at the art's 2560 px width, rotation 0.00 deg; aspect 1.7778.
  fuluoluo: {
    name: 'Phrolova', element: 'Havoc', skelUrl: 'spine/role_fuluoluo/c_fuluoluo_1.skel', atlasUrl: 'spine/role_fuluoluo/c_fuluoluo_1.atlas',
    bannerArtSize: [2560, 1440],
    bannerViewport: { x: -2972.79, y: -1043.96, width: 5626.73, height: 3165.04 },
  },
  // Augusta (character 1306): bannerViewport against banners/_shared/4wbJgQGj-augusta-banner.jpg (2560x1440): 885 inliers,
  // mean residual 0.90 px / max 3.82 px at the art's 2560 px width, rotation 0.00 deg; aspect 1.7778.
  augusta: {
    name: 'Augusta', element: 'Electro', skelUrl: 'spine/role_augusta/c_augusta_1.skel', atlasUrl: 'spine/role_augusta/c_augusta_1.atlas',
    bannerArtSize: [2560, 1440],
    bannerViewport: { x: -3606.84, y: -1645.00, width: 5604.16, height: 3152.34 },
  },
};

// Merged view for lookup by surface-prefixed id. Keys collide between the two
// source maps; prefixing disambiguates. `surface` attaches to each entry so
// the player / admin panel can tell them apart without re-checking the map.
export const SPINE_CHARACTERS = {
  ...Object.fromEntries(
    Object.entries(BANNER_SPINE_CHARACTERS).map(([k, v]) => [`banner:${k}`, { ...v, surface: 'banner' }]),
  ),
  ...Object.fromEntries(
    Object.entries(SPRITE_SPINE_CHARACTERS).map(([k, v]) => [`sprite:${k}`, { ...v, surface: 'collection' }]),
  ),
  ...Object.fromEntries(
    Object.entries(LUCKDRAW_SPINE_CHARACTERS).map(([k, v]) => [`luckdraw:${k}`, { ...v, surface: 'luckdraw' }]),
  ),
};

const BANNER_NAME_TO_KEY = Object.fromEntries(
  Object.entries(BANNER_SPINE_CHARACTERS).map(([k, v]) => [v.name.toLowerCase(), k]),
);
const SPRITE_NAME_TO_KEY = Object.fromEntries(
  Object.entries(SPRITE_SPINE_CHARACTERS).map(([k, v]) => [v.name.toLowerCase(), k]),
);
const LUCKDRAW_NAME_TO_KEY = Object.fromEntries(
  Object.entries(LUCKDRAW_SPINE_CHARACTERS).map(([k, v]) => [v.name.toLowerCase(), k]),
);

// Feature flag: sprite-surface Spine animations (SPRITE_SPINE_CHARACTERS) are
// limited to the character detail modal's full-spine viewer panel. Every
// other sprite call site (collection grid, detail-modal header preview, echo
// "recommended for" avatars) gates on this and falls back to a static image
// when it's false. Kept as a single flag here rather than deleting those call
// sites, so re-enabling sprite surfaces elsewhere is a one-line change.
export const SPINE_SPRITES_ENABLED_OUTSIDE_PANEL = false;

export function getSpineId(displayName, { surface = 'banner' } = {}) {
  if (!displayName) return null;
  const lc = displayName.toLowerCase();
  if (surface === 'collection') {
    const key = SPRITE_NAME_TO_KEY[lc];
    return key ? `sprite:${key}` : null;
  }
  if (surface === 'luckdraw') {
    const key = LUCKDRAW_NAME_TO_KEY[lc];
    return key ? `luckdraw:${key}` : null;
  }
  const key = BANNER_NAME_TO_KEY[lc];
  return key ? `banner:${key}` : null;
}

function SpinePlayerComponent({
  characterId,
  animation = 'idle',
  loop = true,
  className = '',
  style = {},
  showControls = false,
  backgroundColor = '#00000000',
  onError,
  paused = false,
  scaleOverride,
  txOverride,
  tyOverride,
  fallbackImgUrl = null,
  fallbackImgStyle = null,
  context = 'card',
  // Fixed world-space camera {x, y, width, height} (no padding) instead of
  // spine-player's auto-fit to the skeleton bounds — used to register a rig
  // exactly onto a same-aspect image behind it.
  viewport = null,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  // Tier 0 — Pre-rendered idle loop (WebM or animated WebP, whichever
  // exists on disk). The build-time manifest at
  // app/src/shared/spinePrerenderManifest.js lists which sprite characters
  // have a prerender plus the format. We only attempt the tier-0 path
  // when the manifest knows about it, so chars without a prerender skip
  // the 404 and go straight to live WebGL. Regenerated by tools/build-
  // prerender-manifest.mjs (auto-runs as a `prebuild` step).
  const charDataLookup = SPINE_CHARACTERS[characterId];
  // Pass characterId so banner entries (no skelUrl on the registry) can be
  // resolved via their `banner:<id>` prefix.
  // The `full` context (character-detail modal's full-spine viewer) skips
  // tier 0 on purpose: its whole point is showing the real, hi-res live
  // skeleton, not the small pre-baked idle loop optimized for grid/header
  // thumbnails — going straight to tier 1 avoids that loop reading as a
  // near-static clip at showcase size.
  const prerenderEntry = context === 'full' ? null : getPrerenderedIdle(charDataLookup, characterId);
  const [prerenderFailed, setPrerenderFailed] = useState(false);
  const usePrerender = !!prerenderEntry && !prerenderFailed;
  // Gates the MP4/WebM prerender <video>'s opacity until it actually has a
  // decodable frame — portraits/spine (this data) are excluded from the
  // native bundle (see capacitor-build/build.mjs) and fetched over the
  // network at runtime, so on a slow connection a <video> with no data yet
  // renders as the browser's generic media-player glyph instead of staying
  // invisible over the static art behind it.
  const [videoReady, setVideoReady] = useState(false);
  const lastVideoSrcRef = useRef(null);

  // Tier 1 gating — WebGL spine is expensive (one context per instance);
  // browsers cap concurrent contexts. We only mount it when the wrapper is
  // actually in the viewport AND a global concurrency-budget slot is free.
  // Otherwise the static fallback img renders in its place until both
  // conditions are satisfied.
  const [wrapRef, inView] = useInView();
  const slotId = useId();
  const wantWebGL = !!charDataLookup && !usePrerender && !failed;
  const granted = useSpineBudget(slotId, wantWebGL && inView);
  const useWebGL = wantWebGL && inView && granted;

  useEffect(() => {
    if (!useWebGL) return undefined;
    if (!containerRef.current || !characterId || failed) return undefined;
    const charData = SPINE_CHARACTERS[characterId];
    if (!charData) { setFailed(true); return; }
    // Sprite-spine assets (skelUrl) are exported from Spine 4.1 and need the
    // secondary runtime at window.spine41. Banner-spine JSONs run on 4.2.
    // Both runtimes are loaded dynamically (main.jsx's loadSpineRuntimes,
    // kicked off once the boot splash starts fading) rather than as static
    // synchronous <script> tags now — normally long done loading by the
    // time a user reaches any Spine-animated view, but the !spineLib check
    // right below is the real guard for the rare case they aren't yet
    // (falls back to setFailed rather than throwing).
    const spineLib = charData.skelUrl ? window.spine41 : window.spine;
    if (!spineLib?.SpinePlayer) {
      setFailed(true);
      return;
    }

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    containerRef.current.innerHTML = '';

    // Strip the surface prefix when constructing banner asset URLs.
    const bareId = characterId.replace(/^(banner|sprite):/, '');
    const basePath = `spine/role_${bareId}`;
    const prefix = `c_${bareId}_1`;
    const assetUrls = charData.skelUrl
      ? { skelUrl: charData.skelUrl, atlasUrl: charData.atlasUrl }
      : { jsonUrl: `${basePath}/${prefix}.json`, atlasUrl: `${basePath}/${prefix}.atlas` };

    try {
      playerRef.current = new spineLib.SpinePlayer(containerRef.current, {
        ...assetUrls,
        animation,
        loop,
        showControls,
        backgroundColor,
        alpha: true,
        premultipliedAlpha: false,
        showLoading: true,
        ...(viewport ? { viewport: { ...viewport, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0, transitionTime: 0 } } : {}),
        success: (player) => {
          if (paused && player && player.animationState) {
            try { player.animationState.timeScale = 0; } catch (_) {}
          }
        },
        error: (player, msg) => {
          if (containerRef.current) containerRef.current.innerHTML = '';
          setFailed(true);
          if (onError) onError(characterId, msg);
        },
      });
    } catch (err) {
      if (containerRef.current) containerRef.current.innerHTML = '';
      setFailed(true);
      if (onError) onError(characterId, err);
    }

    return () => {
      if (playerRef.current) {
        try { playerRef.current.dispose(); } catch (_) {}
        playerRef.current = null;
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [characterId, animation, loop, showControls, backgroundColor, failed, paused, useWebGL, viewport]);

  const charData = SPINE_CHARACTERS[characterId] || {};
  // Tuning is stored per (characterId, context) pair so the grid card, the
  // detail-modal header, and the echo "Recommended For" icon can each have
  // independent scale/tx/ty. The `card` context is the backwards-compatible
  // default — it inherits the numeric fields off the SPINE_CHARACTERS entry
  // so existing Phrolova tuning promoted into the registry still applies.
  const tuningKey = context && context !== 'card' ? `${characterId}#${context}` : characterId;
  const [tuning] = useSpineTuning(tuningKey);
  const isDefaultContext = !context || context === 'card';
  // Per-context defaults live in sub-objects on the registry entry
  // (`charData.detail`, `charData.echo`). An untuned context falls back to
  // the `card` baseline (top-level scale/tx/ty) rather than identity
  // (1/0/0) — a character's card framing is already a much closer starting
  // point than "no zoom at all", since every character needs *some* zoom to
  // fill its box (the source art/skeleton bounds include a lot of surrounding
  // space). The admin panel's sliders still start from this same baseline
  // and the user can promote a dedicated per-context tuning from there.
  const ctxDefaults = isDefaultContext ? charData : (charData[context] || charData);
  const defScale = ctxDefaults.scale ?? 1;
  const defTx = ctxDefaults.tx ?? 0;
  const defTy = ctxDefaults.ty ?? 0;
  // Resolution order: explicit *Override prop > live tuning (mini panel) > registry default.
  const scale = scaleOverride !== undefined ? scaleOverride : (tuning.scale ?? defScale);
  const tx = txOverride !== undefined ? txOverride : (tuning.tx ?? defTx);
  const ty = tyOverride !== undefined ? tyOverride : (tuning.ty ?? defTy);

  // Replace `transform: scale(N) translate(tx%, ty%)` with absolute
  // positioning so the inner element gets actual width/height = N×100%.
  // Why: spine-player creates its canvas at the container's CSS size, and
  // a static <img> samples down to its layout box. CSS `transform: scale()`
  // doesn't add pixels — it interpolates the existing rendered size, so
  // anything tuned with scale > 1 was being upscaled with browser
  // smoothing. Sizing the inner element directly to scale×parent makes
  // the canvas (or img) physically larger, and modern browsers sample the
  // skel/atlas/webp source at the higher target — same visual placement,
  // crisp output.
  //
  // The visual placement math: CSS `scale(s) translate(tx%, ty%)` first
  // scales, then translates by tx% of the SCALED element. To get the
  // identical center using absolute positioning on an N×100% box:
  //     left% = 50 × (1 − s) + tx × s
  //     top%  = 50 × (1 − s) + ty × s
  // (verified on paper: scale=2, tx=10 → left=−30%, identical visual
  // center to the original transform.)
  const isIdentityFit = scale === 1 && !tx && !ty;
  const fitStyle = isIdentityFit
    ? { width: '100%', height: '100%' }
    : {
        position: 'absolute',
        width: `${scale * 100}%`,
        height: `${scale * 100}%`,
        left: `${50 * (1 - scale) + tx * scale}%`,
        top: `${50 * (1 - scale) + ty * scale}%`,
      };

  // Render branches all share the same outer wrapper so the IntersectionObserver
  // ref stays attached across tier transitions (otherwise the observer would
  // re-init on every state flip).
  let inner = null;

  if (failed) {
    // Hard fail — neither tier 0 nor tier 1 worked. Show the static portrait
    // (which uses its own framing config from the call site, NOT spine
    // tuning, because the static art is a different image than the spine).
    inner = fallbackImgUrl ? (
      <img
        src={fallbackImgUrl}
        alt=""
        loading="lazy"
        className="w-full h-full pointer-events-none"
        style={{ objectFit: 'contain', ...fallbackImgStyle }}
      />
    ) : null;
  } else if (usePrerender) {
    // Tier 0 — pre-rendered idle loop. Animated WebP -> <img>, WebM ->
    // <video> (autoplay loop muted playsinline). Same content as the spine
    // canvas, so spine fit (scale/tx/ty) applies. Absolute-positioned at
    // scale×100% so the asset renders at native source resolution instead
    // of being CSS-upscaled.
    //
    // Manifest URLs are stored relative (no leading '/') so the build
    // script stays path-agnostic. Coerce to absolute here so the browser
    // resolves them against the app root, not the current SPA route.
    const rawUrl = prerenderEntry.url;
    const absUrl = rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl;
    // Prerenders are captured WITH the spine fit transform already baked
    // in (the dev panel records the live spine canvas after scale/tx/ty
    // have been applied). Re-applying `fitStyle` to the prerendered media
    // would double-position it — pushing the character out of the visible
    // band when the original tuning included a non-zero ty (e.g. Zani
    // banner ty=-7). Use a plain fill-the-wrapper style instead.
    const prerenderFill = { width: '100%', height: '100%' };
    if (prerenderEntry.format === 'tmf') {
      // TMF prerender — vendored player at /vendor/tmf/. Element is
      // registered on first script load (idempotent inside the module).
      // We inject a <script type="module"> rather than a dynamic import()
      // because Rollup tries to statically resolve leading-`/` import
      // specifiers at build time and fails (the file is a public-folder
      // asset, not a bundled module). The script tag is a pure runtime
      // load — the bundler never sees it.
      if (typeof document !== 'undefined'
          && !customElements.get('tmf-player')
          && !document.querySelector('script[data-tmf-player]')) {
        const s = document.createElement('script');
        s.type = 'module';
        s.src = '/vendor/tmf/tmf-player-element.mjs';
        s.dataset.tmfPlayer = '1';
        s.onerror = () => setPrerenderFailed(true);
        document.head.appendChild(s);
      }
      inner = (
        <tmf-player
          src={absUrl}
          autoplay=""
          loop=""
          muted=""
          class="pointer-events-none"
          style={{ objectFit: 'contain', ...prerenderFill }}
          onError={() => setPrerenderFailed(true)}
        />
      );
    } else if (prerenderEntry.format === 'video') {
      // MP4 prerenders have no alpha — captured against pure black. The SVG
      // filter injected at module top maps black → transparent at decode
      // time, with smooth alpha on antialiased edges. WebM (VP9) carries
      // real alpha and skips the filter.
      //
      // objectFit: 'cover' rather than 'contain' — captures are square
      // (1024×1024 typical) but BannerCard is rectangular. With 'contain'
      // the square video gets letterboxed inside the wide rectangle, the
      // transparent margins reveal the static banner art beneath, and the
      // character looks small + obscured. 'cover' fills the container by
      // cropping the top/bottom of the square — those are transparent
      // margins anyway since the character is centered, so nothing visible
      // is lost.
      const isMp4 = /\.mp4(?:$|\?)/i.test(rawUrl);
      // Adjust videoReady when the source changes — the officially
      // sanctioned "reset state on prop change during render" pattern
      // (see videoReady's declaration above for why).
      if (lastVideoSrcRef.current !== absUrl) {
        lastVideoSrcRef.current = absUrl;
        if (videoReady) setVideoReady(false);
      }
      inner = (
        <video
          src={absUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="pointer-events-none"
          style={{
            objectFit: 'contain',
            transform: 'scale(1.5)',
            transformOrigin: 'center',
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.3s ease',
            ...(isMp4 ? { filter: `url(#${SVG_FILTER_ID})` } : null),
            ...prerenderFill,
          }}
          onLoadedData={() => setVideoReady(true)}
          onLoadedMetadata={(e) => { e.currentTarget.playbackRate = 0.5; }}
          onError={() => setPrerenderFailed(true)}
        />
      );
    } else {
      inner = (
        <img
          src={absUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="pointer-events-none"
          style={{ objectFit: 'contain', ...prerenderFill }}
          onError={() => setPrerenderFailed(true)}
        />
      );
    }
  } else if (useWebGL) {
    // Tier 1 — live WebGL spine. Container sized to scale×100% so the
    // canvas's pixel buffer scales with it (spine-player allocates
    // canvas.width × devicePixelRatio pixels, so a bigger CSS box means
    // a higher-resolution render — no CSS upscaling).
    inner = <div ref={containerRef} style={fitStyle} />;
  } else if (fallbackImgUrl) {
    // Off-screen / waiting for a budget slot — show the static portrait
    // until we can mount the live spine. Same as the `failed` branch:
    // static config, not spine config.
    inner = (
      <img
        src={fallbackImgUrl}
        alt=""
        loading="lazy"
        className="w-full h-full pointer-events-none"
        style={{ objectFit: 'contain', ...fallbackImgStyle }}
      />
    );
  }

  if (inner === null && (failed || !wantWebGL) && !fallbackImgUrl) return null;

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
    >
      {inner}
    </div>
  );
}

export const SpinePlayer = memo(SpinePlayerComponent);
export default SpinePlayer;
