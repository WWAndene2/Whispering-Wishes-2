// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/IconKindPicker.jsx
// Author-panel picker for an icon kind, built to stay usable with hundreds of
// catalog entries: search (same matching as the map search — typos, synonyms,
// French, class / element / Sonata set / tags), category tabs, class chips,
// favourites and recently used kinds (both remembered), and a count of how
// many icons of each kind are already placed. Pure UI: MapTab decides what a
// pick does (start stamping, or change an existing icon's kind).
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Star, X } from 'lucide-react';
import { MAP_ICON_CATALOG, ENEMY_CLASS_ORDER } from '../../data/mapIconCatalog.js';
import { searchIconKinds } from './mapSearch.js';
import { getIconImageUrl } from './iconImageCache.js';

const FAVORITES_KEY = 'ww-icon-picker-favorites';
const RECENT_KEY = 'ww-icon-picker-recent';
const RECENT_MAX = 12;
const CATEGORY_ORDER = ['Resonance', 'Collectible', 'Enemy'];

const readList = (key) => {
  try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
};
const writeList = (key, list) => { try { localStorage.setItem(key, JSON.stringify(list)); } catch {} };

/** Records a kind as recently used (called by MapTab whenever a pick is applied). */
export function rememberRecentIconKind(kindId) {
  writeList(RECENT_KEY, [kindId, ...readList(RECENT_KEY).filter(k => k !== kindId)].slice(0, RECENT_MAX));
}

const categoryRank = (c) => { const i = CATEGORY_ORDER.indexOf(c); return i === -1 ? CATEGORY_ORDER.length : i; };
const subRank = (s) => { const i = ENEMY_CLASS_ORDER.indexOf(s); return i === -1 ? ENEMY_CLASS_ORDER.length : i; };

export function IconKindPicker({ title, currentKind, placedCounts, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');        // 'all' | 'favorites' | 'recent' | <category>
  const [sub, setSub] = useState(null);         // subcategory chip within a category tab
  const [favorites, setFavorites] = useState(() => new Set(readList(FAVORITES_KEY)));
  const recent = useMemo(() => readList(RECENT_KEY), []);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const categories = useMemo(
    () => [...new Set(MAP_ICON_CATALOG.map(k => k.category || 'Uncategorised'))].sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b)),
    [],
  );
  const subsOfTab = useMemo(() => {
    if (!categories.includes(tab)) return [];
    const subs = [...new Set(MAP_ICON_CATALOG.filter(k => k.category === tab).map(k => k.group || k.subcategory).filter(Boolean))];
    return subs.length > 1 ? subs.sort((a, b) => subRank(a) - subRank(b) || a.localeCompare(b)) : [];
  }, [tab, categories]);

  const toggleFavorite = (id) => setFavorites(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    writeList(FAVORITES_KEY, [...next]);
    return next;
  });

  // Kinds in scope for the current tab / chip, then ranked by the query.
  const results = useMemo(() => {
    let scope = MAP_ICON_CATALOG;
    if (tab === 'favorites') scope = scope.filter(k => favorites.has(k.id));
    else if (tab === 'recent') scope = recent.map(id => MAP_ICON_CATALOG.find(k => k.id === id)).filter(Boolean);
    else if (tab !== 'all') scope = scope.filter(k => k.category === tab && (!sub || (k.group || k.subcategory) === sub));
    return searchIconKinds(scope, query);
  }, [tab, sub, query, favorites, recent]);

  // Without a query, group the grid under "Category › Class" headings.
  const groups = useMemo(() => {
    if (query.trim() || tab === 'recent') return [[null, results]];
    const map = new Map();
    for (const k of results) {
      const label = [k.category, k.group || k.subcategory].filter(Boolean).join(' › ');
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(k);
    }
    return [...map.entries()]
      .map(([label, kinds]) => [label, [...kinds].sort((a, b) => a.name.localeCompare(b.name))])
      .sort((a, b) => {
        const [ka, kb] = [a[1][0], b[1][0]];
        return categoryRank(ka.category) - categoryRank(kb.category) || subRank(ka.subcategory) - subRank(kb.subcategory) || a[0].localeCompare(b[0]);
      });
  }, [results, query, tab]);

  const pick = (kind) => { rememberRecentIconKind(kind.id); onPick(kind); };

  const tabs = [
    ['all', `All (${MAP_ICON_CATALOG.length})`],
    ...categories.map(c => [c, `${c} (${MAP_ICON_CATALOG.filter(k => k.category === c).length})`]),
    ['favorites', `★ ${favorites.size}`],
    ['recent', 'Recent'],
  ];

  return (
    <div className="icon-picker" role="dialog" aria-label={title}>
      <div className="icon-picker-head">
        <span className="icon-picker-title">{title}</span>
        <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={onClose} aria-label="Close" title="Close (Esc)"><X size={14} /></button>
      </div>
      <div className="icon-picker-search">
        <Search size={14} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder={`Search ${MAP_ICON_CATALOG.length} icons — name, class, element, set…`}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) { e.preventDefault(); pick(results[0]); }
            else if (e.key === 'Escape') { e.preventDefault(); if (query) setQuery(''); else onClose(); }
          }}
          aria-label="Search icons"
        />
      </div>
      <div className="icon-picker-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id}
            className={`kuro-btn kuro-btn-sm ${tab === id ? 'is-active' : ''}`}
            onClick={() => { setTab(id); setSub(null); }}>{label}</button>
        ))}
      </div>
      {subsOfTab.length > 0 && (
        <div className="icon-picker-tabs is-sub">
          <button type="button" className={`kuro-btn kuro-btn-sm ${!sub ? 'is-active' : ''}`} onClick={() => setSub(null)}>All</button>
          {subsOfTab.map(s => (
            <button key={s} type="button" className={`kuro-btn kuro-btn-sm ${sub === s ? 'is-active' : ''}`} onClick={() => setSub(s)}>{s}</button>
          ))}
        </div>
      )}
      <div className="icon-picker-body">
        {results.length === 0 && (
          <div className="hint">{tab === 'favorites' && !query ? 'No favourites yet — star an icon to pin it here.' : tab === 'recent' && !query ? 'Nothing used yet.' : 'No icon matches.'}</div>
        )}
        {groups.map(([label, kinds]) => (
          <div key={label || 'results'} className="icon-picker-group">
            {label && <div className="icon-picker-group-label">{label} <span>{kinds.length}</span></div>}
            <div className="icon-picker-grid">
              {kinds.map(k => {
                const n = placedCounts.get(k.id) || 0;
                return (
                  <div key={k.id} className={`icon-picker-tile ${k.id === currentKind ? 'is-current' : ''}`}>
                    <button type="button" className="icon-picker-pick" onClick={() => pick(k)} title={[k.name, k.subcategory, ...(k.tags || []).slice(2, 4)].filter(Boolean).join(' · ')}>
                      <img src={getIconImageUrl(k.id)} alt="" loading="lazy" />
                      <span className="icon-picker-name">{k.name}</span>
                    </button>
                    {n > 0 && <span className="icon-picker-count" title={`${n} placed`}>{n}</span>}
                    <button type="button" className={`icon-picker-fav ${favorites.has(k.id) ? 'is-on' : ''}`}
                      onClick={() => toggleFavorite(k.id)}
                      aria-pressed={favorites.has(k.id)}
                      aria-label={favorites.has(k.id) ? `Unstar ${k.name}` : `Star ${k.name}`}>
                      <Star size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
