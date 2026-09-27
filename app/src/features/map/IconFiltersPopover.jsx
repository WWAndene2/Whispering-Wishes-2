// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/IconFiltersPopover.jsx (extracted from MapTab.jsx)
// Header-anchored "Icon filters" panel — builds a category → subcategory
// tree from the currently placed icons and lets the user toggle visibility
// per category/subcategory. Pure UI; iconFiltersOff state and the
// toggleIconFilter handler stay in MapTab.jsx (persisted to localStorage,
// also consumed by the map-render effect that filters visible icons).
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../shared/components/Card.jsx';
import { t } from '../../utils/i18n.js';
import { getIconImageUrl } from './iconImageCache.js';

// Explicit priority for known subcategories (Nexus before Beacon); anything
// else falls back to alphabetical order after these.
const SUBCATEGORY_ORDER = ['Nexus', 'Beacon'];
function compareSubcategories(a, b) {
  const ia = SUBCATEGORY_ORDER.indexOf(a);
  const ib = SUBCATEGORY_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? SUBCATEGORY_ORDER.length : ia) - (ib === -1 ? SUBCATEGORY_ORDER.length : ib);
  return a.localeCompare(b);
}

// Explicit priority for known top-level categories (Zone before Resonance
// — direct user request); anything else falls back to alphabetical order
// after these.
const CATEGORY_ORDER = ['Zone', 'Resonance'];
function compareCategories(a, b) {
  const ia = CATEGORY_ORDER.indexOf(a);
  const ib = CATEGORY_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? CATEGORY_ORDER.length : ia) - (ib === -1 ? CATEGORY_ORDER.length : ib);
  return a.localeCompare(b);
}

