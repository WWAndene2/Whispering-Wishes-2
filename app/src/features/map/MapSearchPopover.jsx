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
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Maximize2, BookmarkPlus, Map as MapIcon, History, SearchX } from 'lucide-react';
import { Card, CardBody } from '../../shared/components/Card.jsx';
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
  onStep,              // (+1 | -1) => void
  onFrame,             // () => void — re-frame all focused icons
  tags,                // [{ key, label, context, active }]
  tagCounts,           // Map<key, number>
  onSaveTag,           // (doc) => void
  onToggleTag,         // (key) => void
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
            {query && (
              <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={() => { setQuery(''); setListOpen(true); inputRef.current?.focus(); }} aria-label={t('map.search.clearQuery')} title={t('map.search.clearQuery')}>
                <X size={14} />
              </button>
            )}
            <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={onClose} aria-label={t('map.search.close')} title={t('map.search.close')}>✕</button>
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
