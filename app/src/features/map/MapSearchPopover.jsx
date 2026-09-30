// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/MapSearchPopover.jsx
// Header-anchored search panel (magnifying-glass button). Pure UI: the query,
// the selected result, saved tags and the "focus" they put on the map all live
// in MapTab.jsx, which owns the Leaflet map and the icon canvas. Matching and
// ranking are in mapSearch.js.
//
//   • type → ranked result list (keyboard: ↑/↓, Enter, Esc), matches highlighted
//   • pick a result → the map dims every other icon, frames the matches, and a
//     bar lets you step through them one by one (‹ 3 / 12 ›) or re-frame them
//   • save a result as a tag under the search bar; tags stay applied after the
//     panel closes and can be toggled on/off or removed individually
//   • empty query → recent searches + quick suggestions
//   • optimized route through the selection's icons (toggle), and per saved tag a
//     route on/off, a colour and a line style (solid, dashes, dots, dash-dot)
//   • route options: where routes start (best start, a map tap, a pin/icon set from its
//     card) and linking every shown route into one optimized path
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Maximize2, BookmarkPlus, Map as MapIcon, History, SearchX, Spline, Link2, Crosshair, CheckCheck, Camera, Zap } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../shared/components/Card.jsx';
import { searchMap, highlightRanges } from './mapSearch.js';
import { getIconImageUrl } from './iconImageCache.js';
import { t } from '../../utils/i18n.js';

const LISTBOX_ID = 'map-search-results';

function Highlighted({ text, query }) {
  const ranges = highlightRanges(text, query);
  if (!ranges.length) return text;
  const parts = [];
  let at = 0;
  ranges.forEach(([s, e], i) => {
    if (s > at) parts.push(text.slice(at, s));
    parts.push(<mark key={i} className="map-search-mark">{text.slice(s, e)}</mark>);
    at = e;
  });
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

function ResultThumb({ doc }) {
  const url = doc.kind ? getIconImageUrl(doc.kind) : null;
  if (url) return <img src={url} alt="" className="map-search-thumb" />;
  return <span className="map-search-thumb map-search-thumb-glyph" aria-hidden="true"><MapIcon size={12} /></span>;
}

const typeLabel = (doc) => t(`map.search.type.${doc.type}`);

const LINE_STYLES = [
  { id: 'solid', key: 'lineSolid', dash: '' },
  { id: 'dashed', key: 'lineDashed', dash: '6 4' },
  { id: 'dotted', key: 'lineDotted', dash: '1 3' },
  { id: 'dashdot', key: 'lineDashDot', dash: '6 3 1 3' },
];

// Small preview of a line style in a given colour.
function LineSample({ dash, color }) {
  return (
    <svg width="24" height="8" viewBox="0 0 24 8" aria-hidden="true">
      <line x1="1" y1="4" x2="23" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dash} strokeLinecap={dash === '1 3' ? 'round' : 'butt'} />
    </svg>
  );
}