export function IconFiltersPopover({
  panelRef,
  top,
  maxHeight,
  iconDrafts,
  getIconCatalogEntry,
  iconFiltersOff,
  toggleIconFilter,
  setAllIconFilters,
  l3ZoneCount = 0,
  onClose,
}) {
  // Build a nested category → [group →] subcategory tree from the placed
  // icons. Counts roll up to every parent. Keys use "Category/Subcategory"
  // (and "Category/Group" for the optional catalog `group` level, e.g.
  // Collectible › Chest › Supply Chest) so iconFiltersOff can target any
  // level; hiding a parent cascades to its children via the render-time
  // filter.
  // category → { total, subs: Map<name, { n, subs?: Map<sub, n> }> } — an
  // entry with its own `subs` is a group.
  const tree = new Map();
  for (const ic of iconDrafts) {
    const kind = getIconCatalogEntry(ic.kind);
    const cat = ic.category || kind?.category || 'Uncategorised';
    const sub = ic.subcategory || kind?.subcategory || '';
    const group = kind?.group || '';
    if (!tree.has(cat)) tree.set(cat, { total: 0, subs: new Map() });
    const entry = tree.get(cat);
    entry.total++;
    if (group) {
      if (!entry.subs.has(group)) entry.subs.set(group, { n: 0, subs: new Map(), subKinds: new Map() });
      const g = entry.subs.get(group);
      g.n++;
      if (sub) {
        g.subs.set(sub, (g.subs.get(sub) || 0) + 1);
        if (!g.subKinds.has(sub)) g.subKinds.set(sub, new Set());
        g.subKinds.get(sub).add(ic.kind);
      }
    } else if (sub) {
      if (!entry.subs.has(sub)) entry.subs.set(sub, { n: 0, kinds: new Set() });
      entry.subs.get(sub).n++;
      entry.subs.get(sub).kinds.add(ic.kind);
    }
  }
  // Synthetic "Zone" category — not derived from placed icons at all (L3
  // zone Names/Area map layers instead), but toggled through the exact same
  // iconFiltersOff mechanism so it needs no separate show/hide plumbing.
  // Direct user request.
  if (l3ZoneCount > 0) {
    tree.set('Zone', { total: l3ZoneCount, subs: new Map([['Names', { n: l3ZoneCount }], ['Area', { n: l3ZoneCount }]]) });
  }
  const cats = [...tree.entries()].sort((a, b) => compareCategories(a[0], b[0]));
  // Only leaf rows (a single kind, e.g. Nexus / Supply Chest) show an icon,
  // right after the name; categories and groups never do, even
  // while they happen to hold a single kind.
  const rowIcon = (kinds) => {
    if (!kinds || kinds.size !== 1) return null;
    const url = getIconImageUrl([...kinds][0]);
    return url ? <img src={url} alt="" className="map-filters-icon" /> : null;
  };
  // Every filter key shown in this panel (categories + their subcategories),
  // for the Hide all / Show all button.
  const allKeys = cats.flatMap(([cat, entry]) => [cat, ...[...entry.subs.entries()].flatMap(([name, node]) => [
    `${cat}/${name}`, ...(node.subs ? [...node.subs.keys()].map(sub => `${cat}/${sub}`) : []),
  ])]);
  const allHidden = cats.length > 0 && cats.every(([cat]) => iconFiltersOff.has(cat));

  return (
    <div
      ref={panelRef}
      className="map-filters-popover"
      role="dialog"
      aria-label={t('map.header.iconFilters')}
      onClick={(e) => e.stopPropagation()}
      style={{ top: `${top}px`, maxHeight }}
    >
      <Card>
        <CardHeader
          action={
            <>
              {cats.length > 0 && (
                <button
                  type="button"
                  className="kuro-btn kuro-btn-sm kuro-btn-icon"
                  onClick={() => setAllIconFilters(allKeys, !allHidden)}
                  aria-label={allHidden ? t('map.legend.showAll') : t('map.legend.hideAll')}
                  title={allHidden ? t('map.legend.showAll') : t('map.legend.hideAll')}
                >
                  {allHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              )}
              <button
                type="button"
                className="kuro-btn kuro-btn-sm kuro-btn-icon"
                onClick={onClose}
                aria-label={t('map.wip.close')}
              >
                {/* Same 14px lucide glyph as the Hide/Show all button beside it — a
                    text ✕ sits at a font-dependent height and looked misaligned. */}
                <X size={14} />
              </button>
            </>
          }
        >
          {t('map.header.iconFilters')}
        </CardHeader>
        <CardBody className="map-filters-body">
          {cats.length === 0 ? (
            <div className="zone-selector-empty">
              {t('map.legend.noIconsPlaced')}
            </div>
          ) : (
            <div className="map-filters-list">
              {cats.map(([cat, entry]) => {
                const catOff = iconFiltersOff.has(cat);
                const subs = [...entry.subs.entries()].sort((a, b) => compareSubcategories(a[0], b[0]));
                // One toggle row for a group or subcategory, `depth` levels under the category.
                const renderRow = (name, n, depth, parentOff, parentName, kinds, leaf) => {
                  const key = `${cat}/${name}`;
                  const ownOff = iconFiltersOff.has(key);
                  // Effectively hidden when any parent is hidden — reflected
                  // visually without persisting state.
                  const effectiveOff = parentOff || ownOff;
                  return (
                    <div key={key} className="zone-selector-row" style={{ paddingLeft: `calc(${depth} * var(--space-md, 12px))` }}>
                      <button
                        type="button"
                        className={`kuro-btn kuro-btn-sm zone-selector-item ${effectiveOff ? '' : 'is-current'}`}
                        onClick={() => toggleIconFilter(key)}
                        aria-pressed={!effectiveOff}
                        disabled={parentOff}
                        title={parentOff
                          ? t('map.legend.parentHidden', { name: parentName })
                          : (ownOff ? t('map.legend.show', { name }) : t('map.legend.hide', { name }))}
                      >
                        <span className="zone-selector-caret">{effectiveOff ? '▢' : '▣'}</span>
                        <span className="zone-selector-name">{name}</span>
                        {leaf && rowIcon(kinds)}
                        <span className="kuro-badge kuro-badge-neutral" style={{ marginLeft: 'auto' }}>{n}</span>
                      </button>
                    </div>
                  );
                };
                return (
                  <React.Fragment key={cat}>
                    <div className="zone-selector-row">
                      <button
                        type="button"
                        className={`kuro-btn kuro-btn-sm zone-selector-item ${catOff ? '' : 'is-current'}`}
                        onClick={() => toggleIconFilter(cat)}
                        aria-pressed={!catOff}
                        title={catOff ? t('map.legend.show', { name: cat }) : t('map.legend.hide', { name: cat })}
                      >
                        <span className="zone-selector-caret">{catOff ? '▢' : '▣'}</span>
                        <span className="zone-selector-name">{cat}</span>
                        <span className="kuro-badge kuro-badge-neutral" style={{ marginLeft: 'auto' }}>{entry.total}</span>
                      </button>
                    </div>
                    {subs.map(([name, node]) => (
                      <React.Fragment key={name}>
                        {renderRow(name, node.n, 1, catOff, cat, node.subs ? null : node.kinds, !node.subs)}
                        {node.subs && [...node.subs.entries()].sort((a, b) => compareSubcategories(a[0], b[0]))
                          .map(([sub, n]) => renderRow(sub, n, 2, catOff || iconFiltersOff.has(`${cat}/${name}`), catOff ? cat : name, node.subKinds.get(sub), true))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