export function MapSearchPopover({
  panelRef,
  top,
  maxHeight,
  index,
  query,
  setQuery,
  selected,            // doc | null — the result currently focused on the map
  onSelect,            // (doc) => void
  onClearSelection,
  focus,               // { total, visible, otherFloors, step } | null — for the selection bar
  onStep,
  onFoundNext,         // () => void | null — mark the current stop found, go to the next
  stepFound,           // the current stop is already found              // (+1 | -1) => void
  onFrame,             // () => void — re-frame all focused icons
  tags,                // [{ key, label, context, active, route, color, line }]
  tagCounts,           // Map<key, number>
  onSaveTag,           // (doc) => void
  onToggleTag,
  onUpdateTag,         // (key, { route?, color?, line? }) => void
  routeOn,             // route line through the selection's icons
  onToggleRoute,
  routeStops,          // stops on the selection's route (current floor)
  routeColors,         // colours a tag's route can use
  routeActive,         // some route is (or can be) shown — reveals the route options
  routeStart,          // { x, y, floor, label } | null
  routeStartPicking,
  onPickRouteStart,
  onClearRouteStart,
  routeLinked,
  onToggleRouteLinked,
  linkableCount,       // routes that linking would merge
  routeTeleport,       // long legs start from the nearest teleporter
  onToggleRouteTeleport,
  onExportRoutes,      // () => void | null — save the routes on the map as an image
  routeExporting,
  onRemoveTag,         // (key) => void
  onClearTags,
  recent,              // [key]
  onClearRecent,
  suggestions,         // doc[]
  onClose,
}) {
  const inputRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  // The result list is shown while typing; picking a result collapses it so
  // the selection bar and the map stay visible, until the query changes again.
  const [listOpen, setListOpen] = useState(!selected);

  const results = useMemo(() => (query.trim() ? searchMap(index, query) : []), [index, query]);
  const partial = results.length > 0 && results[0].partial;

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setActiveIdx(0); }, [query]);

  const choose = (doc) => {
    if (!doc) return;
    onSelect(doc);
    setListOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setListOpen(true); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (listOpen && results[activeIdx]) choose(results[activeIdx].doc); }
    else if (e.key === 'Escape') {
      e.preventDefault();
      if (query) { setQuery(''); setListOpen(true); } else onClose();
    }
  };

  const [styleKey, setStyleKey] = useState(null);
  const styleTag = styleKey ? tags.find(tg => tg.key === styleKey) : null;
  const tagColor = (tg) => tg.color || routeColors[tags.indexOf(tg) % routeColors.length];
  const showList = listOpen && query.trim().length > 0;
  const savedKeys = new Set(tags.map(tg => tg.key));
  const recentDocs = recent.map(k => index.byKey.get(k)).filter(Boolean);

  return (
    <div
      ref={panelRef}
      className="map-search-popover"
      role="dialog"
      aria-label={t('map.search.title')}
      onClick={(e) => e.stopPropagation()}
      style={{ top: `${top}px`, maxHeight }}
    >
      <Card>
        <CardHeader
          action={
            <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={onClose} aria-label={t('map.search.close')} title={t('map.search.close')}>
              <X size={14} />
            </button>
          }
        >
          {t('map.search.header')}
        </CardHeader>
        <CardBody className="map-search-body">
          {/* ── Search bar ── */}
          <div className="map-search-bar">
            <Search size={14} className="map-search-bar-icon" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              className="map-search-input"
              value={query}
              placeholder={t('map.search.placeholder')}
              onChange={(e) => { setQuery(e.target.value); setListOpen(true); }}
              onFocus={() => { if (query) setListOpen(true); }}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded={showList}
              aria-controls={LISTBOX_ID}
              aria-autocomplete="list"
              aria-activedescendant={showList && results[activeIdx] ? `map-search-opt-${activeIdx}` : undefined}
              aria-label={t('map.search.placeholder')}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* ── Saved tags ── */}
          {tags.length > 0 && (
            <div className="map-search-tags" role="group" aria-label={t('map.search.savedTags')}>
              {tags.map(tg => {
                const n = tagCounts.get(tg.key) ?? 0;
                return (
                  <span key={tg.key} className={`map-search-tag ${tg.active ? 'is-active' : ''} ${n === 0 ? 'is-empty' : ''}`}>
                    <button
                      type="button"
                      className="map-search-tag-toggle"
                      onClick={() => onToggleTag(tg.key)}
                      aria-pressed={tg.active}
                      title={[tg.label, tg.context].filter(Boolean).join(' · ')}
                    >
                      <span className="map-search-tag-name">{tg.label}{tg.context ? <span className="map-search-tag-ctx"> · {tg.context}</span> : null}</span>
                      {n > 1 && <span className="map-search-tag-count">{n}</span>}
                    </button>
                    <button
                      type="button"
                      className="map-search-tag-style"
                      onClick={() => setStyleKey(k => (k === tg.key ? null : tg.key))}
                      aria-expanded={styleKey === tg.key}
                      aria-label={t('map.search.tagStyle', { name: tg.label })}
                      title={t('map.search.tagStyle', { name: tg.label })}
                    >
                      <span className={`map-search-tag-swatch ${tg.route ? '' : 'is-off'}`} style={{ background: tagColor(tg) }} />
                    </button>
                    <button type="button" className="map-search-tag-remove" onClick={() => onRemoveTag(tg.key)} aria-label={t('map.search.removeTag', { name: tg.label })}>
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
              {tags.length > 1 && (
                <button type="button" className="map-search-link" onClick={onClearTags}>{t('map.search.clearTags')}</button>
              )}
            </div>
          )}

          {/* ── Route options: start point and linking ── */}
          {routeActive && (
            <div className="map-search-style" role="group" aria-label={t('map.search.routeOptions')}>
              <div className="map-search-style-row">
                <span className="map-search-style-label">{t('map.search.routeStart')}</span>
                <span className="map-search-route-note">
                  {routeStart ? (routeStart.label || t('map.search.startPoint')) : t('map.search.startAuto')}
                </span>
              </div>
              <div className="map-search-style-row">
                <button type="button" className={`kuro-btn kuro-btn-sm map-search-line ${routeStartPicking ? 'active-gold' : ''}`} onClick={onPickRouteStart}>
                  <Crosshair size={12} aria-hidden="true" /> {t('map.search.pickStart')}
                </button>
                {routeStart && (
                  <button type="button" className="kuro-btn kuro-btn-sm map-search-line" onClick={onClearRouteStart}>{t('map.search.startAuto')}</button>
                )}
              </div>
              <div className="map-search-route-note">{t('map.search.startFromCard')}</div>
              <div className="map-search-style-row">
                <button
                  type="button"
                  className={`kuro-btn kuro-btn-sm map-search-line ${routeTeleport ? 'active-gold' : ''}`}
                  aria-pressed={routeTeleport}
                  onClick={onToggleRouteTeleport}
                >
                  <Zap size={12} aria-hidden="true" /> {t('map.search.useTeleports')}
                </button>
                {onExportRoutes && (
                  <button type="button" className="kuro-btn kuro-btn-sm map-search-line" onClick={onExportRoutes} disabled={routeExporting}>
                    <Camera size={12} aria-hidden="true" /> {t('map.search.exportRoute')}
                  </button>
                )}
              </div>
              {linkableCount > 1 && (
                <div className="map-search-style-row">
                  <button
                    type="button"
                    className={`kuro-btn kuro-btn-sm map-search-line ${routeLinked ? 'active-gold' : ''}`}
                    aria-pressed={routeLinked}
                    onClick={onToggleRouteLinked}
                  >
                    <Link2 size={12} aria-hidden="true" /> {routeLinked ? t('map.search.unlinkRoutes') : t('map.search.linkRoutes', { count: linkableCount })}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Style of one saved tag: route on/off, colour, line style ── */}
          {styleTag && (
            <div className="map-search-style" role="group" aria-label={t('map.search.tagStyle', { name: styleTag.label })}>
              <div className="map-search-style-head">
                <span>{t('map.search.tagStyle', { name: styleTag.label })}</span>
                <button type="button" className="kuro-btn kuro-btn-sm" onClick={() => setStyleKey(null)}>{t('map.search.styleDone')}</button>
              </div>
              <div className="map-search-style-row">
                <span className="map-search-style-label">{t('map.search.tagRoute')}</span>
                <button
                  type="button"
                  className={`kuro-btn kuro-btn-sm map-search-line ${styleTag.route ? 'active-gold' : ''}`}
                  aria-pressed={!!styleTag.route}
                  onClick={() => onUpdateTag(styleTag.key, { route: !styleTag.route, active: true })}
                >
                  <Spline size={12} aria-hidden="true" /> {styleTag.route ? t('map.search.routeHide') : t('map.search.route')}
                </button>
              </div>
              <div className="map-search-style-row" role="radiogroup" aria-label={t('map.search.tagColor')}>
                <span className="map-search-style-label">{t('map.search.tagColor')}</span>
                {routeColors.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={tagColor(styleTag) === c}
                    aria-label={t('map.search.colorN', { n: i + 1 })}
                    className={`map-search-color ${tagColor(styleTag) === c ? 'is-active' : ''}`}
                    onClick={() => onUpdateTag(styleTag.key, { color: c })}
                  >
                    <span className="map-search-color-dot" style={{ background: c }} />
                  </button>
                ))}
              </div>
              <div className="map-search-style-row" role="radiogroup" aria-label={t('map.search.tagLine')}>
                <span className="map-search-style-label">{t('map.search.tagLine')}</span>
                {LINE_STYLES.map(ls => (
                  <button
                    key={ls.id}
                    type="button"
                    role="radio"
                    aria-checked={(styleTag.line || 'dashed') === ls.id}
                    className={`kuro-btn kuro-btn-sm map-search-line ${(styleTag.line || 'dashed') === ls.id ? 'active-gold' : ''}`}
                    onClick={() => onUpdateTag(styleTag.key, { line: ls.id })}
                  >
                    <LineSample dash={ls.dash} color={tagColor(styleTag)} /> {t(`map.search.${ls.key}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Selection bar ── */}
          {selected && !showList && (
            <div className="map-search-selection" role="status">
              <ResultThumb doc={selected} />
              <div className="map-search-selection-text">
                <div className="map-search-row-label">{selected.label}</div>
                <div className="map-search-row-ctx">
                  {focus ? t('map.search.shownCount', { count: focus.visible }) : typeLabel(selected)}
                  {focus?.otherFloors > 0 && <> · {t('map.search.otherFloors', { count: focus.otherFloors })}</>}
                </div>
              </div>
              {focus && focus.total > 1 && (
                <div className="map-search-stepper">
                  <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={() => onStep(-1)} aria-label={t('map.search.prev')} title={t('map.search.prev')}><ChevronLeft size={14} /></button>
                  <span className="map-search-step-count" aria-live="polite">{focus.step >= 0 ? `${focus.step + 1} / ${focus.total}` : `– / ${focus.total}`}</span>
                  <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={() => onStep(1)} aria-label={t('map.search.next')} title={t('map.search.next')}><ChevronRight size={14} /></button>
                </div>
              )}
              <div className="map-search-actions">
              {focus && focus.total > 0 && (
                <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={onFrame} aria-label={t('map.search.frameAll')} title={t('map.search.frameAll')}><Maximize2 size={14} /></button>
              )}
              {focus && focus.total > 1 && (
                <button
                  type="button"
                  className={`kuro-btn kuro-btn-sm kuro-btn-icon ${routeOn ? 'active-gold' : ''}`}
                  onClick={onToggleRoute}
                  aria-pressed={routeOn}
                  aria-label={routeOn ? t('map.search.routeHide') : t('map.search.route')}
                  title={routeOn ? t('map.search.routeHide') : t('map.search.route')}
                >
                  <Spline size={14} />
                </button>
              )}
              <button
                type="button"
                className="kuro-btn kuro-btn-sm kuro-btn-icon"
                onClick={() => onSaveTag(selected)}
                disabled={savedKeys.has(selected.key)}
                aria-label={savedKeys.has(selected.key) ? t('map.search.saved') : t('map.search.saveTag')}
                title={savedKeys.has(selected.key) ? t('map.search.saved') : t('map.search.saveTag')}
              >
                <BookmarkPlus size={14} />
              </button>
              <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={onClearSelection} aria-label={t('map.search.clearSelection')} title={t('map.search.clearSelection')}><X size={14} /></button>
              </div>
            </div>
          )}
          {selected && !showList && routeOn && routeStops > 1 && (
            <div className="map-search-route-note" role="status">
              {t('map.search.routeStops', { count: routeStops })} · {t('map.search.routeNote')}
            </div>
          )}
          {selected && !showList && onFoundNext && (
            <div className="map-search-style-row">
              <button type="button" className="kuro-btn kuro-btn-sm map-search-line active-gold" onClick={onFoundNext}>
                <CheckCheck size={12} aria-hidden="true" />
                {focus && focus.step < 0 ? t('map.search.startRun') : stepFound ? t('map.search.nextStop') : t('map.search.foundNext')}
              </button>
            </div>
          )}

          {/* ── Results ── */}
          {showList && (
            results.length === 0 ? (
              <div className="map-search-empty">
                <SearchX size={16} aria-hidden="true" />
                <div>
                  <div>{t('map.search.noResults', { query: query.trim() })}</div>
                  <div className="map-search-row-ctx">{t('map.search.noResultsHint')}</div>
                </div>
              </div>
            ) : (
              <>
                {partial && (
                  <div className="map-search-note">{t('map.search.partial', { words: results[0].missing.join(', ') })}</div>
                )}
                <ul id={LISTBOX_ID} className="map-search-list" role="listbox" aria-label={t('map.search.results')}>
                  {results.map(({ doc }, i) => (
                    <li
                      key={doc.key}
                      id={`map-search-opt-${i}`}
                      role="option"
                      aria-selected={i === activeIdx}
                      className={`map-search-row ${i === activeIdx ? 'is-active' : ''}`}
                      onMouseEnter={() => setActiveIdx(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(doc)}
                    >
                      <ResultThumb doc={doc} />
                      <div className="map-search-row-text">
                        <div className="map-search-row-label"><Highlighted text={doc.label} query={query} /></div>
                        <div className="map-search-row-ctx">
                          {typeLabel(doc)}{doc.context ? <> · <Highlighted text={doc.context} query={query} /></> : null}
                        </div>
                      </div>
                      <span className="kuro-badge map-search-count">{doc.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )
          )}

          {/* ── Empty state: recent + suggestions ── */}
          {!query.trim() && !selected && (
            <div className="map-search-idle">
              {recentDocs.length > 0 && (
                <div className="map-search-section">
                  <div className="map-search-section-head">
                    <span><History size={12} aria-hidden="true" /> {t('map.search.recent')}</span>
                    <button type="button" className="map-search-link" onClick={onClearRecent}>{t('map.search.clearRecent')}</button>
                  </div>
                  <ul className="map-search-list">
                    {recentDocs.map(doc => (
                      <li key={doc.key}>
                        <button type="button" className="map-search-row" onClick={() => choose(doc)}>
                          <ResultThumb doc={doc} />
                          <div className="map-search-row-text">
                            <div className="map-search-row-label">{doc.label}</div>
                            <div className="map-search-row-ctx">{typeLabel(doc)}{doc.context ? ` · ${doc.context}` : ''}</div>
                          </div>
                          <span className="kuro-badge map-search-count">{doc.count}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="map-search-section">
                <div className="map-search-section-head"><span>{t('map.search.suggestions')}</span></div>
                <div className="map-search-chips">
                  {suggestions.map(doc => (
                    <button key={doc.key} type="button" className="kuro-btn kuro-btn-sm map-search-chip" onClick={() => choose(doc)}>
                      {doc.kind && <img src={getIconImageUrl(doc.kind)} alt="" className="map-search-chip-img" />}
                      {doc.label}
                    </button>
                  ))}
                </div>
                <div className="map-search-row-ctx map-search-tip">{t('map.search.tip')}</div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
